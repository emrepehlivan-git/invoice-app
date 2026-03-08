import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getCachedOrganizationBySlug } from "@/lib/cached-queries";
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
import { ArrowLeft } from "lucide-react";
import { InvoiceForm } from "@/components/invoices/invoice-form";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("invoices.form");
  return { title: t("createTitle") };
}

export default async function NewInvoicePage({ params }: Props) {
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

  const customers = await getCustomers(organization.id);

  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${orgSlug}/invoices`} aria-label={t("common.back")}>
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {t("invoices.form.createTitle")}
          </h1>
          <p className="text-muted-foreground">
            {t("invoices.form.createDescription")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("invoices.form.createTitle")}</CardTitle>
          <CardDescription>
            {t("invoices.form.createDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            organization={organization}
            orgSlug={orgSlug}
            customers={customers}
            mode="create"
            locale={locale}
          />
        </CardContent>
      </Card>
    </div>
  );
}
