/**
 * Paddle Webhook Handler
 *
 * Receives and processes Paddle webhook events for payment notifications.
 */

import { NextRequest, NextResponse } from "next/server";
import { EventName } from "@paddle/paddle-node-sdk";
import { getPaddleClient, getPaddleWebhookSecret } from "@/lib/paddle/client";
import { processCompletedTransaction } from "@/lib/paddle/service";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("paddle-signature");
    const rawBody = await request.text();

    if (!signature || !rawBody) {
      logger.warn("Paddle webhook: Missing signature or body");
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const paddle = getPaddleClient();
    const webhookSecret = getPaddleWebhookSecret();

    // Verify signature and unmarshal event
    const eventData = await paddle.webhooks.unmarshal(
      rawBody,
      webhookSecret,
      signature
    );

    logger.info("Paddle webhook received", {
      eventType: eventData.eventType,
      eventId: eventData.eventId,
    });

    // Process different event types
    switch (eventData.eventType) {
      case EventName.TransactionCompleted: {
        const transaction = eventData.data;
        logger.info("Transaction completed", {
          transactionId: transaction.id,
          customerId: transaction.customerId,
        });

        // Process the completed payment
        await processCompletedTransaction(
          transaction.id,
          transaction.customerId ?? null,
          transaction.details?.totals?.total ?? "0",
          (transaction.customData as Record<string, unknown>) ?? {}
        );
        break;
      }

      case EventName.TransactionPaymentFailed: {
        const transaction = eventData.data;
        logger.warn("Transaction payment failed", {
          transactionId: transaction.id,
          customData: transaction.customData,
        });
        // Could send notification email here
        break;
      }

      case EventName.TransactionUpdated: {
        const transaction = eventData.data;
        logger.info("Transaction updated", {
          transactionId: transaction.id,
          status: transaction.status,
        });
        break;
      }

      default:
        logger.info("Unhandled Paddle event", {
          eventType: eventData.eventType,
          eventId: eventData.eventId,
        });
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logger.error("Paddle webhook error", { error });
    // Return 200 to prevent retries for validation errors
    // Paddle will retry on 5xx errors
    return NextResponse.json({ error: "Webhook error logged" }, { status: 200 });
  }
}

// Paddle only sends POST requests
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
