import { setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "./reset-password-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { token, error } = await searchParams;
  setRequestLocale(locale);

  return <ResetPasswordForm token={token ?? null} error={error ?? null} />;
}
