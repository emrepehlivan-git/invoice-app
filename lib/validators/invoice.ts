import { z } from "zod";
import { DiscountType } from "@/types";
import type { TranslationFunction } from "@/types";

export function createInvoiceItemSchema(t: TranslationFunction) {
  return z.object({
    description: z
      .string()
      .min(1, t("validation.required"))
      .max(500, t("validation.maxLength", { max: 500 })),
    quantity: z
      .number()
      .min(0.01, t("invoices.validation.minQuantity"))
      .max(999999, t("validation.maxLength", { max: 999999 })),
    unitPrice: z
      .number()
      .min(0, t("invoices.validation.minPrice"))
      .max(99999999, t("validation.maxLength", { max: 99999999 })),
  });
}

export function createInvoiceSchema(t: TranslationFunction) {
  return z.object({
    customerId: z.string().min(1, t("invoices.validation.customerRequired")),
    currency: z.string().min(1, t("validation.required")),
    issueDate: z.date({ message: t("validation.required") }),
    dueDate: z.date({ message: t("validation.required") }),
    discountType: z.nativeEnum(DiscountType).nullable().optional(),
    discountValue: z
      .number()
      .min(0, t("invoices.validation.minDiscount"))
      .max(100, t("invoices.validation.maxDiscountPercent"))
      .nullable()
      .optional(),
    taxRate: z
      .number()
      .min(0, t("invoices.validation.minTaxRate"))
      .max(100, t("invoices.validation.maxTaxRate")),
    notes: z
      .string()
      .max(1000, t("validation.maxLength", { max: 1000 }))
      .optional()
      .or(z.literal("")),
    items: z
      .array(createInvoiceItemSchema(t))
      .min(1, t("invoices.validation.minItems")),
  });
}

export type InvoiceItemInput = z.infer<
  ReturnType<typeof createInvoiceItemSchema>
>;
export type InvoiceInput = z.infer<ReturnType<typeof createInvoiceSchema>>;
