/**
 * In-memory rate limiter (fixed window). No external services.
 * Suitable for hobby/single-instance deployments.
 */

import type { NextRequest } from "next/server";

interface WindowState {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowState>();

function getKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}

function cleanupExpired(prefix: string): void {
  const now = Date.now();
  for (const [key, state] of store.entries()) {
    if (key.startsWith(prefix + ":") && state.resetAt < now) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimitConfig {
  windowSeconds: number;
  max: number;
  prefix?: string;
}

export function createRateLimiter(config: RateLimitConfig) {
  const { windowSeconds, max, prefix = "rl" } = config;
  const windowMs = windowSeconds * 1000;

  return {
    async limit(identifier: string): Promise<RateLimitResult> {
      const key = getKey(prefix, identifier);
      const now = Date.now();

      let state = store.get(key);
      if (!state || state.resetAt < now) {
        state = { count: 0, resetAt: now + windowMs };
        store.set(key, state);
      }

      state.count += 1;
      const success = state.count <= max;
      if (!success && state.count === max + 1) {
        cleanupExpired(prefix);
      }

      return {
        success,
        limit: max,
        remaining: Math.max(0, max - state.count),
        reset: Math.ceil(state.resetAt / 1000),
      };
    },
  };
}

export function getClientIp(request: Request | NextRequest): string {
  const req = request as Request;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = req.headers.get("x-real-ip");
  return realIp ?? "unknown";
}

export const rateLimitWebhook = createRateLimiter({
  prefix: "webhook",
  windowSeconds: 60,
  max: 60,
});

export const rateLimitCron = createRateLimiter({
  prefix: "cron",
  windowSeconds: 60,
  max: 20,
});

export const rateLimitPdf = createRateLimiter({
  prefix: "pdf",
  windowSeconds: 60,
  max: 30,
});
