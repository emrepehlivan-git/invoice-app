import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { ForgotPasswordForm } from "./forgot-password-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (session?.user) {
    redirect({ href: "/", locale });
  }

  return <ForgotPasswordForm />;
}
