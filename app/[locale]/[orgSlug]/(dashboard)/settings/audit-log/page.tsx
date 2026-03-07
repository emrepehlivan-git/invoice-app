import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getCachedOrganizationBySlug } from "@/lib/cached-queries";
import { getAuditLogs } from "@/app/actions/audit-log";
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
import { Role } from "@/types";

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

  const logs = initial?.logs ?? [];
  const totalCount = initial?.totalCount ?? 0;

  return (
    <div className="space-y-6">
      <SettingsNav orgSlug={orgSlug} />

      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

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
