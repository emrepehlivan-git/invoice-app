import type { InvoiceReminderEmailData } from "../types";
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

const translations = {
  en: {
    overdue: {
      subject: "Payment reminder: Invoice {invoiceNumber} from {organizationName} is overdue",
      greeting: "Hello {recipientName},",
      body: "This is a friendly reminder that your invoice {invoiceNumber} from {organizationName} is past due. Please arrange payment at your earliest convenience.",
      invoiceDetails: "Invoice Details",
      invoiceNumber: "Invoice Number",
      amount: "Amount",
      dueDate: "Due Date",
      action: "View Invoice",
      footer: "If you have already paid, please disregard this message. For questions, please contact us.",
      thankYou: "Thank you for your business!",
    },
    due_soon: {
      subject: "Reminder: Invoice {invoiceNumber} from {organizationName} is due soon",
      greeting: "Hello {recipientName},",
      body: "This is a reminder that your invoice {invoiceNumber} from {organizationName} is due soon. Please ensure payment is made by the due date.",
      invoiceDetails: "Invoice Details",
      invoiceNumber: "Invoice Number",
      amount: "Amount",
      dueDate: "Due Date",
      action: "View Invoice",
      footer: "If you have any questions about this invoice, please contact us.",
      thankYou: "Thank you for your business!",
    },
  },
  tr: {
    overdue: {
      subject: "Ödeme hatırlatması: {organizationName} Faturası {invoiceNumber} vadesi geçti",
      greeting: "Merhaba {recipientName},",
      body: "{organizationName} tarafından düzenlenen {invoiceNumber} numaralı faturanızın vadesi geçmiştir. Lütfen en kısa sürede ödeme yapınız.",
      invoiceDetails: "Fatura Detayları",
      invoiceNumber: "Fatura Numarası",
      amount: "Tutar",
      dueDate: "Vade Tarihi",
      action: "Faturayı Görüntüle",
      footer: "Ödemenizi yaptıysanız bu mesajı dikkate almayınız. Sorularınız için bizimle iletişime geçin.",
      thankYou: "İş birliğiniz için teşekkür ederiz!",
    },
    due_soon: {
      subject: "Hatırlatma: {organizationName} Faturası {invoiceNumber} vadesi yaklaşıyor",
      greeting: "Merhaba {recipientName},",
      body: "{organizationName} tarafından düzenlenen {invoiceNumber} numaralı faturanızın vadesi yaklaşmaktadır. Lütfen vade tarihine kadar ödemenizi gerçekleştirin.",
      invoiceDetails: "Fatura Detayları",
      invoiceNumber: "Fatura Numarası",
      amount: "Tutar",
      dueDate: "Vade Tarihi",
      action: "Faturayı Görüntüle",
      footer: "Bu fatura hakkında sorularınız varsa lütfen bizimle iletişime geçin.",
      thankYou: "İş birliğiniz için teşekkür ederiz!",
    },
  },
};

type Locale = keyof typeof translations;

function getTranslation(locale: string, reminderType: "overdue" | "due_soon") {
  const loc = (locale === "tr" ? "tr" : "en") as Locale;
  return translations[loc][reminderType];
}

export function renderInvoiceReminderSubject(data: InvoiceReminderEmailData): string {
  const t = getTranslation(data.locale, data.reminderType);
  return t.subject
    .replace("{invoiceNumber}", data.invoiceNumber)
    .replace("{organizationName}", data.organizationName);
}

export function renderInvoiceReminderHtml(data: InvoiceReminderEmailData): string {
  const t = getTranslation(data.locale, data.reminderType);

  const content = `
    ${heading(t.greeting.replace("{recipientName}", escapeHtml(data.recipientName)), 2)}

    ${paragraph(t.body.replace("{invoiceNumber}", escapeHtml(data.invoiceNumber)).replace("{organizationName}", escapeHtml(data.organizationName)))}

    ${infoBox(`
      <div style="margin-bottom: 8px; font-weight: 600; font-size: 14px;">${t.invoiceDetails}</div>
      ${infoRow(t.invoiceNumber, escapeHtml(data.invoiceNumber))}
      ${infoRow(t.amount, formatCurrency(data.amount, data.currency))}
      ${infoRow(t.dueDate, formatDate(data.dueDate, data.locale))}
    `)}

    ${data.viewUrl ? button(t.action, data.viewUrl) : ""}

    ${divider()}

    ${paragraph(t.thankYou)}

    ${mutedText(t.footer)}
  `;

  const previewText = t.body
    .replace("{invoiceNumber}", data.invoiceNumber)
    .replace("{organizationName}", data.organizationName);

  return baseLayout(content, previewText);
}

export function renderInvoiceReminderText(data: InvoiceReminderEmailData): string {
  const t = getTranslation(data.locale, data.reminderType);

  return `
${t.greeting.replace("{recipientName}", data.recipientName)}

${t.body.replace("{invoiceNumber}", data.invoiceNumber).replace("{organizationName}", data.organizationName)}

${t.invoiceDetails}
- ${t.invoiceNumber}: ${data.invoiceNumber}
- ${t.amount}: ${formatCurrency(data.amount, data.currency)}
- ${t.dueDate}: ${formatDate(data.dueDate, data.locale)}

${data.viewUrl ? `${t.action}: ${data.viewUrl}` : ""}

${t.thankYou}

${t.footer}
`.trim();
}
