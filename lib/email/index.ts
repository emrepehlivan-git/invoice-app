/**
 * Email Service
 *
 * Provider-agnostic email service for Invoice App.
 *
 * Usage:
 * ```typescript
 * import { getEmailService } from "@/lib/email";
 *
 * const emailService = await getEmailService();
 * await emailService.sendInvitation({
 *   recipientEmail: "user@example.com",
 *   organizationName: "Acme Inc",
 *   inviterName: "John Doe",
 *   role: Role.MEMBER,
 *   acceptUrl: "https://example.com/invite/abc123",
 *   expiresAt: new Date(),
 *   locale: "en",
 * });
 * ```
 *
 * Configuration:
 * - EMAIL_PROVIDER: "ethereal" (default) or "smtp"
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS: SMTP settings
 * - EMAIL_FROM_NAME, EMAIL_FROM_ADDRESS: Default sender
 */

// Main service
export { EmailService, getEmailService } from "./service";

// Configuration
export { getEmailConfig, getAppBaseUrl, isEmailConfigured } from "./config";

// Types
export type {
  EmailProvider,
  EmailOptions,
  EmailAttachment,
  EmailResult,
  EmailProviderConfig,
  SMTPConfig,
  EmailDefaults,
  InvitationEmailData,
  InvoiceEmailData,
  EmailVerificationData,
  PasswordResetData,
  EmailTemplateData,
  EmailTemplateType,
} from "./types";

// Errors
export {
  EmailError,
  EmailSendError,
  EmailTemplateError,
  EmailConfigError,
  EmailConnectionError,
} from "./errors";

// Validators
export {
  createEmailSchema,
  createInvitationEmailDataSchema,
  createInvoiceEmailDataSchema,
  createVerificationEmailDataSchema,
  createPasswordResetEmailDataSchema,
} from "./validators";
export type {
  InvitationEmailDataInput,
  InvoiceEmailDataInput,
  VerificationEmailDataInput,
  PasswordResetEmailDataInput,
} from "./validators";
