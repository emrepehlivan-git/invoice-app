import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getOrganizationBySlug } from "@/app/actions/organization";
import { getInvoiceStats, getInvoices, getMonthlyRevenueStats, getYearlyRevenueStats } from "@/app/actions/invoice";
import { getCustomers } from "@/app/actions/customer";
import { redirect } from "@/i18n/navigation";
import { DashboardContent } from "@/components/dashboard";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function DashboardPage({ params }: Props) {
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

  const [stats, invoices, customers, monthlyData, yearlyData] = await Promise.all([
    getInvoiceStats(organization.id),
    getInvoices(organization.id),
    getCustomers(organization.id),
    getMonthlyRevenueStats(organization.id, 12),
    getYearlyRevenueStats(organization.id, 5),
  ]);

  return (
    <DashboardContent
      initialStats={stats}
      initialInvoices={invoices}
      initialCustomers={customers}
      initialMonthlyData={monthlyData}
      initialYearlyData={yearlyData}
      organization={{
        id: organization.id,
        name: organization.name,
        baseCurrency: organization.baseCurrency,
      }}
      orgSlug={orgSlug}
      locale={locale}
    />
  );
}
