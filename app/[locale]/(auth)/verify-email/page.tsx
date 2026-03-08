import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import VerifyEmailPageClient from "./verify-email-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.emailVerification");
  return { title: t("title") };
}

export default async function VerifyEmailPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (session?.user) {
    redirect({ href: "/", locale });
  }

  return <VerifyEmailPageClient />;
}
