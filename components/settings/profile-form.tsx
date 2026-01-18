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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateProfile } from "@/app/actions/user";
import {
  createUpdateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validators/user";

type ProfileFormProps = {
  user: {
    name: string;
    email: string;
  };
};

export function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const profileSchema = createUpdateProfileSchema(t);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
    },
  });

  async function onSubmit(data: UpdateProfileInput) {
    setIsLoading(true);
    try {
      const result = await updateProfile(data);

      if (result?.error) {
        toast.error(t("settings.profile.messages.error"));
        return;
      }

      toast.success(t("settings.profile.messages.success"));
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("settings.profile.fields.name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("settings.profile.fields.namePlaceholder")}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>{t("settings.profile.fields.email")}</FormLabel>
          <Input value={user.email} disabled className="mt-2" />
          <p className="text-sm text-muted-foreground mt-1">
            {t("settings.profile.fields.emailHint")}
          </p>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {isLoading
            ? t("settings.profile.submitting")
            : t("settings.profile.submit")}
        </Button>
      </form>
    </Form>
  );
}
