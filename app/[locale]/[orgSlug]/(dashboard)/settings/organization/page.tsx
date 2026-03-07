import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getCachedOrganizationBySlug } from "@/lib/cached-queries";
import { getExchangeRates } from "@/app/actions/exchange-rate";
import { redirect } from "@/i18n/navigation";
import { SettingsNav } from "@/components/settings/settings-nav";
import { OrganizationSettingsHeader } from "@/components/settings/organization-settings-header";
import { OrganizationNameCard } from "@/components/settings/organization-name-card";
import { OrganizationSettingsAdminSection } from "@/components/settings/organization-settings-admin-section";
import { AdminOnlyAlert } from "@/components/settings/admin-only-alert";
import { Role } from "@/types";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function OrganizationSettingsPage({ params }: Props) {
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

  const exchangeRates = await getExchangeRates(organization.id);
  const t = await getTranslations("settings");
  const isAdmin = organization.role === Role.ADMIN;

  return (
    <div className="space-y-6">
      <SettingsNav orgSlug={orgSlug} />
      <OrganizationSettingsHeader t={t} />

      <div className="space-y-4">
        <OrganizationNameCard
          organizationName={organization.name}
          t={t}
        />

        {isAdmin ? (
          <OrganizationSettingsAdminSection
            organization={organization}
            exchangeRates={exchangeRates}
            locale={locale}
            t={t}
          />
        ) : (
          <AdminOnlyAlert t={t} />
        )}
      </div>
    </div>
  );
}
