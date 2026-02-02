/**
 * Ethereal Email Provider
 *
 * Test email provider that uses Ethereal for fake SMTP.
 * Emails are not actually delivered but can be previewed via URL.
 *
 * @see https://ethereal.email/
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type {
  EmailProvider,
  EmailOptions,
  EmailResult,
  EmailDefaults,
} from "../types";
import { EmailConnectionError } from "../errors";
import logger from "@/lib/logger";

interface EtherealAccount {
  user: string;
  pass: string;
}

export class EtherealProvider implements EmailProvider {
  readonly name = "ethereal";
  private transporter: Transporter;
  private defaults: EmailDefaults;

  private constructor(transporter: Transporter, defaults: EmailDefaults) {
    this.transporter = transporter;
    this.defaults = defaults;
  }

  /**
   * Create an Ethereal provider with auto-generated test account
   */
  static async create(defaults: EmailDefaults): Promise<EtherealProvider> {
    try {
      // Create a test account
      const testAccount = (await nodemailer.createTestAccount()) as EtherealAccount;

      // Create transporter with test account
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      logger.info("Ethereal test account created:", testAccount.user);

      return new EtherealProvider(transporter, defaults);
    } catch (error) {
      throw new EmailConnectionError(
        "Failed to create Ethereal test account",
        error
      );
    }
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

      // Get preview URL for the sent email
      const previewUrl = nodemailer.getTestMessageUrl(info);

      logger.info("Ethereal preview URL:", previewUrl);
      logger.info("Ethereal messageId:", info.messageId);
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || undefined,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error sending email";
      logger.error("Failed to send via Ethereal:", { error });

      return {
        success: false,
        error: message,
      };
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error("Ethereal verification failed:", { error });
      return false;
    }
  }
}
