import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { getEmailService } from "@/lib/email";
import logger from "@/lib/logger";

let auth: ReturnType<typeof betterAuth>;

try {
  auth = betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        try {
          const emailService = await getEmailService();
          void emailService.sendEmailVerification({
            recipientEmail: user.email,
            recipientName: user.name ?? user.email,
            verificationUrl: url,
            locale: "en",
          });
        } catch (err) {
          logger.error("Failed to send verification email", { error: err });
        }
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
  });
} catch (error) {
  logger.error("Failed to initialize auth", { error });
  throw error;
}

export { auth };

export type Session = typeof auth.$Infer.Session;
