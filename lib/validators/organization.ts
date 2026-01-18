import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationFunction = (key: string, values?: any) => string;

export function createOrganizationSchema(t: TranslationFunction) {
  return z.object({
    name: z
      .string()
      .min(1, t("validation.required"))
      .min(2, t("validation.minLength", { min: 2 }))
      .max(100, t("validation.maxLength", { max: 100 })),
    slug: z
      .string()
      .min(1, t("validation.required"))
      .min(2, t("validation.minLength", { min: 2 }))
      .max(50, t("validation.maxLength", { max: 50 }))
      .regex(/^[a-z0-9-]+$/, t("validation.slug")),
  });
}

export type OrganizationInput = z.infer<ReturnType<typeof createOrganizationSchema>>;
