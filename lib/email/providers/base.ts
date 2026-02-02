/**
 * Email Provider Factory
 *
 * Creates the appropriate email provider based on configuration.
 */

import type { EmailProvider, EmailProviderConfig } from "../types";
import { EmailConfigError } from "../errors";
import { EtherealProvider } from "./ethereal";
import { SMTPProvider } from "./smtp";

let cachedProvider: EmailProvider | null = null;

/**
 * Create an email provider based on configuration
 */
export async function createEmailProvider(
  config: EmailProviderConfig
): Promise<EmailProvider> {
  switch (config.provider) {
    case "ethereal":
      return EtherealProvider.create(config.defaults);

    case "smtp":
      if (!config.smtp) {
        throw new EmailConfigError(
          "SMTP configuration is required for smtp provider"
        );
      }
      return new SMTPProvider(config.smtp, config.defaults);

    default:
      throw new EmailConfigError(
        `Unknown email provider: ${config.provider as string}`
      );
  }
}

/**
 * Get the singleton email provider instance
 * Provider is lazily created on first use
 */
export async function getEmailProvider(
  config: EmailProviderConfig
): Promise<EmailProvider> {
  if (!cachedProvider) {
    cachedProvider = await createEmailProvider(config);
  }
  return cachedProvider;
}

/**
 * Clear the cached provider (useful for testing)
 */
export function clearProviderCache(): void {
  cachedProvider = null;
}
