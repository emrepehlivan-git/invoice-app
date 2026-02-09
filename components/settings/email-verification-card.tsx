"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";

interface EmailVerificationCardProps {
  email: string;
}

export function EmailVerificationCard({ email }: EmailVerificationCardProps) {
  const t = useTranslations("auth.emailVerification");
  const [isLoading, setIsLoading] = useState(false);

  async function handleResend() {
    setIsLoading(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email?success=true",
      });

      if (error) {
        toast.error(t("error"));
        return;
      }

      toast.success(t("sent"));
    } catch {
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-5" />
          {t("resend")}
        </CardTitle>
        <CardDescription>{t("resendDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleResend} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {t("resend")}
        </Button>
      </CardContent>
    </Card>
  );
}
