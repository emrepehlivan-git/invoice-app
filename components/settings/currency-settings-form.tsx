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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { updateOrganizationSettings } from "@/app/actions/organization";

const formSchema = z.object({
  baseCurrency: z.string().length(3),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  organizationId: string;
  currentBaseCurrency: string;
  locale: string;
};

export function CurrencySettingsForm({
  organizationId,
  currentBaseCurrency,
  locale,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseCurrency: currentBaseCurrency,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const result = await updateOrganizationSettings(organizationId, {
        baseCurrency: values.baseCurrency,
      });

      if (result.error) {
        toast.error(t("settings.currency.messages.error"));
        return;
      }

      toast.success(t("settings.currency.messages.success"));
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="baseCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("settings.currency.fields.baseCurrency")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.currency.fields.selectCurrency")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {locale === "tr" ? currency.name : currency.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {t("settings.currency.fields.baseCurrencyHint")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  );
}
