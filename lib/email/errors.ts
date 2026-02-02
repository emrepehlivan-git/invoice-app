/**
 * Email Service Errors
 *
 * Custom error types for email operations.
 */

/**
 * Base email error class
 */
export class EmailError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "EmailError";
  }
}

/**
 * Error when email sending fails
 */
export class EmailSendError extends EmailError {
  constructor(message: string, cause?: unknown) {
    super(message, "EMAIL_SEND_FAILED", cause);
    this.name = "EmailSendError";
  }
}

/**
 * Error when email template rendering fails
 */
export class EmailTemplateError extends EmailError {
  constructor(message: string, cause?: unknown) {
    super(message, "EMAIL_TEMPLATE_ERROR", cause);
    this.name = "EmailTemplateError";
  }
}

/**
 * Error when email configuration is invalid
 */
export class EmailConfigError extends EmailError {
  constructor(message: string, cause?: unknown) {
    super(message, "EMAIL_CONFIG_ERROR", cause);
    this.name = "EmailConfigError";
  }
}

/**
 * Error when email provider connection fails
 */
export class EmailConnectionError extends EmailError {
  constructor(message: string, cause?: unknown) {
    super(message, "EMAIL_CONNECTION_ERROR", cause);
    this.name = "EmailConnectionError";
  }
}
