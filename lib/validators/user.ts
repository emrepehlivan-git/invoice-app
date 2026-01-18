import { z } from "zod";
import type { TranslationFunction } from "@/types";

export function createUpdateProfileSchema(t: TranslationFunction) {
  return z.object({
    name: z
      .string()
      .min(1, t("validation.required"))
      .min(2, t("validation.minLength", { min: 2 }))
      .max(100, t("validation.maxLength", { max: 100 })),
  });
}

export function createChangePasswordSchema(t: TranslationFunction) {
  return z
    .object({
      currentPassword: z.string().min(1, t("validation.required")),
      newPassword: z
        .string()
        .min(1, t("validation.required"))
        .min(8, t("validation.minLength", { min: 8 }))
        .max(128, t("validation.maxLength", { max: 128 })),
      confirmPassword: z.string().min(1, t("validation.required")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("validation.passwordMatch"),
      path: ["confirmPassword"],
    });
}

export type UpdateProfileInput = z.infer<
  ReturnType<typeof createUpdateProfileSchema>
>;
export type ChangePasswordInput = z.infer<
  ReturnType<typeof createChangePasswordSchema>
>;
