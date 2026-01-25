"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Building2, User, Users } from "lucide-react";
type Props = {
  orgSlug: string;
};

export function SettingsNav({ orgSlug }: Props) {
  const t = useTranslations("settings");
  const pathname = usePathname();

  const basePath = `/${orgSlug}/settings`;

  const navItems = [
    {
      href: `${basePath}/organization`,
      icon: Building2,
      label: t("nav.organization"),
    },
    {
      href: `${basePath}/members`,
      icon: Users,
      label: t("nav.members"),
      adminOnly: false, // All members can view, but only admin can manage
    },
    {
      href: `${basePath}/user`,
      icon: User,
      label: t("nav.user"),
    },
  ];

  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
