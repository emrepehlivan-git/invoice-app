"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Clock, AlertTriangle } from "lucide-react";
import type { ErrorCodeType } from "@/lib/errors";

type Props = {
  errorCode: ErrorCodeType;
  locale: string;
};

export function InvitationError({ errorCode }: Props) {
  const t = useTranslations();

  const getErrorInfo = () => {
    switch (errorCode) {
      case "invitation_expired":
        return {
          icon: Clock,
          title: t("invitation.errors.expiredTitle"),
          description: t("invitation.errors.expiredDescription"),
        };
      case "invitation_invalid":
        return {
          icon: XCircle,
          title: t("invitation.errors.invalidTitle"),
          description: t("invitation.errors.invalidDescription"),
        };
      default:
        return {
          icon: AlertTriangle,
          title: t("invitation.errors.genericTitle"),
          description: t("invitation.errors.genericDescription"),
        };
    }
  };

  const { icon: Icon, title, description } = getErrorInfo();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Icon className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            {t("invitation.errors.contactAdmin")}
          </p>
        </CardContent>

        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/">{t("common.goHome")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
