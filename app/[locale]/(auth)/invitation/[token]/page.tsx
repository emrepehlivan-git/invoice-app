import { setRequestLocale } from "next-intl/server";
import { getInvitationByToken } from "@/app/actions/invitation";
import { getSession } from "@/lib/auth/session";
import { InvitationAcceptForm } from "./invitation-accept-form";
import { InvitationError } from "./invitation-error";

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

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
