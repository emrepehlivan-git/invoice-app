"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InvoiceStatusHistoryEntry } from "@/app/actions/invoice";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { History } from "lucide-react";

interface InvoiceStatusHistoryProps {
  entries: InvoiceStatusHistoryEntry[];
  locale: string;
}

export function InvoiceStatusHistory({
  entries,
  locale,
}: InvoiceStatusHistoryProps) {
  const t = useTranslations("invoices");
  const dateLocale = locale === "tr" ? tr : enUS;

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4" />
          {t("detail.statusHistory")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {entries.map((entry, i) => (
            <li
              key={`${entry.createdAt.toISOString()}-${i}`}
              className="flex flex-wrap items-center gap-2 text-sm"
            >
              <Badge variant="outline" className="font-normal">
                {entry.fromStatus ? t(`status.${entry.fromStatus}`) : "—"}
              </Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="secondary" className="font-normal">
                {t(`status.${entry.toStatus}`)}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {format(new Date(entry.createdAt), "PPp", {
                  locale: dateLocale,
                })}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
