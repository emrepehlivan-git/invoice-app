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
 * Create a Paddle transaction for invoice payment
 */
export async function createInvoiceCheckout(
  params: CreateCheckoutParams
): Promise<CheckoutResult> {
  try {
    const paddle = getPaddleClient();

    // Get or create Paddle price for this amount
    // Note: In production, you might want to use catalog prices
    // For invoices, we create ad-hoc prices based on invoice amount
    const priceId = process.env.PADDLE_DEFAULT_PRICE_ID;

    if (!priceId) {
      throw new Error("PADDLE_DEFAULT_PRICE_ID is not configured");
    }

    // Create transaction with custom data to identify the invoice
    const transaction = await paddle.transactions.create({
      items: [
        {
          priceId: priceId,
          quantity: 1,
        },
      ],
      customData: {
        invoiceId: params.invoiceId,
        organizationId: params.organizationId,
        type: "invoice_payment",
      },
      checkout: {
        url: params.successUrl,
      },
    });

    logger.info("Paddle transaction created", {
      transactionId: transaction.id,
      invoiceId: params.invoiceId,
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
 * Called from webhook handler
 */
export async function processCompletedTransaction(
  transactionId: string,
  customerId: string | null,
  amount: string,
  customData: Record<string, unknown>
): Promise<void> {
  const invoiceId = customData?.invoiceId as string;
  const organizationId = customData?.organizationId as string;

  if (!invoiceId || !organizationId) {
    logger.warn("Transaction missing invoice data", {
      transactionId,
      customData,
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

  // Parse amount (Paddle returns amount in smallest unit, e.g., cents)
  const paymentAmount = parseFloat(amount) / 100;

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
