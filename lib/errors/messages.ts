/**
 * Error Message Utilities
 *
 * Provides user-friendly error messages based on error codes.
 * Supports internationalization through translation functions.
 */

import { ErrorCode, type ErrorCodeType, type ActionError } from "./types";

export type TranslationFunction = (key: string, values?: Record<string, unknown>) => string;

/**
 * Get user-friendly error message for an error code
 * Falls back to error code if translation is not available
 */
export function getErrorMessage(
  error: ActionError,
  t?: TranslationFunction
): string {
  if (error.message) {
    return error.message;
  }

  if (!t) {
    return getDefaultErrorMessage(error.error);
  }

  const translationKey = `errors.${error.error}`;
  const translated = t(translationKey);

  // If translation returns the key itself, use default message
  if (translated === translationKey) {
    return getDefaultErrorMessage(error.error);
  }

  return translated;
}

/**
 * Get default English error message for an error code
 */
function getDefaultErrorMessage(code: ErrorCodeType): string {
  const messages: Record<ErrorCodeType, string> = {
    [ErrorCode.UNAUTHORIZED]: "You don't have permission to perform this action",
    [ErrorCode.FORBIDDEN]: "Access denied",
    [ErrorCode.SESSION_EXPIRED]: "Your session has expired. Please sign in again.",
    [ErrorCode.NOT_FOUND]: "The requested resource was not found",
    [ErrorCode.ALREADY_EXISTS]: "This resource already exists",
    [ErrorCode.VALIDATION_ERROR]: "Please check your input and try again",
    [ErrorCode.INVALID_INPUT]: "Invalid input provided",
    [ErrorCode.EMAIL_EXISTS]: "This email address is already in use",
    [ErrorCode.SLUG_EXISTS]: "This URL slug is already taken",
    [ErrorCode.CANNOT_EDIT]: "This item cannot be edited in its current state",
    [ErrorCode.CANNOT_DELETE]: "This item cannot be deleted",
    [ErrorCode.HAS_DEPENDENCIES]: "Cannot delete because it has related records",
    [ErrorCode.INVOICE_NOT_DRAFT]: "Invoice must be in draft status to perform this action",
    [ErrorCode.INVOICE_ALREADY_PAID]: "Invoice is already paid",
    [ErrorCode.INVALID_STATUS_TRANSITION]: "Invalid status transition",
    [ErrorCode.INVITATION_ALREADY_EXISTS]: "An invitation already exists for this email",
    [ErrorCode.INVITATION_EXPIRED]: "Invitation has expired",
    [ErrorCode.INVITATION_INVALID]: "Invalid invitation",
    [ErrorCode.INVITATION_ALREADY_MEMBER]: "User is already a member of this organization",
    [ErrorCode.DATABASE_ERROR]: "A database error occurred. Please try again later.",
    [ErrorCode.CONSTRAINT_VIOLATION]: "Data constraint violation",
    [ErrorCode.UNIQUE_CONSTRAINT]: "A record with this value already exists",
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: "External service error occurred",
    [ErrorCode.RATE_LIMIT_EXCEEDED]: "Too many requests. Please wait a moment and try again.",
    [ErrorCode.EMAIL_SEND_FAILED]: "Failed to send email. Please try again later.",
    [ErrorCode.EMAIL_TEMPLATE_ERROR]: "An error occurred while preparing the email.",
    [ErrorCode.EMAIL_CONFIG_ERROR]: "Email service is not properly configured.",
    [ErrorCode.INTERNAL_ERROR]: "An internal error occurred. Please try again later.",
    [ErrorCode.UNKNOWN_ERROR]: "An unexpected error occurred",
  };

  return messages[code] || messages[ErrorCode.UNKNOWN_ERROR];
}

/**
 * Get field-specific error message for validation errors
 */
export function getFieldErrorMessage(
  field: string,
  error: ActionError,
  t?: TranslationFunction
): string | undefined {
  if (error.metadata?.details && typeof error.metadata.details === "object") {
    const fieldErrors = error.metadata.details as Record<string, string | string[]>;
    const fieldError = fieldErrors[field];

    if (fieldError) {
      if (Array.isArray(fieldError)) {
        return fieldError[0];
      }
      return fieldError;
    }
  }

  return undefined;
}

/**
 * Get all field errors from a validation error
 */
export function getAllFieldErrors(
  error: ActionError
): Record<string, string> {
  if (error.metadata?.details && typeof error.metadata.details === "object") {
    const fieldErrors: Record<string, string> = {};
    const details = error.metadata.details as Record<string, string | string[]>;

    for (const [field, messages] of Object.entries(details)) {
      if (Array.isArray(messages)) {
        fieldErrors[field] = messages[0];
      } else {
        fieldErrors[field] = messages;
      }
    }

    return fieldErrors;
  }

  return {};
}
