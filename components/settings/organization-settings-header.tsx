import type { TranslationFunction } from "@/types";

interface OrganizationSettingsHeaderProps {
  t: TranslationFunction;
}

export function OrganizationSettingsHeader({ t }: OrganizationSettingsHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{t("nav.organization")}</h1>
      <p className="text-muted-foreground">{t("organization.description")}</p>
    </div>
  );
}
