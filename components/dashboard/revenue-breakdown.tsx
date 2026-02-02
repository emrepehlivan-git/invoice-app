"use client";

import { useState } from "react";
import { RevenueChart } from "./revenue-chart";
import { PeriodSelector } from "./period-selector";
import type { MonthlyRevenueData, YearlyRevenueData } from "@/app/actions/invoice";

type RevenueBreakdownProps = {
  monthlyData: MonthlyRevenueData[];
  yearlyData: YearlyRevenueData[];
  baseCurrency: string;
  locale: string;
};

export function RevenueBreakdown({
  monthlyData,
  yearlyData,
  baseCurrency,
  locale,
}: RevenueBreakdownProps) {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      <RevenueChart
        data={period === "monthly" ? monthlyData : yearlyData}
        period={period}
        baseCurrency={baseCurrency}
        locale={locale}
      />
    </div>
  );
}
