/**
 * Paddle Service
 *
 * High-level functions for Paddle payment operations.
 */

import { getPaddleClient } from "./client";
import { prisma } from "@/lib/db";
import { InvoiceStatus, PaymentMethod } from "@/types";
import { Decimal } from "@/prisma/generated/prisma/runtime/library";
import { auditCreate, auditStatusChange } from "@/lib/audit";
import logger from "@/lib/logger";

export interface CreateCheckoutParams {
  invoiceId: string;
  organizationId: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  currency: string;
  successUrl?: string;
  locale?: string;
}

export interface CheckoutResult {
  success: boolean;
  transactionId?: string;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Create a Paddle transaction for invoice payment with the actual invoice amount.
 * Uses a non-catalog custom product and price (no product ID required).
 * Returns transactionId so the client can open Checkout.open({ transactionId }).
 */
export async function createInvoiceCheckout(
  params: CreateCheckoutParams
): Promise<CheckoutResult> {
  try {
    const paddle = getPaddleClient();
    const amountCents = Math.round(params.amount * 100);
    const currencyCode =
      params.currency === "EUR"
        ? "EUR"
        : params.currency === "GBP"
          ? "GBP"
          : "USD";

    const transaction = await paddle.transactions.create({
      items: [
        {
          quantity: 1,
          price: {
            description: "Invoice payment",
            name: "Invoice payment",
            unitPrice: {
              amount: String(amountCents),
              currencyCode,
            },
            product: {
              name: "Invoice payment",
              description: "Invoice payment",
              taxCategory: "standard",
            },
          },
        },
      ],
      currencyCode,
      customData: {
        invoiceId: params.invoiceId,
        organizationId: params.organizationId,
        type: "invoice_payment",
      },
      checkout: params.successUrl ? { url: params.successUrl } : undefined,
    });

    logger.info("Paddle transaction created", {
      transactionId: transaction.id,
      invoiceId: params.invoiceId,
      amount: params.amount,
    });

    return {
      success: true,
      transactionId: transaction.id,
      checkoutUrl: transaction.checkout?.url ?? undefined,
    };
  } catch (error) {
    logger.error("Failed to create Paddle checkout", { error, params });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process a completed Paddle transaction
 * Called from webhook handler.
 * Supports both camelCase and snake_case in customData (Paddle may echo keys either way).
 */
export async function processCompletedTransaction(
  transactionId: string,
  customerId: string | null,
  amount: string,
  customData: Record<string, unknown>
): Promise<void> {
  const invoiceId = (customData?.invoiceId ?? customData?.invoice_id) as
    | string
    | undefined;
  const organizationId = (customData?.organizationId ??
    customData?.organization_id) as string | undefined;

  if (!invoiceId || !organizationId) {
    logger.warn("Transaction missing invoice data", {
      transactionId,
      customData,
      keys: Object.keys(customData ?? {}),
    });
    return;
  }

  // Check if payment already exists
  const existingPayment = await prisma.payment.findUnique({
    where: { paddleTransactionId: transactionId },
  });

  if (existingPayment) {
    logger.info("Payment already processed", { transactionId });
    return;
  }

  // Get invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });

  if (!invoice) {
    logger.error("Invoice not found for transaction", {
      transactionId,
      invoiceId,
    });
    return;
  }

  const amountStr = String(amount).trim();
  const amountNum = parseFloat(amountStr);
  const paymentAmount =
    amountStr.includes(".") && amountNum < 100000 ? amountNum : amountNum / 100;

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      organizationId,
      amount: new Decimal(paymentAmount.toFixed(2)),
      paymentDate: new Date(),
      method: PaymentMethod.PADDLE,
      paddleTransactionId: transactionId,
      paddleCustomerId: customerId,
      notes: `Paddle transaction: ${transactionId}`,
    },
  });

  await auditCreate(
    "Payment",
    payment.id,
    {
      invoiceId: payment.invoiceId,
      amount: Number(payment.amount),
      method: payment.method,
      paddleTransactionId: transactionId,
    },
    organizationId
  );

  // Check if invoice is now fully paid
  const totalPaid =
    invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) +
    paymentAmount;
  const invoiceTotal = Number(invoice.total);

  if (totalPaid >= invoiceTotal - 0.01) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.PAID },
    });

    await auditStatusChange(
      "Invoice",
      invoiceId,
      invoice.status,
      InvoiceStatus.PAID,
      organizationId
    );

    logger.info("Invoice marked as paid", { invoiceId, transactionId });
  }

  logger.info("Payment recorded from Paddle", {
    paymentId: payment.id,
    transactionId,
    invoiceId,
    amount: paymentAmount,
  });
}

/**
 * Get transaction details from Paddle
 */
export async function getTransaction(transactionId: string) {
  try {
    const paddle = getPaddleClient();
    return await paddle.transactions.get(transactionId);
  } catch (error) {
    logger.error("Failed to get Paddle transaction", { error, transactionId });
    return null;
  }
}
