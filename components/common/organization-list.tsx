import { Building2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { OrganizationWithRole } from "@/types";
import { getTranslations } from "next-intl/server";

type Props = {
  organizations: OrganizationWithRole[];
  showEmpty?: boolean;
};

export async function OrganizationList({
  organizations,
  showEmpty = true,
}: Props) {
  const t = await getTranslations();

  if (organizations.length === 0 && !showEmpty) {
    return null;
  }

  if (organizations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <Building2 className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {t("organization.select.empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {organizations.map((org) => (
        <Link
          key={org.id}
          href={`/${org.slug}`}
          className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{org.name}</p>
            <p className="text-sm text-muted-foreground">
              {t(`organization.roles.${org.role.toLowerCase()}`)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
