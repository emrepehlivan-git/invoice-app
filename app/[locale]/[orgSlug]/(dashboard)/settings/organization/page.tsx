import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getOrganizationBySlug } from "@/app/actions/organization";
import { getExchangeRates } from "@/app/actions/exchange-rate";
import { redirect } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CurrencySettingsForm } from "@/components/settings/currency-settings-form";
import { ExchangeRatesForm } from "@/components/settings/exchange-rates-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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

  const organization = await getOrganizationBySlug(orgSlug);

  if (!organization) {
    notFound();
  }

  const exchangeRates = await getExchangeRates(organization.id);
  const t = await getTranslations("settings");
  const isAdmin = organization.role === Role.ADMIN;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("nav.organization")}</h1>
        <p className="text-muted-foreground">{t("organization.description")}</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("organization.info")}</CardTitle>
            <CardDescription>{t("organization.infoDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{t("organization.name")}</p>
                <p className="text-sm text-muted-foreground">
                  {organization.name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t("currency.title")}</CardTitle>
                <CardDescription>{t("currency.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <CurrencySettingsForm
                  organizationId={organization.id}
                  currentBaseCurrency={organization.baseCurrency}
                  locale={locale}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("exchangeRates.title")}</CardTitle>
                <CardDescription>
                  {t("exchangeRates.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExchangeRatesForm
                  organizationId={organization.id}
                  baseCurrency={organization.baseCurrency}
                  exchangeRates={exchangeRates}
                  locale={locale}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("organization.adminOnly")}</AlertTitle>
            <AlertDescription>
              {t("organization.adminOnlyDescription")}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
