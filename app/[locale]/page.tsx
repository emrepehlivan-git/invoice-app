import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">Invoice App</h1>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          {locale === "tr" ? "Giriş Yap" : "Sign In"}
        </Link>
        <Link
          href="/register"
          className="rounded-md border px-4 py-2 hover:bg-accent"
        >
          {locale === "tr" ? "Kayıt Ol" : "Sign Up"}
        </Link>
      </div>
    </div>
  );
}
