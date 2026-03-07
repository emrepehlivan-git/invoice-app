"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateOrganizationInfo } from "@/app/actions/organization";

const formSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  taxNumber: z.string().max(50).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  organizationId: string;
  initialValues: {
    email: string | null;
    phone: string | null;
    address: string | null;
    taxNumber: string | null;
  };
};

export function OrganizationInfoForm({
  organizationId,
  initialValues,
}: Props) {
  const t = useTranslations("settings.organization.contactInfo");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: initialValues.email ?? "",
      phone: initialValues.phone ?? "",
      address: initialValues.address ?? "",
      taxNumber: initialValues.taxNumber ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const result = await updateOrganizationInfo(organizationId, {
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        taxNumber: values.taxNumber || undefined,
      });

      if (result.error) {
        toast.error(t("error"));
        return;
      }

      toast.success(t("success"));
      router.refresh();
    } catch {
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder={t("emailPlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("phone")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder={t("phonePlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("address")}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={t("addressPlaceholder")}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("taxNumber")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("taxNumberPlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("saving") : t("save")}
        </Button>
      </form>
    </Form>
  );
}
