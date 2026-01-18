"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Link } from "@/i18n/navigation";
import { createOrganization } from "@/app/actions/organization";
import {
  createOrganizationSchema,
  type OrganizationInput,
} from "@/lib/validators/organization";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function CreateOrganizationForm() {
  const t = useTranslations();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);

  const locale = params.locale as string;

  const organizationSchema = createOrganizationSchema(t);

  const form = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const watchName = form.watch("name");

  function handleNameChange(value: string) {
    form.setValue("name", value);
    const currentSlug = form.getValues("slug");
    const expectedSlug = slugify(form.getValues("name").slice(0, -1));

    if (!currentSlug || currentSlug === expectedSlug) {
      form.setValue("slug", slugify(value));
    }
  }

  async function onSubmit(data: OrganizationInput) {
    setIsLoading(true);
    try {
      const result = await createOrganization({ ...data, locale });

      if (result?.error) {
        if (result.error === "slug_exists") {
          form.setError("slug", {
            message: t("organization.errors.slugExists"),
          });
        } else {
          toast.error(t("organization.create.error"));
        }
      } else {
        toast.success(t("organization.create.success"));
      }
    } catch (error) {
      const isRedirect = error && typeof error === "object" && "digest" in error && typeof error.digest === "string" && error.digest.includes("NEXT_REDIRECT");

      if (!isRedirect) {
        toast.error(t("common.error"));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/onboarding">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <CardTitle className="text-2xl">
              {t("organization.create.title")}
            </CardTitle>
            <CardDescription>
              {t("organization.create.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("organization.create.submit")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
