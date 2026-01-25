/**
 * Centralized Error Types and Codes
 *
 * All application error codes and types are defined here to ensure
 * consistency across server actions and client-side error handling.
 */

/**
 * Application error codes
 * Use these constants instead of string literals for type safety
 */
export const ErrorCode = {
  // Authentication & Authorization
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  SESSION_EXPIRED: "session_expired",

  // Resource errors
  NOT_FOUND: "not_found",
  ALREADY_EXISTS: "already_exists",

  // Validation errors
  VALIDATION_ERROR: "validation_error",
  INVALID_INPUT: "invalid_input",

  // Business logic errors
  EMAIL_EXISTS: "email_exists",
  SLUG_EXISTS: "slug_exists",
  CANNOT_EDIT: "cannot_edit",
  CANNOT_DELETE: "cannot_delete",
  HAS_DEPENDENCIES: "has_dependencies",

  // Invoice specific
  INVOICE_NOT_DRAFT: "invoice_not_draft",
  INVOICE_ALREADY_PAID: "invoice_already_paid",
  INVALID_STATUS_TRANSITION: "invalid_status_transition",

  // Invitation specific
  INVITATION_ALREADY_EXISTS: "invitation_already_exists",
  INVITATION_EXPIRED: "invitation_expired",
  INVITATION_INVALID: "invitation_invalid",
  INVITATION_ALREADY_MEMBER: "invitation_already_member",

  // Database errors
  DATABASE_ERROR: "database_error",
  CONSTRAINT_VIOLATION: "constraint_violation",
  UNIQUE_CONSTRAINT: "unique_constraint",

  // External service errors
  EXTERNAL_SERVICE_ERROR: "external_service_error",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",

  // Generic errors
  INTERNAL_ERROR: "internal_error",
  UNKNOWN_ERROR: "unknown_error",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Error metadata for additional context
 */
export interface ErrorMetadata {
  field?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

/**
 * Standard error result for server actions
 */
export interface ActionError {
  error: ErrorCodeType;
  message?: string;
  metadata?: ErrorMetadata;
}

/**
 * Success result type
 */
export interface ActionSuccess<T = void> {
  data: T;
  error?: never;
}

/**
 * Combined action result type
 */
export type ActionResult<T = void> = ActionError | ActionSuccess<T>;

/**
 * Simple success/failure result (for delete operations etc.)
 */
export type SimpleResult =
  | { error: ErrorCodeType; success?: never; message?: string }
  | { success: true; error?: never };

/**
 * Check if result is an error
 */
export function isActionError<T>(
  result: ActionResult<T>
): result is ActionError {
  return "error" in result && result.error !== undefined;
}

/**
 * Check if result is successful
 */
export function isActionSuccess<T>(
  result: ActionResult<T>
): result is ActionSuccess<T> {
  return "data" in result;
}
