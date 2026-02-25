"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateInvoiceNumberFormat } from "@/app/actions/organization";

function createFormSchema(prefixInvalidMsg: string) {
  return z.object({
    invoiceNumberPrefix: z
      .string()
      .min(1)
      .max(20)
      .regex(/^[A-Za-z0-9-]+$/, prefixInvalidMsg),
    invoiceNumberPadding: z.number().int().min(1).max(10),
    invoiceNumberIncludeYear: z.boolean(),
  });
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

type Props = {
  organizationId: string;
  currentPrefix: string;
  currentPadding: number;
  currentIncludeYear: boolean;
};

const PADDING_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function InvoiceNumberFormatForm({
  organizationId,
  currentPrefix,
  currentPadding,
  currentIncludeYear,
}: Props) {
  const t = useTranslations("settings.invoiceNumberFormat");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t("fields.prefixInvalid"))),
    defaultValues: {
      invoiceNumberPrefix: currentPrefix,
      invoiceNumberPadding: currentPadding,
      invoiceNumberIncludeYear: currentIncludeYear,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const result = await updateInvoiceNumberFormat(organizationId, {
        invoiceNumberPrefix: values.invoiceNumberPrefix,
        invoiceNumberPadding: values.invoiceNumberPadding,
        invoiceNumberIncludeYear: values.invoiceNumberIncludeYear,
      });

      if (result.error) {
        toast.error(t("messages.error"));
        return;
      }

      toast.success(t("messages.success"));
      router.refresh();
    } catch {
      toast.error(t("messages.error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="invoiceNumberPrefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.prefix")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="INV"
                  className="max-w-[180px]"
                  onChange={(e) =>
                    field.onChange(e.target.value.toUpperCase().replace(/\s/g, ""))
                  }
                />
              </FormControl>
              <FormDescription>{t("fields.prefixHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="invoiceNumberPadding"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fields.padding")}</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(parseInt(v, 10))}
                value={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger className="max-w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PADDING_OPTIONS.map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} {t("fields.digits")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{t("fields.paddingHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="invoiceNumberIncludeYear"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t("fields.includeYear")}</FormLabel>
                <FormDescription>{t("fields.includeYearHint")}</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? t("messages.saving")
            : t("messages.save")}
        </Button>
      </form>
    </Form>
  );
}
