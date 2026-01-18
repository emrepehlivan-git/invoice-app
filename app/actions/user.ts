"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";
import logger from "@/lib/logger";
import { hash, verify } from "@node-rs/argon2";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

type ActionResult =
  | { error: string; success?: never }
  | { success: true; error?: never };

export async function updateProfile(
  data: UpdateProfileInput
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const validated = updateProfileSchema.parse(data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validated.name,
      },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    logger.error("Failed to update profile", { error, data });
    throw error;
  }
}

export async function changePassword(
  data: ChangePasswordInput
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const validated = changePasswordSchema.parse(data);

    // Get user's account with password
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "credential",
      },
    });

    if (!account?.password) {
      return { error: "no_password_account" };
    }

    // Verify current password
    const isValidPassword = await verify(account.password, validated.currentPassword);

    if (!isValidPassword) {
      return { error: "invalid_current_password" };
    }

    // Hash new password
    const hashedPassword = await hash(validated.newPassword, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Update password
    await prisma.account.update({
      where: { id: account.id },
      data: {
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to change password", { error });
    throw error;
  }
}

export async function getUserProfile() {
  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    // Check if user has a password-based account
    const hasPasswordAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "credential",
      },
    });

    return {
      user,
      hasPasswordAccount: !!hasPasswordAccount,
    };
  } catch (error) {
    logger.error("Failed to get user profile", { error });
    throw error;
  }
}
