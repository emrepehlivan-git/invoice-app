import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import {
  getCachedOrganizationBySlug,
  getCachedUserOrganizations,
} from "@/lib/cached-queries";
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
  const sessionUser = session?.user;
  if (!sessionUser) {
    redirect({ href: "/login", locale });
  }
  const user = sessionUser as NonNullable<typeof sessionUser>;

  const [organization, organizations] = await Promise.all([
    getCachedOrganizationBySlug(orgSlug),
    getCachedUserOrganizations(),
  ]);

  if (!organization) {
    notFound();
  }

  return (
    <SidebarProvider>
      <div className="no-print">
        <DashboardSidebar
          organization={organization}
          organizations={organizations}
          user={user}
          locale={locale}
        />
      </div>
      <SidebarInset className="flex flex-col overflow-hidden">
        <div className="no-print">
          <DashboardHeader organization={organization} user={user} />
        </div>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
