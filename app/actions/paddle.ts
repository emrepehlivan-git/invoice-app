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

/**
 * Get checkout data for a Paddle payment
 * Returns the data needed for frontend to open Paddle checkout
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

    // Members can initiate payment
    await verifyAccess(invoice.organizationId, "read");

    // Check invoice status
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

    // Check if customer has email
    if (!invoice.customer.email) {
      return actionError(
        ErrorCode.VALIDATION_ERROR,
        "Customer email is required for online payment"
      );
    }

    // Calculate remaining amount
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
