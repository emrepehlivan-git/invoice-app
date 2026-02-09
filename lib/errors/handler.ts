/**
 * Server Action Error Handler
 *
 * Provides utilities for handling errors in server actions consistently.
 */

import { headers } from "next/headers";
import logger from "@/lib/logger";
import { getSession } from "@/lib/auth/session";
import { parseError } from "./parsers";
import {
  ErrorCode,
  type ActionError,
  type ActionResult,
  type SimpleResult,
  type ErrorCodeType,
} from "./types";
import { AppError } from "./classes";

/**
 * Get client information from request headers
 */
async function getClientInfo() {
  try {
    const headersList = await headers();
    return {
      ipAddress: headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown",
      userAgent: headersList.get("user-agent") || "unknown",
    };
  } catch {
    return {
      ipAddress: "unknown",
      userAgent: "unknown",
    };
  }
}

/**
 * Options for the action handler
 */
interface ActionHandlerOptions {
  /** Action name for logging */
  actionName: string;
  /** Additional context for logging */
  context?: Record<string, unknown>;
  /** Whether to rethrow errors after handling (default: false) */
  rethrow?: boolean;
}

/**
 * Wrap a server action with error handling
 *
 * @example
 * ```ts
 * export const createCustomer = withErrorHandler(
 *   async (organizationId: string, data: CustomerInput) => {
 *     // ... action logic
 *     return { data: customer };
 *   },
 *   { actionName: "createCustomer" }
 * );
 * ```
 */
export function withErrorHandler<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<ActionResult<TResult>>,
  options: ActionHandlerOptions
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const parsedError = parseError(error);

      // Get additional context for logging
      const [session, clientInfo] = await Promise.all([
        getSession().catch(() => null),
        getClientInfo(),
      ]);

      logger.error(`Action failed: ${options.actionName}`, {
        error: parsedError,
        context: {
          ...options.context,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
        },
        client: clientInfo,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      if (options.rethrow) {
        throw error;
      }

      return parsedError;
    }
  };
}

/**
 * Wrap a simple action (success/error only) with error handling
 */
export function withSimpleErrorHandler<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<SimpleResult>,
  options: ActionHandlerOptions
): (...args: TArgs) => Promise<SimpleResult> {
  return async (...args: TArgs): Promise<SimpleResult> => {
    try {
      return await fn(...args);
    } catch (error) {
      const parsedError = parseError(error);

      // Get additional context for logging
      const [session, clientInfo] = await Promise.all([
        getSession().catch(() => null),
        getClientInfo(),
      ]);

      logger.error(`Action failed: ${options.actionName}`, {
        error: parsedError,
        context: {
          ...options.context,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
        },
        client: clientInfo,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      if (options.rethrow) {
        throw error;
      }

      return { error: parsedError.error, message: parsedError.message };
    }
  };
}

/**
 * Handle an error and return ActionError
 * Use this when you need more control than withErrorHandler provides
 *
 * @example
 * ```ts
 * try {
 *   // ... action logic
 * } catch (error) {
 *   return handleActionError(error, "createCustomer", { customerId });
 * }
 * ```
 */
export function handleActionError(
  error: unknown,
  actionName: string,
  context?: Record<string, unknown>
): ActionError {
  const parsedError = parseError(error);

  // Log error with additional context (async, non-blocking)
  void (async () => {
    try {
      const [session, clientInfo] = await Promise.all([
        getSession().catch(() => null),
        getClientInfo(),
      ]);

      logger.error(`Action failed: ${actionName}`, {
        error: parsedError,
        context: {
          ...context,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
        },
        client: clientInfo,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
    } catch (logError) {
      // Don't fail if logging fails
      logger.error(`Failed to log error for ${actionName}`, { logError });
    }
  })();

  return parsedError;
}

/**
 * Create an error result with a specific code
 */
export function actionError(
  code: ErrorCodeType,
  message?: string
): ActionResult<never> {
  return { error: code, message };
}

/**
 * Create a success result with data
 */
export function actionSuccess<T>(data: T): ActionResult<T> {
  return { data };
}

/**
 * Create a simple success result
 */
export function simpleSuccess(): SimpleResult {
  return { success: true };
}

/**
 * Create a simple error result
 */
export function simpleError(code: ErrorCodeType, message?: string): SimpleResult {
  return { error: code, message };
}

/**
 * Assert a condition and throw AppError if false
 *
 * @example
 * ```ts
 * assertCondition(hasAccess, ErrorCode.UNAUTHORIZED, "Access denied");
 * ```
 */
export function assertCondition(
  condition: boolean,
  code: ErrorCodeType,
  message?: string
): asserts condition {
  if (!condition) {
    throw new AppError(code, message);
  }
}

/**
 * Assert a resource exists
 *
 * @example
 * ```ts
 * const customer = await prisma.customer.findUnique({ where: { id } });
 * assertExists(customer, "Customer", id);
 * // customer is now non-null
 * ```
 */
export function assertExists<T>(
  value: T | null | undefined,
  resourceName: string,
  resourceId?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new AppError(ErrorCode.NOT_FOUND, `${resourceName} not found`, {
      resource: resourceName,
      resourceId,
    });
  }
}

/**
 * Assert user has access
 */
export function assertAccess(
  hasAccess: boolean,
  message = "Access denied"
): asserts hasAccess {
  assertCondition(hasAccess, ErrorCode.UNAUTHORIZED, message);
}

/**
 * Check if an error is a Next.js redirect error
 * Next.js redirect() throws an error with "NEXT_REDIRECT" in its digest
 */
export function isRedirectError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.includes("NEXT_REDIRECT")
  );
}

/**
 * Re-throw redirect errors if the error is a redirect
 * Use this at the start of catch blocks in actions that use redirect()
 *
 * @example
 * ```ts
 * try {
 *   // ... create resource
 *   redirect("/success");
 * } catch (error) {
 *   rethrowRedirectError(error);
 *   return handleActionError(error, "createResource");
 * }
 * ```
 */
export function rethrowRedirectError(error: unknown): void {
  if (isRedirectError(error)) {
    throw error;
  }
}
