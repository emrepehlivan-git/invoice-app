/**
 * Custom Error Classes
 *
 * Typed error classes for different error scenarios.
 * These extend the base Error class with additional metadata.
 */

import { ErrorCode, type ErrorCodeType, type ErrorMetadata } from "./types";

/**
 * Base application error class
 */
export class AppError extends Error {
  readonly code: ErrorCodeType;
  readonly metadata?: ErrorMetadata;
  readonly isOperational: boolean;

  constructor(
    code: ErrorCodeType,
    message?: string,
    metadata?: ErrorMetadata,
    isOperational = true
  ) {
    super(message || code);
    this.name = "AppError";
    this.code = code;
    this.metadata = metadata;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      metadata: this.metadata,
    };
  }
}

/**
 * Authentication/Authorization error
 */
export class AuthError extends AppError {
  constructor(
    code:
      | typeof ErrorCode.UNAUTHORIZED
      | typeof ErrorCode.FORBIDDEN
      | typeof ErrorCode.SESSION_EXPIRED = ErrorCode.UNAUTHORIZED,
    message?: string
  ) {
    super(code, message);
    this.name = "AuthError";
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(resource?: string, resourceId?: string) {
    super(ErrorCode.NOT_FOUND, `${resource || "Resource"} not found`, {
      resource,
      resourceId,
    });
    this.name = "NotFoundError";
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    fieldErrors: Record<string, string[]>,
    message = "Validation failed"
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, { details: fieldErrors });
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Business logic error (e.g., cannot delete, cannot edit)
 */
export class BusinessError extends AppError {
  constructor(code: ErrorCodeType, message?: string, metadata?: ErrorMetadata) {
    super(code, message, metadata);
    this.name = "BusinessError";
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(
    code:
      | typeof ErrorCode.DATABASE_ERROR
      | typeof ErrorCode.CONSTRAINT_VIOLATION
      | typeof ErrorCode.UNIQUE_CONSTRAINT = ErrorCode.DATABASE_ERROR,
    message?: string,
    metadata?: ErrorMetadata
  ) {
    super(code, message, metadata, false);
    this.name = "DatabaseError";
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  constructor(serviceName: string, message?: string) {
    super(ErrorCode.EXTERNAL_SERVICE_ERROR, message || `${serviceName} error`, {
      details: { service: serviceName },
    });
    this.name = "ExternalServiceError";
  }
}
