/**
 * SMTP Email Provider
 *
 * Production email provider using custom SMTP server.
 * Supports Gmail, SendGrid, Mailgun, and any SMTP-compatible service.
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type {
  EmailProvider,
  EmailOptions,
  EmailResult,
  EmailDefaults,
  SMTPConfig,
} from "../types";

export class SMTPProvider implements EmailProvider {
  readonly name = "smtp";
  private transporter: Transporter;
  private defaults: EmailDefaults;

  constructor(config: SMTPConfig, defaults: EmailDefaults) {
    this.defaults = defaults;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const from = `"${this.defaults.fromName}" <${this.defaults.fromAddress}>`;

      const info = await this.transporter.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          encoding: att.encoding,
        })),
      });

      console.log("[Email] Sent via SMTP, messageId:", info.messageId);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error sending email";
      console.error("[Email] Failed to send via SMTP:", message);

      return {
        success: false,
        error: message,
      };
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("[Email] SMTP connection verified");
      return true;
    } catch (error) {
      console.error("[Email] SMTP verification failed:", error);
      return false;
    }
  }
}
