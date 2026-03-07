import { InvoiceStatus } from "@/types";

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]:
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  [InvoiceStatus.SENT]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  [InvoiceStatus.PAID]:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  [InvoiceStatus.OVERDUE]:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  [InvoiceStatus.CANCELLED]:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};
