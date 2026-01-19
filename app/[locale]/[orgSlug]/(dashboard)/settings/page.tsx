import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getOrganizationBySlug } from "@/app/actions/organization";
import { getUserProfile } from "@/app/actions/user";
import { getExchangeRates } from "@/app/actions/exchange-rate";
import { redirect } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { CurrencySettingsForm } from "@/components/settings/currency-settings-form";
import { ExchangeRatesForm } from "@/components/settings/exchange-rates-form";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Role } from "@/types";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function SettingsPage({ params }: Props) {
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

  const [{ user, hasPasswordAccount }, exchangeRates] = await Promise.all([
    getUserProfile(),
    getExchangeRates(organization.id),
  ]);

  const t = await getTranslations();
  const isAdmin = organization.role === Role.ADMIN;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.description")}</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.organization.title")}</CardTitle>
            <CardDescription>
              {t("settings.organization.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">
                  {t("settings.organization.name")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {organization.name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.currency.title")}</CardTitle>
                <CardDescription>
                  {t("settings.currency.description")}
                </CardDescription>
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
                <CardTitle>{t("settings.exchangeRates.title")}</CardTitle>
                <CardDescription>
                  {t("settings.exchangeRates.description")}
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
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.profile.title")}</CardTitle>
            <CardDescription>
              {t("settings.profile.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user && (
              <ProfileForm
                user={{
                  name: user.name,
                  email: user.email,
                }}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.password.title")}</CardTitle>
            <CardDescription>
              {t("settings.password.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPasswordAccount ? (
              <PasswordForm />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("settings.password.notAvailable")}</AlertTitle>
                <AlertDescription>
                  {t("settings.password.notAvailableDescription")}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
