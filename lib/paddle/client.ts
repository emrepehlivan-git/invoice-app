/**
 * Paddle Client Configuration
 *
 * Server-side Paddle SDK client for creating transactions,
 * managing webhooks, and processing payments.
 */

import { Paddle, Environment } from "@paddle/paddle-node-sdk";

let paddleClient: Paddle | null = null;

/**
 * Get or create Paddle client singleton
 */
export function getPaddleClient(): Paddle {
  if (!paddleClient) {
    const apiKey = process.env.PADDLE_API_KEY;

    if (!apiKey) {
      throw new Error("PADDLE_API_KEY environment variable is not set");
    }

    const environment =
      process.env.PADDLE_ENVIRONMENT === "production"
        ? Environment.production
        : Environment.sandbox;

    paddleClient = new Paddle(apiKey, {
      environment,
    });
  }

  return paddleClient;
}

/**
 * Get webhook secret for signature verification
 */
export function getPaddleWebhookSecret(): string {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("PADDLE_WEBHOOK_SECRET environment variable is not set");
  }

  return secret;
}

/**
 * Get Paddle client token for frontend (Paddle.js)
 */
export function getPaddleClientToken(): string {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

  if (!token) {
    throw new Error(
      "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN environment variable is not set"
    );
  }

  return token;
}

/**
 * Check if Paddle is in sandbox mode
 */
export function isPaddleSandbox(): boolean {
  return process.env.PADDLE_ENVIRONMENT !== "production";
}
