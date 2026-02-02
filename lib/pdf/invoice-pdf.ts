import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { InvoiceWithRelations } from "@/types";
import type { InvoicePdfLabels } from "./types";
import { DiscountType } from "@/types";

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ` ${currency}`;
}

function getStatusLabel(
  status: string,
  labels: InvoicePdfLabels
): string {
  const map: Record<string, string> = {
    DRAFT: labels.statusDraft,
    SENT: labels.statusSent,
    PAID: labels.statusPaid,
    OVERDUE: labels.statusOverdue,
    CANCELLED: labels.statusCancelled,
  };
  return map[status] ?? status;
}

export function generateInvoicePdf(
  invoice: InvoiceWithRelations,
  labels: InvoicePdfLabels,
  locale: string
): Uint8Array {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  doc.setFontSize(18);
  doc.text(invoice.organization.name, margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`${labels.invoiceNumber}: ${invoice.invoiceNumber}`, margin, y);
  doc.text(
    `${labels.status}: ${getStatusLabel(invoice.status, labels)}`,
    pageWidth - margin - 60,
    y
  );
  y += 15;

  const col1End = pageWidth / 2 - 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(labels.billTo, margin, y);
  doc.setFont("helvetica", "normal");
  y += 6;

  doc.text(invoice.customer.name, margin, y);
  y += 5;
  if (invoice.customer.email) {
    doc.text(invoice.customer.email, margin, y);
    y += 5;
  }
  if (invoice.customer.phone) {
    doc.text(invoice.customer.phone, margin, y);
    y += 5;
  }
  if (invoice.customer.address) {
    doc.text(invoice.customer.address, margin, y);
    y += 5;
  }
  const cityLine = [invoice.customer.city, invoice.customer.postalCode]
    .filter(Boolean)
    .join(" ");
  if (cityLine) {
    doc.text(cityLine, margin, y);
    y += 5;
  }
  if (invoice.customer.country) {
    doc.text(invoice.customer.country, margin, y);
    y += 5;
  }
  if (invoice.customer.taxNumber) {
    doc.text(
      `${labels.taxNumber}: ${invoice.customer.taxNumber}`,
      margin,
      y
    );
    y += 5;
  }

  const infoY = 45;
  doc.setFont("helvetica", "bold");
  doc.text(labels.invoiceInfo, pageWidth - margin - 70, infoY);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${labels.issueDate}: ${new Date(invoice.issueDate).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")}`,
    pageWidth - margin - 70,
    infoY + 6
  );
  doc.text(
    `${labels.dueDate}: ${new Date(invoice.dueDate).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")}`,
    pageWidth - margin - 70,
    infoY + 12
  );

  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text(labels.itemsTitle, margin, y);
  doc.setFont("helvetica", "normal");
  y += 5;

  const head = [
    labels.description,
    labels.quantity,
    labels.unitPrice,
    labels.itemTotal,
  ];
  const body = invoice.items.map((item) => [
    item.description,
    String(Number(item.quantity)),
    formatCurrency(Number(item.unitPrice), invoice.currency),
    formatCurrency(Number(item.total), invoice.currency),
  ]);

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    theme: "grid",
    headStyles: { fillColor: [220, 220, 220] },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: "right" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
  });

  const tableEndY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  y = (tableEndY ?? y + 30) + 5;

  const totalsX = pageWidth - margin - 50;
  doc.setFont("helvetica", "normal");
  doc.text(labels.subtotal, totalsX - 30, y);
  doc.text(
    formatCurrency(Number(invoice.subtotal), invoice.currency),
    totalsX + 30,
    y,
    { align: "right" }
  );
  y += 6;

  if (invoice.discountAmount && Number(invoice.discountAmount) > 0) {
    const discountLabel =
      invoice.discountType === DiscountType.PERCENTAGE
        ? `${labels.discount} (${Number(invoice.discountValue)}%)`
        : labels.discount;
    doc.text(discountLabel, totalsX - 30, y);
    doc.text(
      `-${formatCurrency(Number(invoice.discountAmount), invoice.currency)}`,
      totalsX + 30,
      y,
      { align: "right" }
    );
    y += 6;
  }

  doc.text(
    `${labels.taxAmount} (${Number(invoice.taxRate)}%)`,
    totalsX - 30,
    y
  );
  doc.text(
    formatCurrency(Number(invoice.taxAmount), invoice.currency),
    totalsX + 30,
    y,
    { align: "right" }
  );
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text(labels.total, totalsX - 30, y);
  doc.text(
    formatCurrency(Number(invoice.total), invoice.currency),
    totalsX + 30,
    y,
    { align: "right" }
  );
  y += 10;

  if (invoice.notes && invoice.notes.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFont("helvetica", "bold");
    doc.text(labels.notes, margin, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, y);
  }

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
