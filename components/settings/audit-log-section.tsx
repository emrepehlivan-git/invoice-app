"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarIcon, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { type AuditLog, AuditAction } from "@/types";
import { getAuditLogs, getAuditLogsForExport, type AuditLogFilters } from "@/app/actions/audit-log";
import { isActionError, getErrorMessage } from "@/lib/errors";
import { exportAuditLogsToCSV } from "@/lib/export/audit-log-export";
import { downloadCSV } from "@/lib/export/invoice-export";

type AuditLogSectionProps = {
  initialLogs: AuditLog[];
  initialTotal: number;
  organizationId: string;
  locale: string;
};

const PAGE_SIZE = 20;
const ENTITY_TYPES = ["Invoice", "Customer", "ExchangeRate", "Organization", "Payment"];

export function AuditLogSection({
  initialLogs,
  initialTotal,
  organizationId,
  locale,
}: AuditLogSectionProps) {
  const t = useTranslations("settings.auditLog");
  const tRoot = useTranslations();
  const dateLocale = locale === "tr" ? tr : enUS;

  const [logs, setLogs] = useState(initialLogs);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [search, setSearch] = useState("");

  async function loadPage(pageNum: number) {
    setIsLoading(true);
    try {
      const filters: AuditLogFilters = {};
      if (actionFilter !== "all") {
        filters.action = actionFilter as AuditAction;
      }
      if (entityTypeFilter !== "all") {
        filters.entityType = entityTypeFilter;
      }
      if (dateRange?.from) {
        filters.dateFrom = dateRange.from;
      }
      if (dateRange?.to) {
        filters.dateTo = dateRange.to;
      }
      if (search.trim()) {
        filters.search = search.trim();
      }

      const result = await getAuditLogs(organizationId, filters, {
        page: pageNum,
        pageSize: PAGE_SIZE,
      });
      if (isActionError(result)) {
        toast.error(getErrorMessage(result, (key) => tRoot(key)));
        return;
      }
      if (result.data) {
        setLogs(result.data.logs);
        setTotalCount(result.data.totalCount);
        setPage(pageNum);
      }
    } catch {
      toast.error(t("errorLoading") ?? "Could not load audit log");
    } finally {
      setIsLoading(false);
    }
  }

  function handleApplyFilters() {
    setPage(1);
    loadPage(1);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const filters: AuditLogFilters = {};
      if (actionFilter !== "all") {
        filters.action = actionFilter as AuditAction;
      }
      if (entityTypeFilter !== "all") {
        filters.entityType = entityTypeFilter;
      }
      if (dateRange?.from) {
        filters.dateFrom = dateRange.from;
      }
      if (dateRange?.to) {
        filters.dateTo = dateRange.to;
      }
      if (search.trim()) {
        filters.search = search.trim();
      }

      const exportLogs = await getAuditLogsForExport(organizationId, filters);
      if (isActionError(exportLogs)) {
        toast.error(getErrorMessage(exportLogs, (key) => tRoot(key)));
        return;
      }
      const csv = exportAuditLogsToCSV(exportLogs.data, locale);
      const filename = `audit-log-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
      downloadCSV(csv, filename);
    } catch {
      toast.error(t("errorLoading") ?? "Could not export");
    } finally {
      setIsExporting(false);
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalCount);

  const actionLabels: Record<string, string> = {
    [AuditAction.CREATE]: t("action.CREATE"),
    [AuditAction.UPDATE]: t("action.UPDATE"),
    [AuditAction.DELETE]: t("action.DELETE"),
    [AuditAction.STATUS_CHANGE]: t("action.STATUS_CHANGE"),
  };

  function actionLabel(action: string): string {
    return actionLabels[action] ?? action;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">{t("filters.action")}</label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allActions")}</SelectItem>
              <SelectItem value={AuditAction.CREATE}>{t("action.CREATE")}</SelectItem>
              <SelectItem value={AuditAction.UPDATE}>{t("action.UPDATE")}</SelectItem>
              <SelectItem value={AuditAction.DELETE}>{t("action.DELETE")}</SelectItem>
              <SelectItem value={AuditAction.STATUS_CHANGE}>{t("action.STATUS_CHANGE")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">{t("filters.entityType")}</label>
          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
              {ENTITY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd MMM yyyy", { locale: dateLocale })} -{" "}
                    {format(dateRange.to, "dd MMM yyyy", { locale: dateLocale })}
                  </>
                ) : (
                  format(dateRange.from, "dd MMM yyyy", { locale: dateLocale })
                )
              ) : (
                t("filters.dateRange")
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={dateLocale}
            />
          </PopoverContent>
        </Popover>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">{t("filters.search")}</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("filters.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              className="pl-8 w-[180px]"
            />
          </div>
        </div>
        <Button onClick={handleApplyFilters} disabled={isLoading}>
          {t("filters.apply")}
        </Button>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {t("export")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.date")}</TableHead>
              <TableHead>{t("table.action")}</TableHead>
              <TableHead>{t("table.entityType")}</TableHead>
              <TableHead>{t("table.entityId")}</TableHead>
              <TableHead>{t("table.userId")}</TableHead>
              <TableHead>{t("table.ip")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t("noLogs")}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", {
                      locale: dateLocale,
                    })}
                  </TableCell>
                  <TableCell>{actionLabel(log.action)}</TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[120px] truncate" title={log.entityId}>
                    {log.entityId}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.userId ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.ipAddress ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("pagination.showing", { from, to, total: totalCount })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPage(page - 1)}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {t("pagination.page", { current: page, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPage(page + 1)}
              disabled={page >= totalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
