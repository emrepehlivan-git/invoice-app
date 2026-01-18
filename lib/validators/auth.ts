import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationFunction = (key: string, values?: any) => string;

export function createLoginSchema(t: TranslationFunction) {
  return z.object({
    email: z.string().min(1, t("validation.required")).email(t("validation.email")),
    password: z
      .string()
      .min(1, t("validation.required"))
      .min(8, t("validation.minLength", { min: 8 })),
  });
}

export function createRegisterSchema(t: TranslationFunction) {
  return z
    .object({
      name: z
        .string()
        .min(1, t("validation.required"))
        .min(2, t("validation.minLength", { min: 2 }))
        .max(100, t("validation.maxLength", { max: 100 })),
      email: z.string().min(1, t("validation.required")).email(t("validation.email")),
      password: z
        .string()
        .min(1, t("validation.required"))
        .min(8, t("validation.minLength", { min: 8 }))
        .max(128, t("validation.maxLength", { max: 128 }))
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, t("validation.passwordStrength")),
      confirmPassword: z.string().min(1, t("validation.required")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordMatch"),
      path: ["confirmPassword"],
    });
}

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;
