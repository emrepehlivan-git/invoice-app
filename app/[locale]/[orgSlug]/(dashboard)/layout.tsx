import { redirect, notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import {
  getOrganizationBySlug,
  getUserOrganizations,
} from "@/app/actions/organization";
import { DashboardSidebar } from "@/components/common/dashboard-sidebar";
import { DashboardHeader } from "@/components/common/dashboard-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function DashboardLayout({ children, params }: Props) {
  const { locale, orgSlug } = await params;
  setRequestLocale(locale);

  const session = await getSession();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const [organization, organizations] = await Promise.all([
    getOrganizationBySlug(orgSlug),
    getUserOrganizations(),
  ]);

  if (!organization) {
    notFound();
  }

  return (
    <SidebarProvider>
      <DashboardSidebar
        organization={organization}
        organizations={organizations}
        user={session.user}
        locale={locale}
      />
      <SidebarInset className="flex flex-col overflow-hidden">
        <DashboardHeader organization={organization} user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
