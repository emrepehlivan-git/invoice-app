"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, User, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Role } from "@/types";
import type { InvitationWithRelations } from "@/types";
import { acceptInvitation } from "@/app/actions/invitation";

type Props = {
  invitation: InvitationWithRelations;
  token: string;
  isLoggedIn: boolean;
  userEmail?: string;
};

export function InvitationAcceptForm({
  invitation,
  token,
  isLoggedIn,
  userEmail,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const emailMatch = userEmail?.toLowerCase() === invitation.email.toLowerCase();

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const result = await acceptInvitation(token);

      if ("error" in result) {
        const errorKey = `invitation.errors.${result.error}`;
        const errorMessage = t.has(errorKey) ? t(errorKey) : t("errors.unknownError");
        toast.error(errorMessage);
        return;
      }

      toast.success(t("invitation.messages.accepted"));
      router.push(`/${result.data.organizationSlug}`);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("invitation.title")}</CardTitle>
          <CardDescription>{t("invitation.description")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t("invitation.organization")}</p>
                <p className="font-medium">{invitation.organization.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t("invitation.role")}</p>
                <Badge variant={invitation.role === Role.ADMIN ? "default" : "secondary"}>
                  {invitation.role === Role.ADMIN
                    ? t("organization.roles.admin")
                    : t("organization.roles.member")}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t("invitation.invitedBy")}</p>
                <p className="font-medium">{invitation.invitedBy.name}</p>
              </div>
            </div>
          </div>

          {!isLoggedIn && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("invitation.loginRequired", { email: invitation.email })}
              </AlertDescription>
            </Alert>
          )}

          {isLoggedIn && !emailMatch && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("invitation.emailMismatch", {
                  invitedEmail: invitation.email,
                  currentEmail: userEmail || "",
                })}
              </AlertDescription>
            </Alert>
          )}

          {isLoggedIn && emailMatch && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                {t("invitation.readyToAccept")}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {!isLoggedIn ? (
            <>
              <Button asChild className="w-full">
                <Link href={`/login?redirect=/invitation/${token}`}>
                  {t("invitation.signInToAccept")}
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                {t("auth.login.noAccount")}{" "}
                <Link
                  href={`/register?redirect=/invitation/${token}`}
                  className="text-primary hover:underline"
                >
                  {t("auth.login.register")}
                </Link>
              </p>
            </>
          ) : emailMatch ? (
            <Button onClick={handleAccept} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {t("invitation.accept")}
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link href="/">{t("common.goHome")}</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
