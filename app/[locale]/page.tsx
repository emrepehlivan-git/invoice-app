import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();

  if (session?.user) {
    redirect(`/${locale}/onboarding`);
  }

  redirect(`/${locale}/login`);
}
