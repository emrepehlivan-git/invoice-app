import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { LanguageSwitcher } from "@/components/common/language-switcher";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function OnboardingLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
