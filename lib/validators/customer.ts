import { z } from "zod";
import type { TranslationFunction } from "@/types";

export function createCustomerSchema(t: TranslationFunction) {
  return z.object({
    name: z
      .string()
      .min(1, t("validation.required"))
      .min(2, t("validation.minLength", { min: 2 }))
      .max(100, t("validation.maxLength", { max: 100 })),
    email: z
      .string()
      .email(t("validation.email"))
      .max(255, t("validation.maxLength", { max: 255 }))
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .max(50, t("validation.maxLength", { max: 50 }))
      .optional()
      .or(z.literal("")),
    taxNumber: z
      .string()
      .max(50, t("validation.maxLength", { max: 50 }))
      .optional()
      .or(z.literal("")),
    address: z
      .string()
      .max(500, t("validation.maxLength", { max: 500 }))
      .optional()
      .or(z.literal("")),
    city: z
      .string()
      .max(100, t("validation.maxLength", { max: 100 }))
      .optional()
      .or(z.literal("")),
    country: z
      .string()
      .max(100, t("validation.maxLength", { max: 100 }))
      .optional()
      .or(z.literal("")),
    postalCode: z
      .string()
      .max(20, t("validation.maxLength", { max: 20 }))
      .optional()
      .or(z.literal("")),
    notes: z
      .string()
      .max(1000, t("validation.maxLength", { max: 1000 }))
      .optional()
      .or(z.literal("")),
  });
}

export type CustomerInput = z.infer<ReturnType<typeof createCustomerSchema>>;
