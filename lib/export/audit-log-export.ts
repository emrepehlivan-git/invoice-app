import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import type { AuditLog } from "@/types";

export function exportAuditLogsToCSV(
  logs: AuditLog[],
  locale: string
): string {
  const dateLocale = locale === "tr" ? tr : enUS;

  const headers = [
    locale === "tr" ? "Tarih" : "Date",
    locale === "tr" ? "İşlem" : "Action",
    locale === "tr" ? "Varlık Türü" : "Entity Type",
    locale === "tr" ? "Varlık ID" : "Entity ID",
    locale === "tr" ? "Kullanıcı ID" : "User ID",
    locale === "tr" ? "IP" : "IP",
  ];

  const rows = logs.map((log) => [
    format(new Date(log.createdAt), "dd MMM yyyy HH:mm", {
      locale: dateLocale,
    }),
    log.action,
    log.entityType,
    log.entityId,
    log.userId ?? "",
    log.ipAddress ?? "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}
