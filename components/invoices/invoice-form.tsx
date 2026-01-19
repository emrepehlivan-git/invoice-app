"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Trash2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createInvoice, updateInvoice } from "@/app/actions/invoice";
import { createInvoiceSchema, type InvoiceInput } from "@/lib/validators/invoice";
import { SUPPORTED_CURRENCIES, formatCurrency } from "@/lib/currency";
import type { Customer, InvoiceWithRelations, Organization } from "@/types";

type InvoiceFormProps = {
  organization: Organization;
  orgSlug: string;
  customers: Customer[];
  invoice?: InvoiceWithRelations;
  mode: "create" | "edit";
  locale: string;
};

export function InvoiceForm({
  organization,
  orgSlug,
  customers,
  invoice,
  mode,
  locale,
}: InvoiceFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const dateLocale = locale === "tr" ? tr : enUS;
  const invoiceSchema = createInvoiceSchema(t);

  const defaultItems = invoice?.items.map((item) => ({
    description: item.description,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
  })) ?? [{ description: "", quantity: 1, unitPrice: 0 }];

  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: invoice?.customerId ?? "",
      currency: invoice?.currency ?? organization.baseCurrency ?? "TRY",
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate) : new Date(),
      dueDate: invoice?.dueDate
        ? new Date(invoice.dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      taxRate: invoice?.taxRate ? Number(invoice.taxRate) : 0,
      notes: invoice?.notes ?? "",
      items: defaultItems,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const watchTaxRate = form.watch("taxRate");
  const watchCurrency = form.watch("currency");

  const subtotal = watchItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);

  const taxAmount = subtotal * ((watchTaxRate || 0) / 100);
  const total = subtotal + taxAmount;

  async function onSubmit(data: InvoiceInput) {
    setIsLoading(true);
    try {
      const result =
        mode === "create"
          ? await createInvoice(organization.id, data)
          : await updateInvoice(invoice!.id, data);

      if (result?.error) {
        if (result.error === "customer_not_found") {
          toast.error(t("invoices.errors.customerNotFound"));
        } else if (result.error === "cannot_edit") {
          toast.error(t("invoices.errors.cannotEdit"));
        } else if (result.error === "unauthorized") {
          toast.error(t("invoices.errors.unauthorized"));
        } else {
          toast.error(
            mode === "create"
              ? t("invoices.messages.createError")
              : t("invoices.messages.updateError")
          );
        }
        return;
      }

      toast.success(
        mode === "create"
          ? t("invoices.messages.createSuccess")
          : t("invoices.messages.updateSuccess")
      );

      router.push(`/${orgSlug}/invoices`);
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("invoices.fields.customer")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("invoices.form.selectCustomer")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {t("invoices.form.noCustomers")}
                      </SelectItem>
                    ) : (
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("invoices.fields.currency")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("invoices.form.selectCurrency")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} -{" "}
                        {locale === "tr" ? currency.name : currency.nameEn}
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
            name="taxRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("invoices.fields.taxRate")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={isLoading}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div /> {/* Spacer for grid alignment */}

          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("invoices.fields.issueDate")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: dateLocale })
                        ) : (
                          <span>{t("invoices.fields.issueDate")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={dateLocale}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("invoices.fields.dueDate")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: dateLocale })
                        ) : (
                          <span>{t("invoices.fields.dueDate")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={dateLocale}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>{t("invoices.items.title")}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ description: "", quantity: 1, unitPrice: 0 })
              }
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("invoices.form.addItem")}
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">
                    {t("invoices.items.description")}
                  </TableHead>
                  <TableHead className="w-[15%]">
                    {t("invoices.items.quantity")}
                  </TableHead>
                  <TableHead className="w-[20%]">
                    {t("invoices.items.unitPrice")}
                  </TableHead>
                  <TableHead className="w-[15%] text-right">
                    {t("invoices.items.total")}
                  </TableHead>
                  <TableHead className="w-[10%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      {t("invoices.items.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder={t(
                                    "invoices.items.descriptionPlaceholder"
                                  )}
                                  disabled={isLoading}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  disabled={isLoading}
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  disabled={isLoading}
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          (watchItems[index]?.quantity || 0) *
                            (watchItems[index]?.unitPrice || 0),
                          watchCurrency
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={isLoading || fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    {t("invoices.fields.subtotal")}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(subtotal, watchCurrency)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    {t("invoices.fields.taxAmount")} ({watchTaxRate || 0}%)
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(taxAmount, watchCurrency)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">
                    {t("invoices.fields.total")}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(total, watchCurrency)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("invoices.fields.notes")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("invoices.fields.notesPlaceholder")}
                  disabled={isLoading}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isLoading
              ? t("invoices.form.submitting")
              : t("invoices.form.submit")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => router.push(`/${orgSlug}/invoices`)}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
