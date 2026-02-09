import type { InvoiceWithCustomer } from "@/types";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { formatCurrency } from "@/lib/currency";

export function exportInvoicesToCSV(
  invoices: InvoiceWithCustomer[],
  locale: string
): string {
  const dateLocale = locale === "tr" ? tr : enUS;

  const headers = [
    locale === "tr" ? "Fatura No" : "Invoice No",
    locale === "tr" ? "Müşteri" : "Customer",
    locale === "tr" ? "Tarih" : "Issue Date",
    locale === "tr" ? "Vade Tarihi" : "Due Date",
    locale === "tr" ? "Durum" : "Status",
    locale === "tr" ? "Para Birimi" : "Currency",
    locale === "tr" ? "Toplam" : "Total",
  ];

  const rows = invoices.map((invoice) => [
    invoice.invoiceNumber,
    invoice.customer.name,
    format(new Date(invoice.issueDate), "dd MMM yyyy", {
      locale: dateLocale,
    }),
    format(new Date(invoice.dueDate), "dd MMM yyyy", {
      locale: dateLocale,
    }),
    invoice.status,
    invoice.currency,
    Number(invoice.total).toFixed(2),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
