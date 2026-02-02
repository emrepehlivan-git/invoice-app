import type { InvoicePdfLabels } from "./types";

type MessagesInvoice = {
  detail: { billTo: string; invoiceInfo: string; itemsTitle: string };
  fields: {
    invoiceNumber: string;
    status: string;
    issueDate: string;
    dueDate: string;
    subtotal: string;
    discount: string;
    taxAmount: string;
    total: string;
    notes: string;
  };
  items: { description: string; quantity: string; unitPrice: string; total: string };
  status: {
    DRAFT: string;
    SENT: string;
    PAID: string;
    OVERDUE: string;
    CANCELLED: string;
  };
};

type MessagesCustomers = {
  fields: { taxNumber: string };
};

type Messages = { invoices: MessagesInvoice; customers: MessagesCustomers };

export function getInvoicePdfLabels(messages: Messages): InvoicePdfLabels {
  const inv = messages.invoices;
  const cust = messages.customers;
  return {
    billTo: inv.detail.billTo,
    invoiceInfo: inv.detail.invoiceInfo,
    itemsTitle: inv.detail.itemsTitle,
    invoiceNumber: inv.fields.invoiceNumber,
    status: inv.fields.status,
    issueDate: inv.fields.issueDate,
    dueDate: inv.fields.dueDate,
    subtotal: inv.fields.subtotal,
    discount: inv.fields.discount,
    taxAmount: inv.fields.taxAmount,
    total: inv.fields.total,
    notes: inv.fields.notes,
    description: inv.items.description,
    quantity: inv.items.quantity,
    unitPrice: inv.items.unitPrice,
    itemTotal: inv.items.total,
    taxNumber: cust.fields.taxNumber,
    statusDraft: inv.status.DRAFT,
    statusSent: inv.status.SENT,
    statusPaid: inv.status.PAID,
    statusOverdue: inv.status.OVERDUE,
    statusCancelled: inv.status.CANCELLED,
  };
}
