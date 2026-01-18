"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Building2,
  LogOut,
  Plus,
  ChevronDown,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";
import type { OrganizationWithRole } from "@/types";
import type { Session } from "@/lib/auth";
import { CreateOrganizationDialog } from "@/components/common/create-organization-dialog";

type Props = {
  organization: OrganizationWithRole;
  organizations: OrganizationWithRole[];
  user: Session["user"];
  locale: string;
};

export function DashboardSidebar({
  organization,
  organizations,
  user,
  locale,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const basePath = `/${organization.slug}`;

  const navItems = [
    {
      href: basePath,
      icon: LayoutDashboard,
      label: t("dashboard.nav.dashboard"),
    },
    {
      href: `${basePath}/invoices`,
      icon: FileText,
      label: t("dashboard.nav.invoices"),
    },
    {
      href: `${basePath}/customers`,
      icon: Users,
      label: t("dashboard.nav.customers"),
    },
    {
      href: `${basePath}/settings`,
      icon: Settings,
      label: t("dashboard.nav.settings"),
    },
  ];

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login", { locale });
  }

  function getInitials(name: string | null | undefined) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b space-y-2 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-2 h-auto py-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Building2 className="size-5 shrink-0" />
                <span className="font-semibold truncate text-left">
                  {organization.name}
                </span>
              </div>
              <ChevronDown className="size-4 shrink-0 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <div className="px-2 py-1.5">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("dashboard.user.switchOrg")}
              </p>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  asChild
                  className={
                    org.id === organization.id ? "bg-accent" : "cursor-pointer"
                  }
                >
                  <Link href={`/${org.slug}`}>
                    <Building2 className="mr-2 size-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{org.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t(`organization.roles.${org.role.toLowerCase()}`)}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsCreateDialogOpen(true)}
              onSelect={(e) => e.preventDefault()}
            >
              <Plus className="mr-2 size-4" />
              {t("organization.select.createNew")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("dashboard.nav.menu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-2">
                  <Avatar className="size-6">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-medium truncate max-w-[140px]">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {user.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  {t("dashboard.user.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
      <CreateOrganizationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </Sidebar>
  );
}
