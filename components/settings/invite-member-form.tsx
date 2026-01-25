"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role } from "@/types";
import { createInvitationSchema, type InvitationInput } from "@/lib/validators/invitation";
import { createInvitation } from "@/app/actions/invitation";
import { UserPlus, Loader2 } from "lucide-react";

type Props = {
  organizationId: string;
};

export function InviteMemberForm({ organizationId }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const schema = createInvitationSchema(t);

  const form = useForm<InvitationInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      role: Role.MEMBER,
    },
  });

  async function onSubmit(values: InvitationInput) {
    setIsLoading(true);
    try {
      const result = await createInvitation(organizationId, values);

      if ("error" in result) {
        const errorKey = `settings.members.errors.${result.error}`;
        const errorMessage = t.has(errorKey) ? t(errorKey) : t("errors.unknownError");
        toast.error(errorMessage);
        return;
      }

      toast.success(t("settings.members.messages.inviteSuccess"));
      form.reset();
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
        <div className="flex flex-col sm:flex-row gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{t("settings.members.fields.email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("settings.members.fields.emailPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="sm:w-40">
                <FormLabel>{t("settings.members.fields.role")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("settings.members.fields.selectRole")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={Role.ADMIN}>
                      {t("organization.roles.admin")}
                    </SelectItem>
                    <SelectItem value={Role.MEMBER}>
                      {t("organization.roles.member")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          {t("settings.members.inviteButton")}
        </Button>
      </form>
    </Form>
  );
}
