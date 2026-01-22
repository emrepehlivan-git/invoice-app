"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createCustomer, updateCustomer } from "@/app/actions/customer";
import {
  createCustomerSchema,
  type CustomerInput,
} from "@/lib/validators/customer";
import type { Customer } from "@/types";
import { ErrorCode } from "@/lib/errors/types";

type CustomerFormProps = {
  organizationId: string;
  orgSlug: string;
  customer?: Customer;
  mode: "create" | "edit";
};

export function CustomerForm({
  organizationId,
  orgSlug,
  customer,
  mode,
}: CustomerFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const customerSchema = createCustomerSchema(t);

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      taxNumber: customer?.taxNumber ?? "",
      address: customer?.address ?? "",
      city: customer?.city ?? "",
      country: customer?.country ?? "",
      postalCode: customer?.postalCode ?? "",
      notes: customer?.notes ?? "",
    },
  });

  async function onSubmit(data: CustomerInput) {
    setIsLoading(true);
    try {
      const result =
        mode === "create"
          ? await createCustomer(organizationId, data)
          : await updateCustomer(customer!.id, data);

      if (result?.error) {
        if (result.error === ErrorCode.EMAIL_EXISTS) {
          form.setError("email", {
            message: t("customers.errors.emailExists"),
          });
        } else if (result.error === ErrorCode.UNAUTHORIZED) {
          toast.error(t("customers.errors.unauthorized"));
        } else {
          toast.error(
            mode === "create"
              ? t("customers.messages.createError")
              : t("customers.messages.updateError")
          );
        }
        return;
      }

      toast.success(
        mode === "create"
          ? t("customers.messages.createSuccess")
          : t("customers.messages.updateSuccess")
      );

      router.push(`/${orgSlug}/customers`);
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
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t("customers.fields.name")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("customers.fields.namePlaceholder")}
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("customers.fields.email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("customers.fields.emailPlaceholder")}
                    disabled={isLoading}
                    {...field}
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
                <FormLabel>{t("customers.fields.phone")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("customers.fields.phonePlaceholder")}
                    disabled={isLoading}
                    {...field}
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
                <FormLabel>{t("customers.fields.taxNumber")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("customers.fields.taxNumberPlaceholder")}
                    disabled={isLoading}
                    {...field}
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
              <FormItem className="md:col-span-2">
                <FormLabel>{t("customers.fields.address")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("customers.fields.addressPlaceholder")}
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("customers.fields.city")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("customers.fields.cityPlaceholder")}
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("customers.fields.country")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("customers.fields.countryPlaceholder")}
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("customers.fields.postalCode")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("customers.fields.postalCodePlaceholder")}
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t("customers.fields.notes")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("customers.fields.notesPlaceholder")}
                    disabled={isLoading}
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isLoading
              ? t("customers.form.submitting")
              : t("customers.form.submit")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => router.push(`/${orgSlug}/customers`)}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
