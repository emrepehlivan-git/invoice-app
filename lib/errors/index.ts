/**
 * Error Handling Module
 *
 * Centralized error handling for the application.
 *
 * @example
 * ```ts
 * import {
 *   ErrorCode,
 *   actionError,
 *   actionSuccess,
 *   handleActionError,
 *   assertExists,
 *   assertAccess,
 * } from "@/lib/errors";
 *
 * export async function getCustomer(id: string) {
 *   try {
 *     const customer = await prisma.customer.findUnique({ where: { id } });
 *     assertExists(customer, "Customer", id);
 *     return actionSuccess(customer);
 *   } catch (error) {
 *     return handleActionError(error, "getCustomer", { id });
 *   }
 * }
 * ```
 */

// Types
export {
  ErrorCode,
  type ErrorCodeType,
  type ErrorMetadata,
  type ActionError,
  type ActionSuccess,
  type ActionResult,
  type SimpleResult,
  isActionError,
  isActionSuccess,
} from "./types";

// Error Classes
export {
  AppError,
  AuthError,
  NotFoundError,
  ValidationError,
  BusinessError,
  DatabaseError,
  ExternalServiceError,
} from "./classes";

// Parsers
export {
  parseError,
  parsePrismaError,
  parseZodError,
  getZodFieldErrors,
  isPrismaError,
  isUniqueConstraintError,
  getUniqueConstraintField,
} from "./parsers";

// Handler utilities
export {
  withErrorHandler,
  withSimpleErrorHandler,
  handleActionError,
  actionError,
  actionSuccess,
  simpleSuccess,
  simpleError,
  assertCondition,
  assertExists,
  assertAccess,
  isRedirectError,
  rethrowRedirectError,
} from "./handler";
