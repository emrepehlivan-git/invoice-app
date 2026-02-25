import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getOrganizationBySlug } from "@/app/actions/organization";
import { getCustomers } from "@/app/actions/customer";
import { redirect, Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerListActions } from "@/components/customers/customer-list-actions";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function CustomersPage({ params }: Props) {
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

  const customers = await getCustomers(organization.id);

  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("customers.title")}</h1>
          <p className="text-muted-foreground">
            {t("customers.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CustomerListActions
            organizationId={organization.id}
            customers={customers}
            locale={locale}
          />
          <Button asChild>
            <Link href={`/${orgSlug}/customers/new`}>
              <Plus className="mr-2 size-4" />
              {t("customers.create")}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("customers.list.title")}</CardTitle>
          <CardDescription>{t("customers.list.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerTable
            customers={customers}
            orgSlug={orgSlug}
            locale={locale}
          />
        </CardContent>
      </Card>
    </div>
  );
}
