import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getOrganizationBySlug } from "@/app/actions/organization";
import { getCustomer } from "@/app/actions/customer";
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
  params: Promise<{ locale: string; orgSlug: string; customerId: string }>;
};

export default async function EditCustomerPage({ params }: Props) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${orgSlug}/customers/${customerId}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t("customers.form.editTitle")}</h1>
          <p className="text-muted-foreground">{customer.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("customers.form.editTitle")}</CardTitle>
          <CardDescription>
            {t("customers.form.editDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm
            organizationId={organization.id}
            orgSlug={orgSlug}
            customer={customer}
            mode="edit"
          />
        </CardContent>
      </Card>
    </div>
  );
}
