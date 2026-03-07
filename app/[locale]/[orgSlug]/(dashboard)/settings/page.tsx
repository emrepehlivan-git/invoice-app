import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function SettingsPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  redirect({ href: `/${orgSlug}/settings/organization`, locale });
}
