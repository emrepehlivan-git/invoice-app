"use server";

import { prisma } from "@/lib/db";
import { verifyAccess } from "@/lib/auth/rbac";
import { InvoiceStatus } from "@/types";
import {
  type ActionResult,
  handleActionError,
  actionError,
  actionSuccess,
  assertExists,
  ErrorCode,
} from "@/lib/errors";
import { isPaddleSandbox } from "@/lib/paddle/client";
import { createInvoiceCheckout } from "@/lib/paddle/service";

export interface PaddleCheckoutData {
  invoiceId: string;
  organizationId: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  currency: string;
  invoiceNumber: string;
  sandbox: boolean;
}

export interface PaddleTransactionResult {
  transactionId: string;
  checkoutUrl?: string;
}

/**
 * Create a Paddle transaction for the invoice (with invoice total) and return transactionId.
 * Client should then call Paddle.Checkout.open({ transactionId }).
 */
export async function createPaddleTransaction(
  invoiceId: string,
  successUrl?: string
): Promise<ActionResult<PaddleTransactionResult>> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        organization: true,
        payments: true,
      },
    });
    assertExists(invoice, "Invoice", invoiceId);

    await verifyAccess(invoice.organizationId, "read");

    if (
      invoice.status === InvoiceStatus.DRAFT ||
      invoice.status === InvoiceStatus.CANCELLED
    ) {
      return actionError(
        ErrorCode.VALIDATION_ERROR,
        "Cannot pay draft or cancelled invoices"
      );
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return actionError(ErrorCode.VALIDATION_ERROR, "Invoice is already paid");
    }

    if (!invoice.customer.email) {
      return actionError(
        ErrorCode.VALIDATION_ERROR,
        "Customer email is required for online payment"
      );
    }

    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const remainingAmount = Number(invoice.total) - totalPaid;

    if (remainingAmount <= 0) {
      return actionError(ErrorCode.VALIDATION_ERROR, "Invoice is already paid");
    }

    const result = await createInvoiceCheckout({
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      customerEmail: invoice.customer.email,
      customerName: invoice.customer.name,
      amount: remainingAmount,
      currency: invoice.currency,
      successUrl,
    });

    if (!result.success || !result.transactionId) {
      return actionError(
        ErrorCode.VALIDATION_ERROR,
        result.error ?? "Failed to create payment session"
      );
    }

    return actionSuccess({
      transactionId: result.transactionId,
      checkoutUrl: result.checkoutUrl,
    });
  } catch (error) {
    return handleActionError(error, "createPaddleTransaction", { invoiceId });
  }
}

/**
 * Get checkout data for a Paddle payment (legacy / info only).
 * For opening checkout with invoice amount, use createPaddleTransaction then Checkout.open({ transactionId }).
 */
export async function getPaddleCheckoutData(
  invoiceId: string
): Promise<ActionResult<PaddleCheckoutData>> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        organization: true,
        payments: true,
      },
    });
    assertExists(invoice, "Invoice", invoiceId);

    await verifyAccess(invoice.organizationId, "read");

    if (
      invoice.status === InvoiceStatus.DRAFT ||
      invoice.status === InvoiceStatus.CANCELLED
    ) {
      return actionError(
        ErrorCode.VALIDATION_ERROR,
        "Cannot pay draft or cancelled invoices"
      );
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return actionError(ErrorCode.VALIDATION_ERROR, "Invoice is already paid");
    }

    if (!invoice.customer.email) {
      return actionError(
        ErrorCode.VALIDATION_ERROR,
        "Customer email is required for online payment"
      );
    }

    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const remainingAmount = Number(invoice.total) - totalPaid;

    if (remainingAmount <= 0) {
      return actionError(ErrorCode.VALIDATION_ERROR, "Invoice is already paid");
    }

    return actionSuccess({
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      customerEmail: invoice.customer.email,
      customerName: invoice.customer.name,
      amount: remainingAmount,
      currency: invoice.currency,
      invoiceNumber: invoice.invoiceNumber,
      sandbox: isPaddleSandbox(),
    });
  } catch (error) {
    return handleActionError(error, "getPaddleCheckoutData", { invoiceId });
  }
}
