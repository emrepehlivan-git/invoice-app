import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getOrganizationBySlug } from "@/app/actions/organization";
import { getCustomer } from "@/app/actions/customer";
import { redirect, Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Mail, MapPin, FileText } from "lucide-react";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";

type Props = {
  params: Promise<{ locale: string; orgSlug: string; customerId: string }>;
};

export default async function CustomerDetailPage({ params }: Props) {
  const { locale, orgSlug, customerId } = await params;
  setRequestLocale(locale);

  const session = await getSession();

  if (!session?.user) {
    redirect({ href: "/login", locale });
  }

  const organization = await getOrganizationBySlug(orgSlug);

  if (!organization) {
    notFound();
  }

  const customer = await getCustomer(customerId);

  if (!customer) {
    notFound();
  }

  const t = await getTranslations();
  const dateLocale = locale === "tr" ? tr : enUS;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${orgSlug}/customers`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">
              {t("customers.detail.title")}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/${orgSlug}/customers/${customerId}/edit`}>
            <Pencil className="mr-2 size-4" />
            {t("customers.edit")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" />
              {t("customers.detail.contactInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("customers.fields.email")}
              </p>
              <p className="text-sm">
                {customer.email || t("customers.detail.noEmail")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("customers.fields.phone")}
              </p>
              <p className="text-sm">
                {customer.phone || t("customers.detail.noPhone")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("customers.fields.taxNumber")}
              </p>
              <p className="text-sm">{customer.taxNumber || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5" />
              {t("customers.detail.addressInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("customers.fields.address")}
              </p>
              <p className="text-sm">
                {customer.address || t("customers.detail.noAddress")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("customers.fields.city")}
                </p>
                <p className="text-sm">{customer.city || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("customers.fields.postalCode")}
                </p>
                <p className="text-sm">{customer.postalCode || "-"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("customers.fields.country")}
              </p>
              <p className="text-sm">{customer.country || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              {t("customers.detail.additionalInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("customers.fields.notes")}
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {customer.notes || t("customers.detail.noNotes")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("customers.detail.createdAt")}
                </p>
                <p className="text-sm">
                  {format(new Date(customer.createdAt), "dd MMMM yyyy, HH:mm", {
                    locale: dateLocale,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("customers.detail.updatedAt")}
                </p>
                <p className="text-sm">
                  {format(new Date(customer.updatedAt), "dd MMMM yyyy, HH:mm", {
                    locale: dateLocale,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
