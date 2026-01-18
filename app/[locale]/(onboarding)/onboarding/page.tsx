import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
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
import { OrganizationList } from "@/components/common/organization-list";

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
        <OrganizationList organizations={organizations} />

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
