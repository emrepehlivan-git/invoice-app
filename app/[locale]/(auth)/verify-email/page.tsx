"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [isResending, setIsResending] = useState(false);

  // Better Auth may pass these query params
  const error = searchParams.get("error");
  const email = searchParams.get("email");

  // Determine the state
  const isError = !!error;
  const isExpired = error === "EXPIRED_TOKEN" || error === "expired";

  async function handleResendVerification() {
    if (!email) {
      toast.error(t("auth.emailVerification.error"));
      return;
    }

    setIsResending(true);
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email?success=true",
      });
      toast.success(t("auth.emailVerification.sent"));
    } catch {
      toast.error(t("auth.emailVerification.error"));
    } finally {
      setIsResending(false);
    }
  }

  if (isError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">
            {t("auth.emailVerification.errorTitle")}
          </CardTitle>
          <CardDescription>
            {isExpired
              ? t("auth.emailVerification.expiredDescription")
              : t("auth.emailVerification.errorDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendVerification}
              disabled={isResending}
            >
              {isResending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {t("auth.emailVerification.resend")}
            </Button>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            {t("auth.emailVerification.backToLogin")}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-2xl">
          {t("auth.emailVerification.successTitle")}
        </CardTitle>
        <CardDescription>
          {t("auth.emailVerification.successDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/onboarding">
            {t("auth.emailVerification.continue")}
          </Link>
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t("auth.emailVerification.successFooter")}
        </p>
      </CardFooter>
    </Card>
  );
}
