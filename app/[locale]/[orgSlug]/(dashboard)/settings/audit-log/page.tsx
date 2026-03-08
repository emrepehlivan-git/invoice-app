import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getCachedOrganizationBySlug } from "@/lib/cached-queries";
import { getAuditLogs } from "@/app/actions/audit-log";
import { isActionError, getErrorMessage } from "@/lib/errors";
import { redirect } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettingsNav } from "@/components/settings/settings-nav";
import { AuditLogSection } from "@/components/settings/audit-log-section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Role, type AuditLog } from "@/types";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function AuditLogSettingsPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const session = await getSession();

  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const organization = await getCachedOrganizationBySlug(orgSlug);

  if (!organization) {
    notFound();
  }

  const t = await getTranslations("settings.auditLog");

  if (organization.role !== Role.ADMIN) {
    return (
      <div className="space-y-6">
        <SettingsNav orgSlug={orgSlug} />
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("adminOnly")}</AlertTitle>
          <AlertDescription>{t("adminOnlyDescription")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const initial = await getAuditLogs(organization.id, undefined, {
    page: 1,
    pageSize: 20,
  });

  let logs: AuditLog[] = [];
  let totalCount = 0;
  let initialError: string | undefined;
  if (isActionError(initial)) {
    const tRoot = await getTranslations();
    initialError = getErrorMessage(initial, (key) => tRoot(key));
  } else if (initial?.data) {
    logs = initial.data.logs;
    totalCount = initial.data.totalCount;
  }

  return (
    <div className="space-y-6">
      <SettingsNav orgSlug={orgSlug} />

      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {initialError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("errorLoading")}</AlertTitle>
          <AlertDescription>{initialError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
          <CardDescription>{t("cardDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogSection
            initialLogs={logs}
            initialTotal={totalCount}
            organizationId={organization.id}
            locale={locale}
          />
        </CardContent>
      </Card>
    </div>
  );
}
