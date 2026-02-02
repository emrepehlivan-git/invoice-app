/**
 * Email Validators
 *
 * Zod schemas for validating email data.
 */

import { z } from "zod";
import { Role } from "@/types";
import type { TranslationFunction } from "@/types";

/**
 * Email address validation
 */
export function createEmailSchema(t: TranslationFunction) {
  return z
    .string()
    .min(1, t("validation.required"))
    .email(t("validation.email"));
}

/**
 * Invitation email data validation
 */
export function createInvitationEmailDataSchema(t: TranslationFunction) {
  return z.object({
    recipientEmail: createEmailSchema(t),
    organizationName: z.string().min(1, t("validation.required")),
    inviterName: z.string().min(1, t("validation.required")),
    role: z.nativeEnum(Role),
    acceptUrl: z.string().url(),
    expiresAt: z.date(),
    locale: z.string().default("en"),
  });
}

/**
 * Invoice email data validation
 */
export function createInvoiceEmailDataSchema(t: TranslationFunction) {
  return z.object({
    recipientEmail: createEmailSchema(t),
    recipientName: z.string().min(1, t("validation.required")),
    invoiceNumber: z.string().min(1, t("validation.required")),
    amount: z.string().min(1, t("validation.required")),
    currency: z.string().min(1, t("validation.required")),
    dueDate: z.date(),
    organizationName: z.string().min(1, t("validation.required")),
    viewUrl: z.string().url().optional(),
    pdfAttachment: z.instanceof(Buffer).optional(),
    locale: z.string().default("en"),
  });
}

/**
 * Email verification data validation
 */
export function createVerificationEmailDataSchema(t: TranslationFunction) {
  return z.object({
    recipientEmail: createEmailSchema(t),
    recipientName: z.string().min(1, t("validation.required")),
    verificationUrl: z.string().url(),
    expiresAt: z.date().optional(),
    locale: z.string().default("en"),
  });
}

/**
 * Password reset data validation
 */
export function createPasswordResetEmailDataSchema(t: TranslationFunction) {
  return z.object({
    recipientEmail: createEmailSchema(t),
    recipientName: z.string().min(1, t("validation.required")),
    resetUrl: z.string().url(),
    expiresAt: z.date().optional(),
    locale: z.string().default("en"),
  });
}

// Type exports
export type InvitationEmailDataInput = z.infer<
  ReturnType<typeof createInvitationEmailDataSchema>
>;
export type InvoiceEmailDataInput = z.infer<
  ReturnType<typeof createInvoiceEmailDataSchema>
>;
export type VerificationEmailDataInput = z.infer<
  ReturnType<typeof createVerificationEmailDataSchema>
>;
export type PasswordResetEmailDataInput = z.infer<
  ReturnType<typeof createPasswordResetEmailDataSchema>
>;
