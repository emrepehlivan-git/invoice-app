"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { InvoiceStatus } from "@/types";
import type { Customer } from "@/types";

type DashboardFiltersProps = {
  customers: Customer[];
  locale: string;
  onFiltersChange: (filters: {
    dateRange?: { from: Date; to: Date };
    customerId?: string;
    status?: InvoiceStatus;
  }) => void;
};

export function DashboardFilters({
  customers,
  locale,
  onFiltersChange,
}: DashboardFiltersProps) {
  const t = useTranslations();
  const dateLocale = locale === "tr" ? tr : enUS;

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [status, setStatus] = useState<InvoiceStatus | undefined>();

  function handleDateRangeChange(range: DateRange | undefined) {
    setDateRange(range);
    if (range?.from && range?.to) {
      onFiltersChange({
        dateRange: { from: range.from, to: range.to },
        customerId,
        status,
      });
    } else {
      onFiltersChange({ customerId, status });
    }
  }

  function handleCustomerChange(value: string) {
    const newCustomerId = value === "all" ? undefined : value;
    setCustomerId(newCustomerId);
    onFiltersChange({
      dateRange: dateRange?.from && dateRange?.to
        ? { from: dateRange.from, to: dateRange.to }
        : undefined,
      customerId: newCustomerId,
      status,
    });
  }

  function handleStatusChange(value: string) {
    const newStatus = value === "all" ? undefined : (value as InvoiceStatus);
    setStatus(newStatus);
    onFiltersChange({
      dateRange: dateRange?.from && dateRange?.to
        ? { from: dateRange.from, to: dateRange.to }
        : undefined,
      customerId,
      status: newStatus,
    });
  }

  function handleClearFilters() {
    setDateRange(undefined);
    setCustomerId(undefined);
    setStatus(undefined);
    onFiltersChange({});
  }

  const hasActiveFilters =
    (dateRange?.from && dateRange?.to) || customerId || status;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd MMM yyyy", {
                    locale: dateLocale,
                  })}{" "}
                  -{" "}
                  {format(dateRange.to, "dd MMM yyyy", {
                    locale: dateLocale,
                  })}
                </>
              ) : (
                format(dateRange.from, "dd MMM yyyy", { locale: dateLocale })
              )
            ) : (
              <span>{t("dashboard.filters.dateRange")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
            locale={dateLocale}
          />
        </PopoverContent>
      </Popover>

      <Select value={customerId || "all"} onValueChange={handleCustomerChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t("dashboard.filters.customer")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("dashboard.filters.allCustomers")}</SelectItem>
          {customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status || "all"} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t("dashboard.filters.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("dashboard.filters.allStatuses")}</SelectItem>
          <SelectItem value={InvoiceStatus.DRAFT}>
            {t(`invoices.status.${InvoiceStatus.DRAFT}`)}
          </SelectItem>
          <SelectItem value={InvoiceStatus.SENT}>
            {t(`invoices.status.${InvoiceStatus.SENT}`)}
          </SelectItem>
          <SelectItem value={InvoiceStatus.PAID}>
            {t(`invoices.status.${InvoiceStatus.PAID}`)}
          </SelectItem>
          <SelectItem value={InvoiceStatus.OVERDUE}>
            {t(`invoices.status.${InvoiceStatus.OVERDUE}`)}
          </SelectItem>
          <SelectItem value={InvoiceStatus.CANCELLED}>
            {t(`invoices.status.${InvoiceStatus.CANCELLED}`)}
          </SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-9 px-2 lg:px-3"
        >
          <X className="mr-2 size-4" />
          {t("dashboard.filters.clear")}
        </Button>
      )}
    </div>
  );
}
