/**
 * Base Email Template
 *
 * Provides the HTML layout and utilities for all email templates.
 * Uses inline CSS for maximum email client compatibility.
 */

/**
 * Brand colors
 */
const colors = {
  primary: "#2563eb", // blue-600
  primaryDark: "#1d4ed8", // blue-700
  text: "#1f2937", // gray-800
  textMuted: "#6b7280", // gray-500
  background: "#f9fafb", // gray-50
  white: "#ffffff",
  border: "#e5e7eb", // gray-200
  success: "#059669", // emerald-600
  warning: "#d97706", // amber-600
};

/**
 * Base HTML wrapper for all emails
 */
export function baseLayout(content: string, previewText?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Invoice App</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    /* Responsive */
    @media screen and (max-width: 600px) {
      .mobile-padding { padding: 20px !important; }
      .mobile-full-width { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>` : ""}

  <!-- Main Container -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Content Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: ${colors.white}; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px; border-bottom: 1px solid ${colors.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${colors.primary};">
                      Invoice App
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="mobile-padding" style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid ${colors.border}; background-color: ${colors.background}; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: ${colors.textMuted}; text-align: center;">
                This email was sent by Invoice App.
                <br>
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

/**
 * Primary action button
 */
export function button(text: string, href: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 24px 0;">
      <a href="${href}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: ${colors.primary}; color: ${colors.white}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
`.trim();
}

/**
 * Heading element
 */
export function heading(text: string, level: 1 | 2 | 3 = 2): string {
  const sizes = { 1: "24px", 2: "20px", 3: "16px" };
  return `<h${level} style="margin: 0 0 16px; font-size: ${sizes[level]}; font-weight: 600; color: ${colors.text};">${text}</h${level}>`;
}

/**
 * Paragraph text
 */
export function paragraph(text: string): string {
  return `<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${colors.text};">${text}</p>`;
}

/**
 * Muted/secondary text
 */
export function mutedText(text: string): string {
  return `<p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: ${colors.textMuted};">${text}</p>`;
}

/**
 * Info box
 */
export function infoBox(content: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding: 16px; background-color: ${colors.background}; border-radius: 6px; border: 1px solid ${colors.border};">
      ${content}
    </td>
  </tr>
</table>
`.trim();
}

/**
 * Key-value pair row
 */
export function infoRow(label: string, value: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
  <tr>
    <td style="font-size: 14px; color: ${colors.textMuted}; padding-right: 16px; width: 40%;">${label}</td>
    <td style="font-size: 14px; color: ${colors.text}; font-weight: 500;">${value}</td>
  </tr>
</table>
`.trim();
}

/**
 * Divider line
 */
export function divider(): string {
  return `<hr style="margin: 24px 0; border: none; border-top: 1px solid ${colors.border};">`;
}

/**
 * Format a date for display in emails
 */
export function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: string | number,
  currency: string
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(num);
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
