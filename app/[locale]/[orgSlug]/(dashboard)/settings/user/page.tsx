import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getOrganizationBySlug } from "@/app/actions/organization";
import { getUserProfile } from "@/app/actions/user";
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
import { SettingsNav } from "@/components/settings/settings-nav";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function UserSettingsPage({ params }: Props) {
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

  const { user, hasPasswordAccount } = await getUserProfile();

  const t = await getTranslations("settings");

  return (
    <div className="space-y-6">
      <SettingsNav orgSlug={orgSlug} />

      <div>
        <h1 className="text-3xl font-bold">{t("nav.user")}</h1>
        <p className="text-muted-foreground">{t("user.description")}</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.title")}</CardTitle>
            <CardDescription>{t("profile.description")}</CardDescription>
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
            <CardTitle>{t("password.title")}</CardTitle>
            <CardDescription>{t("password.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {hasPasswordAccount ? (
              <PasswordForm />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("password.notAvailable")}</AlertTitle>
                <AlertDescription>
                  {t("password.notAvailableDescription")}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
