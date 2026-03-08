import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { ResetPasswordForm } from "./reset-password-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.resetPassword");
  return { title: t("title") };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { token, error } = await searchParams;
  setRequestLocale(locale);

  const session = await getSession();
  if (session?.user) {
    redirect({ href: "/", locale });
  }

  return <ResetPasswordForm token={token ?? null} error={error ?? null} />;
}
