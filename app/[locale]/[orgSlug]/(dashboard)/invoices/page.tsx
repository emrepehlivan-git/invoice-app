import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getOrganizationBySlug } from "@/app/actions/organization";
import { getInvoices, markOverdueInvoices } from "@/app/actions/invoice";
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
import { InvoiceTable } from "@/components/invoices/invoice-table";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function InvoicesPage({ params }: Props) {
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

  await markOverdueInvoices();
  const invoices = await getInvoices(organization.id);

  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("invoices.title")}</h1>
          <p className="text-muted-foreground">{t("invoices.description")}</p>
        </div>
        <Button asChild>
          <Link href={`/${orgSlug}/invoices/new`}>
            <Plus className="mr-2 size-4" />
            {t("invoices.create")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("invoices.list.title")}</CardTitle>
          <CardDescription>{t("invoices.list.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceTable invoices={invoices} orgSlug={orgSlug} locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
