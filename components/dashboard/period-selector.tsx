"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PeriodSelectorProps = {
  value: "monthly" | "yearly";
  onChange: (value: "monthly" | "yearly") => void;
};

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const t = useTranslations();

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as "monthly" | "yearly")}>
      <TabsList>
        <TabsTrigger value="monthly">
          {t("dashboard.chart.monthly")}
        </TabsTrigger>
        <TabsTrigger value="yearly">
          {t("dashboard.chart.yearly")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
