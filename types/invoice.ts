import type { Invoice, InvoiceItem, Customer, Organization } from "@/prisma/generated/prisma";

/**
 * Invoice with all relations included
 */
export type InvoiceWithRelations = Invoice & {
  customer: Customer;
  organization: Organization;
  items: InvoiceItem[];
};

/**
 * Invoice with customer relation
 */
export type InvoiceWithCustomer = Invoice & {
  customer: Customer;
};

/**
 * Invoice item input for creating/updating
 */
export type InvoiceItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};
