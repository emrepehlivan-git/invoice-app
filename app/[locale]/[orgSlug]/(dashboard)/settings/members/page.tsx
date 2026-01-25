import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { getOrganizationBySlug, getOrganizationMembers } from "@/app/actions/organization";
import { getOrganizationInvitations } from "@/app/actions/invitation";
import { redirect } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SettingsNav } from "@/components/settings/settings-nav";
import { AlertCircle } from "lucide-react";
import { Role } from "@/types";
import { MembersList } from "@/components/settings/members-list";
import { InviteMemberForm } from "@/components/settings/invite-member-form";
import { PendingInvitationsList } from "@/components/settings/pending-invitations-list";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function MembersSettingsPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const session = await getSession();

  if (!session?.user) {
    return redirect({ href: "/login", locale });
  }

  const user = session.user;
  const organization = await getOrganizationBySlug(orgSlug);

  if (!organization) {
    notFound();
  }

  const [members, invitations] = await Promise.all([
    getOrganizationMembers(organization.id),
    getOrganizationInvitations(organization.id),
  ]);

  const t = await getTranslations("settings");
  const isAdmin = organization.role === Role.ADMIN;

  return (
    <div className="space-y-6">
      <SettingsNav orgSlug={orgSlug} />

      <div>
        <h1 className="text-3xl font-bold">{t("members.title")}</h1>
        <p className="text-muted-foreground">{t("members.description")}</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("members.currentMembers")}</CardTitle>
            <CardDescription>{t("members.currentMembersDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <MembersList
              members={members}
              currentUserId={user.id}
              isAdmin={isAdmin}
            />
          </CardContent>
        </Card>

        {isAdmin ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t("members.inviteTitle")}</CardTitle>
                <CardDescription>{t("members.inviteDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <InviteMemberForm organizationId={organization.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("members.pendingInvitations")}</CardTitle>
                <CardDescription>{t("members.pendingInvitationsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <PendingInvitationsList
                  invitations={invitations}
                  locale={locale}
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("organization.adminOnly")}</AlertTitle>
            <AlertDescription>
              {t("members.adminOnlyDescription")}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
