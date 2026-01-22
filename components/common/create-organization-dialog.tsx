"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createOrganization } from "@/app/actions/organization";
import {
  createOrganizationSchema,
  type OrganizationInput,
} from "@/lib/validators/organization";
import { slugify } from "@/lib/utils";
import { ErrorCode } from "@/lib/errors/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateOrganizationDialog({ open, onOpenChange }: Props) {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [previousName, setPreviousName] = useState("");

  const locale = params.locale as string;

  const organizationSchema = createOrganizationSchema(t);

  const form = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  function handleNameChange(value: string) {
    form.setValue("name", value);
    const currentSlug = form.getValues("slug");
    const previousSlug = slugify(previousName);

    if (!currentSlug || currentSlug === previousSlug) {
      form.setValue("slug", slugify(value));
    }
    setPreviousName(value);
  }

  async function onSubmit(data: OrganizationInput) {
    setIsLoading(true);
    try {
      const result = await createOrganization({ ...data, locale });

      if (result?.error) {
        if (result.error === ErrorCode.SLUG_EXISTS) {
          form.setError("slug", {
            message: t("organization.errors.slugExists"),
          });
        } else {
          toast.error(t("organization.create.error"));
        }
        return;
      }

      toast.success(t("organization.create.success"));
      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      const isRedirect =
        error &&
        typeof error === "object" &&
        "digest" in error &&
        typeof error.digest === "string" &&
        error.digest.includes("NEXT_REDIRECT");

      if (!isRedirect) {
        toast.error(t("common.error"));
      } else {
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      form.reset();
      setPreviousName("");
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("organization.create.title")}</DialogTitle>
          <DialogDescription>
            {t("organization.create.description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("organization.fields.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("organization.fields.namePlaceholder")}
                      disabled={isLoading}
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("organization.fields.slug")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("organization.fields.slugPlaceholder")}
                      disabled={isLoading}
                      {...field}
                      onChange={(e) =>
                        field.onChange(slugify(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    {t("organization.fields.slugHint")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t("organization.create.submit")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
