import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import logger from "@/lib/logger";
import { locales, defaultLocale } from "@/i18n/config";

/**
 * Extract locale from request (referer URL path or accept-language header)
 */
function getLocaleFromRequest(request?: Request): string {
  if (!request) return defaultLocale;

  // Try to get locale from referer URL path (e.g., /tr/register or /en/register)
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      const pathParts = url.pathname.split("/").filter(Boolean);
      const pathLocale = pathParts[0];
      if (pathLocale && locales.includes(pathLocale as typeof locales[number])) {
        return pathLocale;
      }
    } catch {
      // Invalid URL, continue to next method
    }
  }

  // Fallback to accept-language header
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();
    if (preferredLocale && locales.includes(preferredLocale as typeof locales[number])) {
      return preferredLocale;
    }
  }

  return defaultLocale;
}

let auth: ReturnType<typeof betterAuth>;

try {
  auth = betterAuth({
    ...(process.env.NEXT_PUBLIC_APP_URL && {
      baseURL: process.env.NEXT_PUBLIC_APP_URL,
    }),
    trustedOrigins: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://*.ngrok-free.dev",
      "https://*.ngrok.io",
    ],
    advanced: {
      trustedProxyHeaders: true,
    },
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user, ctx) => {
            // Set user's locale based on request context
            const locale = getLocaleFromRequest(ctx?.request);
            return {
              data: {
                ...user,
                locale,
              },
            };
          },
        },
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { locale: true },
          });
          const locale = dbUser?.locale ?? defaultLocale;

          const { getEmailService } = await import("@/lib/email");
          const emailService = await getEmailService();
          void emailService.sendEmailVerification({
            recipientEmail: user.email,
            recipientName: user.name ?? user.email,
            verificationUrl: url,
            locale,
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
