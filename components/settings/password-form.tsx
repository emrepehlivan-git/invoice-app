"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { changePassword } from "@/app/actions/user";
import {
  createChangePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validators/user";

export function PasswordForm() {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const passwordSchema = createChangePasswordSchema(t);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ChangePasswordInput) {
    setIsLoading(true);
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result?.error) {
        if (result.error === "invalid_current_password") {
          form.setError("currentPassword", {
            message: t("settings.password.errors.invalidCurrentPassword"),
          });
        } else if (result.error === "no_password_account") {
          toast.error(t("settings.password.errors.noPasswordAccount"));
        } else {
          toast.error(t("settings.password.messages.error"));
        }
        return;
      }

      toast.success(t("settings.password.messages.success"));
      form.reset();
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
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("settings.password.fields.currentPassword")}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t(
                    "settings.password.fields.currentPasswordPlaceholder"
                  )}
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
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("settings.password.fields.newPassword")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t(
                    "settings.password.fields.newPasswordPlaceholder"
                  )}
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("settings.password.fields.confirmPassword")}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t(
                    "settings.password.fields.confirmPasswordPlaceholder"
                  )}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {isLoading
            ? t("settings.password.submitting")
            : t("settings.password.submit")}
        </Button>
      </form>
    </Form>
  );
}
