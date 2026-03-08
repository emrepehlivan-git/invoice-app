/**
 * Paddle Webhook Handler
 *
 * Receives and processes Paddle webhook events for payment notifications.
 * Signature is verified via paddle.webhooks.unmarshal before processing.
 *
 * Error response behaviour: This handler intentionally returns HTTP 200 even
 * when processing fails (e.g. invalid body, signature mismatch, or internal error).
 * Paddle retries delivery on 5xx responses; returning 200 avoids retries for
 * permanent failures (bad request, invalid signature) and keeps retry traffic low.
 * Errors are always logged for debugging.
 */

import { NextRequest, NextResponse } from "next/server";
import { EventName } from "@paddle/paddle-node-sdk";
import { getPaddleClient, getPaddleWebhookSecret } from "@/lib/paddle/client";
import { processCompletedTransaction } from "@/lib/paddle/service";
import {
  isPaddleTransactionCompletedData,
  isPaddleTransactionPaymentFailedData,
  isPaddleTransactionUpdatedData,
} from "@/lib/paddle/webhook-types";
import { getClientIp, rateLimitWebhook } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, reset } = await rateLimitWebhook.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(reset) } }
    );
  }
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

    const payload = eventData.data as unknown;

    switch (eventData.eventType) {
      case EventName.TransactionCompleted: {
        if (!isPaddleTransactionCompletedData(payload)) {
          logger.warn("Paddle webhook: invalid TransactionCompleted payload", {
            eventId: eventData.eventId,
          });
          break;
        }
        const customData =
          (payload.customData ?? payload.custom_data) ?? {};
        const totals = payload.details?.totals;
        const amount = totals?.total ?? totals?.grand_total ?? "0";
        logger.info("Transaction completed", {
          transactionId: payload.id,
          customDataKeys: Object.keys(customData),
          amount,
        });

        await processCompletedTransaction(
          payload.id,
          payload.customerId ?? payload.customer_id ?? null,
          amount,
          customData
        );
        break;
      }

      case EventName.TransactionPaymentFailed: {
        if (!isPaddleTransactionPaymentFailedData(payload)) {
          logger.warn(
            "Paddle webhook: invalid TransactionPaymentFailed payload",
            { eventId: eventData.eventId }
          );
          break;
        }
        logger.warn("Transaction payment failed", {
          transactionId: payload.id,
          customData: payload.customData,
        });
        break;
      }

      case EventName.TransactionUpdated: {
        if (!isPaddleTransactionUpdatedData(payload)) {
          logger.warn("Paddle webhook: invalid TransactionUpdated payload", {
            eventId: eventData.eventId,
          });
          break;
        }
        logger.info("Transaction updated", {
          transactionId: payload.id,
          status: payload.status,
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
    return NextResponse.json(
      { error: "Webhook error logged" },
      { status: 200 }
    );
  }
}

// Paddle only sends POST requests
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
