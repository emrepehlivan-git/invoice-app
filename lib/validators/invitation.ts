import { z } from "zod";
import { Role } from "@/types";
import type { TranslationFunction } from "@/types";

export function createInvitationSchema(t: TranslationFunction) {
  return z.object({
    email: z
      .string()
      .min(1, t("validation.required"))
      .email(t("validation.email")),
    role: z.nativeEnum(Role),
  });
}

export type InvitationInput = z.infer<ReturnType<typeof createInvitationSchema>>;
