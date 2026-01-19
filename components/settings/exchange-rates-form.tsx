"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SUPPORTED_CURRENCIES, formatCurrency } from "@/lib/currency";
import { upsertExchangeRate, deleteExchangeRate } from "@/app/actions/exchange-rate";
import type { ExchangeRate } from "@/prisma/generated/prisma";

const formSchema = z.object({
  fromCurrency: z.string().length(3),
  rate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Rate must be a positive number",
  }),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  organizationId: string;
  baseCurrency: string;
  exchangeRates: ExchangeRate[];
  locale: string;
};

export function ExchangeRatesForm({
  organizationId,
  baseCurrency,
  exchangeRates,
  locale,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rateToDelete, setRateToDelete] = useState<ExchangeRate | null>(null);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);

  // Filter out base currency from options
  const availableCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) => c.code !== baseCurrency
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromCurrency: availableCurrencies[0]?.code ?? "",
      rate: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const result = await upsertExchangeRate(organizationId, {
        fromCurrency: values.fromCurrency,
        rate: Number(values.rate),
      });

      if (result.error) {
        if (result.error === "same_currency") {
          toast.error(t("settings.exchangeRates.errors.sameCurrency"));
        } else {
          toast.error(t("settings.exchangeRates.messages.error"));
        }
        return;
      }

      toast.success(t("settings.exchangeRates.messages.success"));
      form.reset({ fromCurrency: availableCurrencies[0]?.code ?? "", rate: "" });
      setEditingRate(null);
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(rate: ExchangeRate) {
    setEditingRate(rate);
    form.setValue("fromCurrency", rate.fromCurrency);
    form.setValue("rate", Number(rate.rate).toString());
  }

  function handleCancelEdit() {
    setEditingRate(null);
    form.reset({ fromCurrency: availableCurrencies[0]?.code ?? "", rate: "" });
  }

  function handleDeleteClick(rate: ExchangeRate) {
    setRateToDelete(rate);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!rateToDelete) return;

    setIsLoading(true);
    try {
      const result = await deleteExchangeRate(rateToDelete.id);

      if (result.error) {
        toast.error(t("settings.exchangeRates.messages.deleteError"));
        return;
      }

      toast.success(t("settings.exchangeRates.messages.deleteSuccess"));
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setRateToDelete(null);
    }
  }

  const baseCurrencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === baseCurrency);

  return (
    <div className="space-y-6">
      {/* Current rates */}
      {exchangeRates.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">
            {t("settings.exchangeRates.currentRates")}
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("settings.exchangeRates.table.currency")}</TableHead>
                <TableHead className="text-right">
                  {t("settings.exchangeRates.table.rate")}
                </TableHead>
                <TableHead className="text-right">
                  {t("settings.exchangeRates.table.example")}
                </TableHead>
                <TableHead className="w-[100px]">
                  {t("settings.exchangeRates.table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exchangeRates.map((rate) => {
                const currencyInfo = SUPPORTED_CURRENCIES.find(
                  (c) => c.code === rate.fromCurrency
                );
                return (
                  <TableRow key={rate.id}>
                    <TableCell>
                      {currencyInfo?.symbol} {rate.fromCurrency}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(rate.rate).toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      1 {rate.fromCurrency} = {formatCurrency(Number(rate.rate), baseCurrency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(rate)}
                          disabled={isLoading}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">{t("common.edit")}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(rate)}
                          disabled={isLoading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">{t("common.delete")}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Update rate form */}
      <div>
        <h4 className="text-sm font-medium mb-3">
          {editingRate
            ? t("settings.exchangeRates.editRate")
            : t("settings.exchangeRates.addRate")}
        </h4>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-4 items-end">
            <FormField
              control={form.control}
              name="fromCurrency"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>{t("settings.exchangeRates.fields.currency")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!editingRate}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCurrencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>
                    {t("settings.exchangeRates.fields.rate", {
                      base: baseCurrencyInfo?.symbol ?? baseCurrency,
                    })}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="35.50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("common.loading") : t("common.save")}
              </Button>
              {editingRate && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </form>
        </Form>
        <p className="text-xs text-muted-foreground mt-2">
          {t("settings.exchangeRates.hint", {
            base: baseCurrencyInfo?.symbol ?? baseCurrency,
          })}
        </p>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.exchangeRates.deleteDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.exchangeRates.deleteDialog.description", {
                currency: rateToDelete?.fromCurrency ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
