/**
 * Email Service Types
 *
 * Core types and interfaces for the email system.
 */

import type { Role } from "@/types";

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: "base64" | "utf-8";
}

/**
 * Base email options
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

/**
 * Result of sending an email
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string; // Only for Ethereal provider (test emails)
  error?: string;
}

/**
 * Email provider interface
 * All email providers must implement this interface
 */
export interface EmailProvider {
  /**
   * Provider name for logging/debugging
   */
  readonly name: string;

  /**
   * Send an email
   */
  send(options: EmailOptions): Promise<EmailResult>;

  /**
   * Verify provider connection (optional)
   */
  verify?(): Promise<boolean>;
}

/**
 * Email provider configuration
 */
export interface EmailProviderConfig {
  provider: "ethereal" | "smtp";
  smtp?: SMTPConfig;
  defaults: EmailDefaults;
}

/**
 * SMTP configuration
 */
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Default email settings
 */
export interface EmailDefaults {
  fromName: string;
  fromAddress: string;
}

// ============================================
// Template Data Types
// ============================================

/**
 * Base template data with common fields
 */
export interface BaseEmailData {
  locale: string;
}

/**
 * Invitation email template data
 */
export interface InvitationEmailData extends BaseEmailData {
  recipientEmail: string;
  organizationName: string;
  inviterName: string;
  role: Role;
  acceptUrl: string;
  expiresAt: Date;
}

/**
 * Invoice email template data
 */
export interface InvoiceEmailData extends BaseEmailData {
  recipientEmail: string;
  recipientName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: Date;
  organizationName: string;
  viewUrl?: string;
  pdfAttachment?: Buffer;
}

/**
 * Email verification template data
 */
export interface EmailVerificationData extends BaseEmailData {
  recipientEmail: string;
  recipientName: string;
  verificationUrl: string;
  expiresAt?: Date;
}

/**
 * Password reset template data
 */
export interface PasswordResetData extends BaseEmailData {
  recipientEmail: string;
  recipientName: string;
  resetUrl: string;
  expiresAt?: Date;
}

/**
 * All email template types
 */
export type EmailTemplateData =
  | InvitationEmailData
  | InvoiceEmailData
  | EmailVerificationData
  | PasswordResetData;

/**
 * Email template types
 */
export type EmailTemplateType =
  | "invitation"
  | "invoice"
  | "email-verification"
  | "password-reset";
