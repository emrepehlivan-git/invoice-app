/**
 * Email Service Configuration
 *
 * Loads email configuration from environment variables.
 */

import type { EmailProviderConfig, SMTPConfig } from "./types";

/**
 * Get SMTP configuration from environment variables
 */
function getSMTPConfig(): SMTPConfig | undefined {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return undefined;
  }

  return {
    host,
    port: parseInt(port, 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  };
}

/**
 * Determine which email provider to use
 * Priority:
 * 1. EMAIL_PROVIDER env var (explicit override)
 * 2. SMTP config present -> smtp
 * 3. Default -> ethereal (for development)
 */
function getProviderType(): "ethereal" | "smtp" {
  const explicitProvider = process.env.EMAIL_PROVIDER;

  if (explicitProvider === "smtp" || explicitProvider === "ethereal") {
    return explicitProvider;
  }

  // Auto-detect: use SMTP if configured, otherwise Ethereal
  const smtpConfig = getSMTPConfig();
  return smtpConfig ? "smtp" : "ethereal";
}

/**
 * Get email configuration
 */
export function getEmailConfig(): EmailProviderConfig {
  const provider = getProviderType();

  return {
    provider,
    smtp: provider === "smtp" ? getSMTPConfig() : undefined,
    defaults: {
      fromName: process.env.EMAIL_FROM_NAME || "Invoice App",
      fromAddress: process.env.EMAIL_FROM_ADDRESS || "noreply@example.com",
    },
  };
}

/**
 * Get the base URL for the application
 * Used for generating links in emails
 */
export function getAppBaseUrl(): string {
  // In production, use the configured URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // In development, default to localhost
  return process.env.NODE_ENV === "production"
    ? "https://example.com"
    : "http://localhost:3000";
}

/**
 * Check if email service is properly configured
 */
export function isEmailConfigured(): boolean {
  const config = getEmailConfig();

  // Ethereal is always available (auto-creates test accounts)
  if (config.provider === "ethereal") {
    return true;
  }

  // SMTP requires full configuration
  return !!config.smtp;
}
