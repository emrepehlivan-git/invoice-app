/**
 * Email Service
 *
 * Main service for sending emails. Provides high-level methods
 * for common email types (invitation, invoice, auth).
 */

import type {
  EmailProvider,
  EmailResult,
  InvitationEmailData,
  InvoiceEmailData,
  EmailVerificationData,
  PasswordResetData,
} from "./types";
import { getEmailConfig } from "./config";
import { getEmailProvider } from "./providers/base";
import {
  renderInvitationSubject,
  renderInvitationHtml,
  renderInvitationText,
} from "./templates/invitation";
import {
  renderInvoiceSubject,
  renderInvoiceHtml,
  renderInvoiceText,
} from "./templates/invoice";
import {
  renderVerificationSubject,
  renderVerificationHtml,
  renderVerificationText,
  renderPasswordResetSubject,
  renderPasswordResetHtml,
  renderPasswordResetText,
} from "./templates/auth";
import { EmailSendError, EmailTemplateError } from "./errors";

/**
 * Email service singleton
 */
let emailServiceInstance: EmailService | null = null;

export class EmailService {
  private provider: EmailProvider;

  private constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  /**
   * Get or create the email service singleton
   */
  static async getInstance(): Promise<EmailService> {
    if (!emailServiceInstance) {
      const config = getEmailConfig();
      const provider = await getEmailProvider(config);
      emailServiceInstance = new EmailService(provider);
    }
    return emailServiceInstance;
  }

  /**
   * Get the provider name (for logging/debugging)
   */
  get providerName(): string {
    return this.provider.name;
  }

  /**
   * Send an organization invitation email
   */
  async sendInvitation(data: InvitationEmailData): Promise<EmailResult> {
    try {
      const subject = renderInvitationSubject(data);
      const html = renderInvitationHtml(data);
      const text = renderInvitationText(data);

      const result = await this.provider.send({
        to: data.recipientEmail,
        subject,
        html,
        text,
      });

      if (!result.success) {
        throw new EmailSendError(
          result.error || "Failed to send invitation email"
        );
      }

      console.log(
        `[Email] Invitation sent to ${data.recipientEmail}`,
        result.previewUrl ? `Preview: ${result.previewUrl}` : ""
      );

      return result;
    } catch (error) {
      if (error instanceof EmailSendError) {
        throw error;
      }
      throw new EmailTemplateError(
        "Failed to render invitation email",
        error
      );
    }
  }

  /**
   * Send an invoice email (optionally with PDF attachment)
   */
  async sendInvoice(data: InvoiceEmailData): Promise<EmailResult> {
    try {
      const subject = renderInvoiceSubject(data);
      const html = renderInvoiceHtml(data);
      const text = renderInvoiceText(data);

      const attachments = data.pdfAttachment
        ? [
            {
              filename: `invoice-${data.invoiceNumber}.pdf`,
              content: data.pdfAttachment,
              contentType: "application/pdf",
            },
          ]
        : undefined;

      const result = await this.provider.send({
        to: data.recipientEmail,
        subject,
        html,
        text,
        attachments,
      });

      if (!result.success) {
        throw new EmailSendError(
          result.error || "Failed to send invoice email"
        );
      }

      console.log(
        `[Email] Invoice ${data.invoiceNumber} sent to ${data.recipientEmail}`,
        result.previewUrl ? `Preview: ${result.previewUrl}` : ""
      );

      return result;
    } catch (error) {
      if (error instanceof EmailSendError) {
        throw error;
      }
      throw new EmailTemplateError("Failed to render invoice email", error);
    }
  }

  /**
   * Send an email verification email
   */
  async sendEmailVerification(data: EmailVerificationData): Promise<EmailResult> {
    try {
      const subject = renderVerificationSubject(data);
      const html = renderVerificationHtml(data);
      const text = renderVerificationText(data);

      const result = await this.provider.send({
        to: data.recipientEmail,
        subject,
        html,
        text,
      });

      if (!result.success) {
        throw new EmailSendError(
          result.error || "Failed to send verification email"
        );
      }

      console.log(
        `[Email] Verification email sent to ${data.recipientEmail}`,
        result.previewUrl ? `Preview: ${result.previewUrl}` : ""
      );

      return result;
    } catch (error) {
      if (error instanceof EmailSendError) {
        throw error;
      }
      throw new EmailTemplateError(
        "Failed to render verification email",
        error
      );
    }
  }

  /**
   * Send a password reset email
   */
  async sendPasswordReset(data: PasswordResetData): Promise<EmailResult> {
    try {
      const subject = renderPasswordResetSubject(data);
      const html = renderPasswordResetHtml(data);
      const text = renderPasswordResetText(data);

      const result = await this.provider.send({
        to: data.recipientEmail,
        subject,
        html,
        text,
      });

      if (!result.success) {
        throw new EmailSendError(
          result.error || "Failed to send password reset email"
        );
      }

      console.log(
        `[Email] Password reset email sent to ${data.recipientEmail}`,
        result.previewUrl ? `Preview: ${result.previewUrl}` : ""
      );

      return result;
    } catch (error) {
      if (error instanceof EmailSendError) {
        throw error;
      }
      throw new EmailTemplateError(
        "Failed to render password reset email",
        error
      );
    }
  }

  /**
   * Verify the email provider connection
   */
  async verifyConnection(): Promise<boolean> {
    if (this.provider.verify) {
      return this.provider.verify();
    }
    return true;
  }
}

/**
 * Get the email service instance
 * Convenience function for getting the singleton
 */
export async function getEmailService(): Promise<EmailService> {
  return EmailService.getInstance();
}
