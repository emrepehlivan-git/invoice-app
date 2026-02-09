"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { PaymentMethod, InvoiceStatus } from "@/types";
import type { Payment } from "@/types";
import logger from "@/lib/logger";
import { Decimal } from "@/prisma/generated/prisma/runtime/library";
import { auditCreate, auditDelete, auditStatusChange } from "@/lib/audit";
import { verifyAccess } from "@/lib/auth/rbac";
import {
  ErrorCode,
  type ActionResult,
  type SimpleResult,
  handleActionError,
  actionError,
  actionSuccess,
  simpleSuccess,
  simpleError,
  assertExists,
} from "@/lib/errors";

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().min(0.01).max(99999999),
  paymentDate: z.coerce.date(),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

type PaymentInput = z.infer<typeof paymentSchema>;

/**
 * Create a new payment for an invoice
 */
export async function createPayment(
  organizationId: string,
  data: PaymentInput
): Promise<ActionResult<Payment>> {
  try {
    // Members can create payments
    await verifyAccess(organizationId, "create");

    const validated = paymentSchema.parse(data);

    // Verify invoice belongs to organization
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: validated.invoiceId,
        organizationId,
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      return actionError(ErrorCode.NOT_FOUND, "Invoice not found");
    }

    // Check if invoice is in a state that accepts payments
    if (
      invoice.status === InvoiceStatus.DRAFT ||
      invoice.status === InvoiceStatus.CANCELLED
    ) {
      return actionError(
        ErrorCode.VALIDATION_ERROR,
        "Cannot add payment to draft or cancelled invoices"
      );
    }

    // Calculate total paid amount
    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const invoiceTotal = Number(invoice.total);
    const remainingAmount = invoiceTotal - totalPaid;

    // Validate payment amount doesn't exceed remaining
    if (validated.amount > remainingAmount + 0.01) {
      return actionError(
        ErrorCode.VALIDATION_ERROR,
        `Payment amount exceeds remaining balance of ${remainingAmount.toFixed(2)}`
      );
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: validated.invoiceId,
        organizationId,
        amount: new Decimal(validated.amount.toFixed(2)),
        paymentDate: validated.paymentDate,
        method: validated.method,
        reference: validated.reference || null,
        notes: validated.notes || null,
      },
    });

    // Check if invoice is fully paid and update status
    const newTotalPaid = totalPaid + validated.amount;
    if (newTotalPaid >= invoiceTotal - 0.01) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.PAID },
      });

      await auditStatusChange(
        "Invoice",
        invoice.id,
        invoice.status,
        InvoiceStatus.PAID,
        organizationId
      );
    }

    revalidatePath("/");

    await auditCreate(
      "Payment",
      payment.id,
      {
        invoiceId: payment.invoiceId,
        amount: Number(payment.amount),
        method: payment.method,
      },
      organizationId
    );

    return actionSuccess(payment);
  } catch (error) {
    return handleActionError(error, "createPayment", { organizationId, data });
  }
}

/**
 * Delete a payment
 */
export async function deletePayment(paymentId: string): Promise<SimpleResult> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
      },
    });
    assertExists(payment, "Payment", paymentId);

    // Only admins can delete payments
    await verifyAccess(payment.organizationId, "delete");

    // Get invoice with all payments to check status
    const invoice = await prisma.invoice.findUnique({
      where: { id: payment.invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      return simpleError(ErrorCode.NOT_FOUND, "Invoice not found");
    }

    // Delete the payment
    await prisma.payment.delete({
      where: { id: paymentId },
    });

    // Recalculate if invoice should be marked as not paid
    const remainingPayments = invoice.payments.filter((p) => p.id !== paymentId);
    const totalPaid = remainingPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const invoiceTotal = Number(invoice.total);

    // If invoice was PAID and now it's not fully paid, change status
    if (invoice.status === InvoiceStatus.PAID && totalPaid < invoiceTotal - 0.01) {
      // Determine new status based on due date
      const now = new Date();
      const dueDate = new Date(invoice.dueDate);
      const newStatus =
        dueDate < now ? InvoiceStatus.OVERDUE : InvoiceStatus.SENT;

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: newStatus },
      });

      await auditStatusChange(
        "Invoice",
        invoice.id,
        InvoiceStatus.PAID,
        newStatus,
        payment.organizationId
      );
    }

    revalidatePath("/");

    await auditDelete(
      "Payment",
      paymentId,
      {
        invoiceId: payment.invoiceId,
        amount: Number(payment.amount),
        method: payment.method,
      },
      payment.organizationId
    );

    return simpleSuccess();
  } catch (error) {
    const result = handleActionError(error, "deletePayment", { paymentId });
    return simpleError(result.error, result.message);
  }
}

/**
 * Get payments for an invoice
 */
export async function getInvoicePayments(
  invoiceId: string
): Promise<Payment[]> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return [];
    }

    // All members can read payments
    await verifyAccess(invoice.organizationId, "read");

    const payments = await prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: "desc" },
    });

    return payments;
  } catch {
    return [];
  }
}

/**
 * Get payment summary for an invoice
 */
export type PaymentSummary = {
  totalPaid: number;
  remainingAmount: number;
  paymentCount: number;
  isFullyPaid: boolean;
};

export async function getInvoicePaymentSummary(
  invoiceId: string
): Promise<PaymentSummary | null> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      return null;
    }

    await verifyAccess(invoice.organizationId, "read");

    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const invoiceTotal = Number(invoice.total);
    const remainingAmount = Math.max(0, invoiceTotal - totalPaid);

    return {
      totalPaid,
      remainingAmount,
      paymentCount: invoice.payments.length,
      isFullyPaid: remainingAmount < 0.01,
    };
  } catch {
    return null;
  }
}
