/**
 * Auth Email Templates
 *
 * Email verification and password reset templates.
 */

import type { EmailVerificationData, PasswordResetData } from "../types";
import {
  baseLayout,
  button,
  heading,
  paragraph,
  mutedText,
  divider,
  escapeHtml,
} from "./base";

// ============================================
// Email Verification
// ============================================

const verificationTranslations = {
  en: {
    subject: "Verify your email address",
    greeting: "Hello {recipientName},",
    body: "Thank you for signing up! Please verify your email address by clicking the button below.",
    action: "Verify Email",
    expiry: "This link will expire in 24 hours.",
    footer:
      "If you didn't create an account, you can safely ignore this email.",
    linkText: "Or copy and paste this link into your browser:",
  },
  tr: {
    subject: "E-posta adresinizi doğrulayın",
    greeting: "Merhaba {recipientName},",
    body: "Kaydolduğunuz için teşekkürler! Lütfen aşağıdaki butona tıklayarak e-posta adresinizi doğrulayın.",
    action: "E-postayı Doğrula",
    expiry: "Bu bağlantı 24 saat içinde geçerliliğini yitirecektir.",
    footer: "Bir hesap oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz.",
    linkText: "Veya bu bağlantıyı tarayıcınıza kopyalayıp yapıştırın:",
  },
};

type Locale = keyof typeof verificationTranslations;

function getVerificationTranslation(
  locale: string
): (typeof verificationTranslations)[Locale] {
  return verificationTranslations[locale as Locale] || verificationTranslations.en;
}

/**
 * Render email verification subject
 */
export function renderVerificationSubject(data: EmailVerificationData): string {
  const t = getVerificationTranslation(data.locale);
  return t.subject;
}

/**
 * Render email verification HTML
 */
export function renderVerificationHtml(data: EmailVerificationData): string {
  const t = getVerificationTranslation(data.locale);

  const content = `
    ${heading(t.greeting.replace("{recipientName}", escapeHtml(data.recipientName)), 2)}

    ${paragraph(t.body)}

    ${button(t.action, data.verificationUrl)}

    ${mutedText(t.expiry)}

    ${divider()}

    ${mutedText(t.linkText)}
    <p style="margin: 8px 0 16px; font-size: 12px; color: #6b7280; word-break: break-all;">
      ${escapeHtml(data.verificationUrl)}
    </p>

    ${mutedText(t.footer)}
  `;

  return baseLayout(content, t.body);
}

/**
 * Render email verification plain text
 */
export function renderVerificationText(data: EmailVerificationData): string {
  const t = getVerificationTranslation(data.locale);

  return `
${t.greeting.replace("{recipientName}", data.recipientName)}

${t.body}

${t.action}: ${data.verificationUrl}

${t.expiry}

${t.footer}
`.trim();
}

// ============================================
// Password Reset
// ============================================

const passwordResetTranslations = {
  en: {
    subject: "Reset your password",
    greeting: "Hello {recipientName},",
    body: "We received a request to reset your password. Click the button below to create a new password.",
    action: "Reset Password",
    expiry: "This link will expire in 1 hour.",
    footer:
      "If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.",
    linkText: "Or copy and paste this link into your browser:",
  },
  tr: {
    subject: "Şifrenizi sıfırlayın",
    greeting: "Merhaba {recipientName},",
    body: "Şifrenizi sıfırlamak için bir istek aldık. Yeni bir şifre oluşturmak için aşağıdaki butona tıklayın.",
    action: "Şifreyi Sıfırla",
    expiry: "Bu bağlantı 1 saat içinde geçerliliğini yitirecektir.",
    footer:
      "Şifre sıfırlama isteğinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz. Şifreniz değiştirilmeyecektir.",
    linkText: "Veya bu bağlantıyı tarayıcınıza kopyalayıp yapıştırın:",
  },
};

function getPasswordResetTranslation(
  locale: string
): (typeof passwordResetTranslations)[Locale] {
  return passwordResetTranslations[locale as Locale] || passwordResetTranslations.en;
}

/**
 * Render password reset subject
 */
export function renderPasswordResetSubject(data: PasswordResetData): string {
  const t = getPasswordResetTranslation(data.locale);
  return t.subject;
}

/**
 * Render password reset HTML
 */
export function renderPasswordResetHtml(data: PasswordResetData): string {
  const t = getPasswordResetTranslation(data.locale);

  const content = `
    ${heading(t.greeting.replace("{recipientName}", escapeHtml(data.recipientName)), 2)}

    ${paragraph(t.body)}

    ${button(t.action, data.resetUrl)}

    ${mutedText(t.expiry)}

    ${divider()}

    ${mutedText(t.linkText)}
    <p style="margin: 8px 0 16px; font-size: 12px; color: #6b7280; word-break: break-all;">
      ${escapeHtml(data.resetUrl)}
    </p>

    ${mutedText(t.footer)}
  `;

  return baseLayout(content, t.body);
}

/**
 * Render password reset plain text
 */
export function renderPasswordResetText(data: PasswordResetData): string {
  const t = getPasswordResetTranslation(data.locale);

  return `
${t.greeting.replace("{recipientName}", data.recipientName)}

${t.body}

${t.action}: ${data.resetUrl}

${t.expiry}

${t.footer}
`.trim();
}
