import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Plus, Building2 } from "lucide-react";
import { getUserOrganizations } from "@/app/actions/organization";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OnboardingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();
  const organizations = await getUserOrganizations();

  if (organizations.length === 1) {
    redirect(`/${locale}/${organizations[0].slug}`);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("organization.select.title")}</CardTitle>
        <CardDescription>{t("organization.select.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {organizations.length > 0 ? (
          <div className="space-y-2">
            {organizations.map((org) => (
              <Link
                key={org.id}
                href={`/${org.slug}`}
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{org.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`organization.roles.${org.role.toLowerCase()}`)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Building2 className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {t("organization.select.empty")}
            </p>
          </div>
        )}

        <Button asChild className="w-full">
          <Link href="/onboarding/create">
            <Plus className="mr-2 size-4" />
            {t("organization.select.createNew")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
