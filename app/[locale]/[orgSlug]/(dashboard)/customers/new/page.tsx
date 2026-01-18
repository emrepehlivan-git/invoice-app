import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getOrganizationBySlug } from "@/app/actions/organization";
import { redirect, Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CustomerForm } from "@/components/customers/customer-form";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function NewCustomerPage({ params }: Props) {
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

  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${orgSlug}/customers`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t("customers.form.createTitle")}</h1>
          <p className="text-muted-foreground">
            {t("customers.form.createDescription")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("customers.form.createTitle")}</CardTitle>
          <CardDescription>
            {t("customers.form.createDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm
            organizationId={organization.id}
            orgSlug={orgSlug}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  );
}
