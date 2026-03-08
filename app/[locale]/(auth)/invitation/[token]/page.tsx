import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getInvitationByToken } from "@/app/actions/invitation";
import { getSession } from "@/lib/auth/session";
import { InvitationAcceptForm } from "./invitation-accept-form";
import { InvitationError } from "./invitation-error";

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("invitation");
  return { title: t("title") };
}

export default async function InvitationPage({ params }: Props) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  const result = await getInvitationByToken(token);

  if ("error" in result && result.error) {
    return <InvitationError errorCode={result.error} locale={locale} />;
  }

  const invitation = result.data;

  return (
    <InvitationAcceptForm
      invitation={invitation}
      token={token}
      isLoggedIn={!!session?.user}
      userEmail={session?.user?.email}
    />
  );
}
