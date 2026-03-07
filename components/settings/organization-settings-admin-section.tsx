import { SettingsCard } from "@/components/settings/settings-card";
import { CurrencySettingsForm } from "@/components/settings/currency-settings-form";
import { ExchangeRatesForm } from "@/components/settings/exchange-rates-form";
import { InvoiceNumberFormatForm } from "@/components/settings/invoice-number-format-form";
import { OrganizationLogoUpload } from "@/components/settings/organization-logo-upload";
import { OrganizationInfoForm } from "@/components/settings/organization-info-form";
import type { OrganizationWithRole } from "@/types";
import type { ExchangeRate } from "@/types";
import type { TranslationFunction } from "@/types";

interface OrganizationSettingsAdminSectionProps {
  organization: OrganizationWithRole;
  exchangeRates: ExchangeRate[];
  locale: string;
  t: TranslationFunction;
}

export function OrganizationSettingsAdminSection({
  organization,
  exchangeRates,
  locale,
  t,
}: OrganizationSettingsAdminSectionProps) {
  return (
    <>
      <SettingsCard
        title={t("organization.logo.title")}
        description={t("organization.logo.description")}
      >
        <OrganizationLogoUpload
          organizationId={organization.id}
          currentLogoUrl={organization.logo}
        />
      </SettingsCard>

      <SettingsCard
        title={t("organization.contactInfo.title")}
        description={t("organization.contactInfo.description")}
      >
        <OrganizationInfoForm
          organizationId={organization.id}
          initialValues={{
            email: organization.email,
            phone: organization.phone,
            address: organization.address,
            taxNumber: organization.taxNumber,
          }}
        />
      </SettingsCard>

      <SettingsCard
        title={t("currency.title")}
        description={t("currency.description")}
      >
        <CurrencySettingsForm
          organizationId={organization.id}
          currentBaseCurrency={organization.baseCurrency}
          locale={locale}
        />
      </SettingsCard>

      <SettingsCard
        title={t("exchangeRates.title")}
        description={t("exchangeRates.description")}
      >
        <ExchangeRatesForm
          organizationId={organization.id}
          baseCurrency={organization.baseCurrency}
          exchangeRates={exchangeRates}
          locale={locale}
        />
      </SettingsCard>

      <SettingsCard
        title={t("invoiceNumberFormat.title")}
        description={t("invoiceNumberFormat.description")}
      >
        <InvoiceNumberFormatForm
          organizationId={organization.id}
          currentPrefix={organization.invoiceNumberPrefix}
          currentPadding={organization.invoiceNumberPadding}
          currentIncludeYear={organization.invoiceNumberIncludeYear}
        />
      </SettingsCard>
    </>
  );
}
