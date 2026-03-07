import { SettingsCard } from "@/components/settings/settings-card";
import type { TranslationFunction } from "@/types";

interface OrganizationNameCardProps {
  organizationName: string;
  t: TranslationFunction;
}

export function OrganizationNameCard({
  organizationName,
  t,
}: OrganizationNameCardProps) {
  return (
    <SettingsCard
      title={t("organization.info")}
      description={t("organization.infoDescription")}
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium">{t("organization.name")}</p>
          <p className="text-sm text-muted-foreground">{organizationName}</p>
        </div>
      </div>
    </SettingsCard>
  );
}
