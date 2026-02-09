"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, DollarSign, TrendingUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { InvoiceStatus } from "@/types";
import { formatCurrency, formatMultiCurrencyTotal } from "@/lib/currency";
import { RevenueBreakdown } from "./revenue-breakdown";
import { DashboardFilters } from "./dashboard-filters";
import type { InvoiceStats, MonthlyRevenueData, YearlyRevenueData, InvoiceFilters } from "@/app/actions/invoice";
import type { Customer } from "@/types";
import type { InvoiceWithCustomer } from "@/types";

type DashboardContentProps = {
  initialStats: InvoiceStats | null;
  initialInvoices: InvoiceWithCustomer[];
  initialCustomers: Customer[];
  initialMonthlyData: MonthlyRevenueData[];
  initialYearlyData: YearlyRevenueData[];
  organization: {
    id: string;
    name: string;
    baseCurrency: string;
  };
  orgSlug: string;
  locale: string;
};

const statusColors: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]:
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  [InvoiceStatus.SENT]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  [InvoiceStatus.PAID]:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  [InvoiceStatus.OVERDUE]:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  [InvoiceStatus.CANCELLED]:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};

export function DashboardContent({
  initialStats,
  initialInvoices,
  initialCustomers,
  initialMonthlyData,
  initialYearlyData,
  organization,
  orgSlug,
  locale,
}: DashboardContentProps) {
  const t = useTranslations();
  const dateLocale = locale === "tr" ? tr : enUS;

  const [stats, setStats] = useState(initialStats);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [monthlyData, setMonthlyData] = useState(initialMonthlyData);
  const [yearlyData, setYearlyData] = useState(initialYearlyData);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFiltersChange(filters: InvoiceFilters) {
    setIsLoading(true);
    try {
      const { getInvoiceStats, getInvoices, getMonthlyRevenueStats, getYearlyRevenueStats } = await import("@/app/actions/invoice");
      
      const [newStats, newInvoices, newMonthlyData, newYearlyData] = await Promise.all([
        getInvoiceStats(organization.id, filters),
        getInvoices(organization.id, filters),
        getMonthlyRevenueStats(organization.id, 12, filters),
        getYearlyRevenueStats(organization.id, 5, filters),
      ]);

      setStats(newStats);
      setInvoices(newInvoices);
      setMonthlyData(newMonthlyData);
      setYearlyData(newYearlyData);
    } catch (error) {
      console.error("Failed to update dashboard filters:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const recentInvoices = invoices.slice(0, 5);
  const recentCustomers = initialCustomers.slice(0, 5);

  const totalRevenueInBase = stats?.revenueInBaseCurrency ?? 0;
  const totalOutstandingInBase = stats?.outstandingInBaseCurrency ?? 0;
  const missingRates = stats?.missingHistoricalRates ?? [];

  const revenueBreakdown = stats?.revenueByCurrency
    ? formatMultiCurrencyTotal(stats.revenueByCurrency)
    : [];
  const outstandingBreakdown = stats?.outstandingByCurrency
    ? formatMultiCurrencyTotal(stats.outstandingByCurrency)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.welcome", { name: organization.name })}
        </p>
      </div>

      <DashboardFilters
        customers={initialCustomers}
        locale={locale}
        onFiltersChange={handleFiltersChange}
      />

      {isLoading && (
        <div className="text-center text-sm text-muted-foreground py-4">
          {t("dashboard.loading")}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.stats.totalInvoices")}
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.stats.invoicesDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.stats.totalCustomers")}
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialCustomers.length}</div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.stats.customersDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.stats.revenue")}
            </CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenueInBase, organization.baseCurrency)}
            </div>
            {revenueBreakdown.length > 1 && (
              <div className="mt-1 space-y-0.5">
                {revenueBreakdown.map((amount, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {amount}
                  </p>
                ))}
              </div>
            )}
            {missingRates.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {t("dashboard.stats.missingRates", {
                  currencies: missingRates.join(", "),
                })}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t("dashboard.stats.revenueDescription")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.stats.outstanding")}
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalOutstandingInBase, organization.baseCurrency)}
            </div>
            {outstandingBreakdown.length > 1 && (
              <div className="mt-1 space-y-0.5">
                {outstandingBreakdown.map((amount, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {amount}
                  </p>
                ))}
              </div>
            )}
            {missingRates.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {t("dashboard.stats.missingRates", {
                  currencies: missingRates.join(", "),
                })}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t("dashboard.stats.outstandingDescription")}
            </p>
          </CardContent>
        </Card>
      </div>

      <RevenueBreakdown
        monthlyData={monthlyData}
        yearlyData={yearlyData}
        baseCurrency={organization.baseCurrency}
        locale={locale}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentInvoices.title")}</CardTitle>
            <CardDescription>
              {t("dashboard.recentInvoices.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.recentInvoices.empty")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/${orgSlug}/invoices/${invoice.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.customer.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(Number(invoice.total), invoice.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invoice.issueDate), "dd MMM", {
                            locale: dateLocale,
                          })}
                        </p>
                      </div>
                      <Badge
                        className={statusColors[invoice.status]}
                        variant="secondary"
                      >
                        {t(`invoices.status.${invoice.status}`)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentCustomers.title")}</CardTitle>
            <CardDescription>
              {t("dashboard.recentCustomers.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentCustomers.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.recentCustomers.empty")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/${orgSlug}/customers/${customer.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.email || customer.phone || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(customer.createdAt), "dd MMM yyyy", {
                          locale: dateLocale,
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
