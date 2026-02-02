/**
 * Invitation Email Template
 *
 * Email sent when a user is invited to join an organization.
 */

import type { InvitationEmailData } from "../types";
import {
  baseLayout,
  button,
  heading,
  paragraph,
  mutedText,
  infoBox,
  infoRow,
  divider,
  formatDate,
  escapeHtml,
} from "./base";

/**
 * Translations for invitation email
 */
const translations = {
  en: {
    subject: "You've been invited to join {organizationName}",
    greeting: "Hello!",
    body: "{inviterName} has invited you to join {organizationName}.",
    roleInfo: "You'll be joining as:",
    action: "Accept Invitation",
    expiry: "This invitation expires on {date}.",
    footer:
      "If you didn't expect this invitation, you can safely ignore this email.",
    roles: {
      ADMIN: "Administrator",
      MEMBER: "Member",
    },
  },
  tr: {
    subject: "{organizationName} organizasyonuna davet edildiniz",
    greeting: "Merhaba!",
    body: "{inviterName} sizi {organizationName} organizasyonuna davet etti.",
    roleInfo: "Katılacağınız rol:",
    action: "Daveti Kabul Et",
    expiry: "Bu davetin son geçerlilik tarihi: {date}.",
    footer:
      "Bu daveti beklemiyorsanız, bu e-postayı görmezden gelebilirsiniz.",
    roles: {
      ADMIN: "Yönetici",
      MEMBER: "Üye",
    },
  },
};

type Locale = keyof typeof translations;

function getTranslation(locale: string): (typeof translations)[Locale] {
  return translations[locale as Locale] || translations.en;
}

/**
 * Render invitation email subject
 */
export function renderInvitationSubject(data: InvitationEmailData): string {
  const t = getTranslation(data.locale);
  return t.subject.replace("{organizationName}", data.organizationName);
}

/**
 * Render invitation email HTML
 */
export function renderInvitationHtml(data: InvitationEmailData): string {
  const t = getTranslation(data.locale);
  const roleKey = data.role as keyof (typeof translations)["en"]["roles"];
  const roleName = t.roles[roleKey] || data.role;

  const content = `
    ${heading(t.greeting, 2)}

    ${paragraph(
      t.body
        .replace("{inviterName}", escapeHtml(data.inviterName))
        .replace("{organizationName}", escapeHtml(data.organizationName))
    )}

    ${infoBox(`
      ${infoRow(t.roleInfo, roleName)}
    `)}

    ${button(t.action, data.acceptUrl)}

    ${divider()}

    ${mutedText(t.expiry.replace("{date}", formatDate(data.expiresAt, data.locale)))}

    ${mutedText(t.footer)}
  `;

  const previewText = t.body
    .replace("{inviterName}", data.inviterName)
    .replace("{organizationName}", data.organizationName);

  return baseLayout(content, previewText);
}

/**
 * Render invitation email plain text (fallback)
 */
export function renderInvitationText(data: InvitationEmailData): string {
  const t = getTranslation(data.locale);
  const roleKey = data.role as keyof (typeof translations)["en"]["roles"];
  const roleName = t.roles[roleKey] || data.role;

  return `
${t.greeting}

${t.body
  .replace("{inviterName}", data.inviterName)
  .replace("{organizationName}", data.organizationName)}

${t.roleInfo} ${roleName}

${t.action}: ${data.acceptUrl}

${t.expiry.replace("{date}", formatDate(data.expiresAt, data.locale))}

${t.footer}
`.trim();
}
