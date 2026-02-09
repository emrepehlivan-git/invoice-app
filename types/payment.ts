import type { Payment, Invoice, Organization } from "./prisma";

/**
 * Payment with related invoice
 */
export type PaymentWithInvoice = Payment & {
  invoice: Invoice;
};

/**
 * Payment with all relations
 */
export type PaymentWithRelations = Payment & {
  invoice: Invoice;
  organization: Organization;
};
