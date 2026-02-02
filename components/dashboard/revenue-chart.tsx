"use client";

import { useTranslations } from "next-intl";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import type { MonthlyRevenueData, YearlyRevenueData } from "@/app/actions/invoice";

type RevenueChartProps = {
  data: MonthlyRevenueData[] | YearlyRevenueData[];
  period: "monthly" | "yearly";
  baseCurrency: string;
  locale: string;
};

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  outstanding: {
    label: "Outstanding",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function getMonthName(monthNumber: number, locale: string): string {
  const date = new Date(2024, monthNumber - 1, 1);
  return date.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    month: "short",
  });
}

export function RevenueChart({
  data,
  period,
  baseCurrency,
  locale,
}: RevenueChartProps) {
  const t = useTranslations();

  // Transform data for the chart
  const chartData = data.map((item) => {
    if (period === "monthly") {
      const monthlyItem = item as MonthlyRevenueData;
      return {
        name: getMonthName(monthlyItem.monthNumber, locale),
        fullLabel: `${getMonthName(monthlyItem.monthNumber, locale)} ${monthlyItem.year}`,
        revenue: Math.round(monthlyItem.revenue),
        outstanding: Math.round(monthlyItem.outstanding),
      };
    } else {
      const yearlyItem = item as YearlyRevenueData;
      return {
        name: String(yearlyItem.year),
        fullLabel: String(yearlyItem.year),
        revenue: Math.round(yearlyItem.revenue),
        outstanding: Math.round(yearlyItem.outstanding),
      };
    }
  });

  // Calculate totals for the description
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOutstanding = chartData.reduce(
    (sum, item) => sum + item.outstanding,
    0
  );

  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string) => {
    const label =
      name === "revenue"
        ? t("dashboard.chart.revenue")
        : t("dashboard.chart.outstanding");
    return [formatCurrency(value, baseCurrency), label];
  };

  // Localized chart config
  const localizedConfig: ChartConfig = {
    revenue: {
      label: t("dashboard.chart.revenue"),
      color: "hsl(var(--chart-1))",
    },
    outstanding: {
      label: t("dashboard.chart.outstanding"),
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.chart.title")}</CardTitle>
        <CardDescription>
          {period === "monthly"
            ? t("dashboard.chart.monthlyDescription")
            : t("dashboard.chart.yearlyDescription")}
          {" • "}
          {t("dashboard.chart.totalRevenue")}: {formatCurrency(totalRevenue, baseCurrency)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={localizedConfig} className="h-[300px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
                  notation: "compact",
                  compactDisplay: "short",
                }).format(value)
              }
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              content={
                <ChartTooltipContent
                  labelKey="fullLabel"
                  formatter={(value, name) => {
                    const label =
                      name === "revenue"
                        ? t("dashboard.chart.revenue")
                        : t("dashboard.chart.outstanding");
                    return (
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono font-medium">
                          {formatCurrency(value as number, baseCurrency)}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="outstanding"
              fill="var(--color-outstanding)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
