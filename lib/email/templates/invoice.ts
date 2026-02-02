/**
 * Invoice Email Template
 *
 * Email sent when an invoice is shared with a customer.
 */

import type { InvoiceEmailData } from "../types";
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
  formatCurrency,
  escapeHtml,
} from "./base";

/**
 * Translations for invoice email
 */
const translations = {
  en: {
    subject: "Invoice {invoiceNumber} from {organizationName}",
    greeting: "Hello {recipientName},",
    body: "You have received a new invoice from {organizationName}.",
    invoiceDetails: "Invoice Details",
    invoiceNumber: "Invoice Number",
    amount: "Amount",
    dueDate: "Due Date",
    action: "View Invoice",
    attachment: "The invoice PDF is attached to this email.",
    footer: "If you have any questions about this invoice, please contact us.",
    thankYou: "Thank you for your business!",
  },
  tr: {
    subject: "{organizationName} tarafından Fatura {invoiceNumber}",
    greeting: "Merhaba {recipientName},",
    body: "{organizationName} tarafından yeni bir fatura aldınız.",
    invoiceDetails: "Fatura Detayları",
    invoiceNumber: "Fatura Numarası",
    amount: "Tutar",
    dueDate: "Vade Tarihi",
    action: "Faturayı Görüntüle",
    attachment: "Fatura PDF'i bu e-postaya eklenmiştir.",
    footer:
      "Bu fatura hakkında sorularınız varsa, lütfen bizimle iletişime geçin.",
    thankYou: "İş birliğiniz için teşekkür ederiz!",
  },
};

type Locale = keyof typeof translations;

function getTranslation(locale: string): (typeof translations)[Locale] {
  return translations[locale as Locale] || translations.en;
}

/**
 * Render invoice email subject
 */
export function renderInvoiceSubject(data: InvoiceEmailData): string {
  const t = getTranslation(data.locale);
  return t.subject
    .replace("{invoiceNumber}", data.invoiceNumber)
    .replace("{organizationName}", data.organizationName);
}

/**
 * Render invoice email HTML
 */
export function renderInvoiceHtml(data: InvoiceEmailData): string {
  const t = getTranslation(data.locale);

  const content = `
    ${heading(t.greeting.replace("{recipientName}", escapeHtml(data.recipientName)), 2)}

    ${paragraph(t.body.replace("{organizationName}", escapeHtml(data.organizationName)))}

    ${infoBox(`
      <div style="margin-bottom: 8px; font-weight: 600; font-size: 14px;">${t.invoiceDetails}</div>
      ${infoRow(t.invoiceNumber, escapeHtml(data.invoiceNumber))}
      ${infoRow(t.amount, formatCurrency(data.amount, data.currency))}
      ${infoRow(t.dueDate, formatDate(data.dueDate, data.locale))}
    `)}

    ${data.viewUrl ? button(t.action, data.viewUrl) : ""}

    ${data.pdfAttachment ? paragraph(t.attachment) : ""}

    ${divider()}

    ${paragraph(t.thankYou)}

    ${mutedText(t.footer)}
  `;

  const previewText = t.body.replace(
    "{organizationName}",
    data.organizationName
  );

  return baseLayout(content, previewText);
}

/**
 * Render invoice email plain text (fallback)
 */
export function renderInvoiceText(data: InvoiceEmailData): string {
  const t = getTranslation(data.locale);

  return `
${t.greeting.replace("{recipientName}", data.recipientName)}

${t.body.replace("{organizationName}", data.organizationName)}

${t.invoiceDetails}
- ${t.invoiceNumber}: ${data.invoiceNumber}
- ${t.amount}: ${formatCurrency(data.amount, data.currency)}
- ${t.dueDate}: ${formatDate(data.dueDate, data.locale)}

${data.viewUrl ? `${t.action}: ${data.viewUrl}` : ""}

${data.pdfAttachment ? t.attachment : ""}

${t.thankYou}

${t.footer}
`.trim();
}
