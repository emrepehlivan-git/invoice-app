/**
 * Currency utilities for formatting and managing currencies
 * Uses ISO 4217 currency codes
 */

export const SUPPORTED_CURRENCIES = [
  { code: "TRY", symbol: "₺", name: "Türk Lirası", nameEn: "Turkish Lira" },
  { code: "USD", symbol: "$", name: "Amerikan Doları", nameEn: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro", nameEn: "Euro" },
  { code: "GBP", symbol: "£", name: "İngiliz Sterlini", nameEn: "British Pound" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

/**
 * Get currency info by code
 */
export function getCurrency(code: string) {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code) ?? SUPPORTED_CURRENCIES[0];
}

/**
 * Format amount with currency
 * Uses the currency's native locale for proper formatting
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const localeMap: Record<string, string> = {
    TRY: "tr-TR",
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
  };

  const locale = localeMap[currencyCode] ?? "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

/**
 * Format amount with currency symbol only (compact)
 */
export function formatCurrencyCompact(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);

  const localeMap: Record<string, string> = {
    TRY: "tr-TR",
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
  };

  const locale = localeMap[currencyCode] ?? "en-US";

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${currency.symbol}${formatted}`;
}

/**
 * Get currency label for display (localized)
 */
export function getCurrencyLabel(code: string, locale: string): string {
  const currency = getCurrency(code);
  return locale === "tr" ? currency.name : currency.nameEn;
}

/**
 * Group amounts by currency and calculate totals
 */
export function groupByCurrency<T extends { currency: string; total: number }>(
  items: T[]
): Record<string, number> {
  return items.reduce(
    (acc, item) => {
      const currency = item.currency;
      acc[currency] = (acc[currency] ?? 0) + item.total;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Format multiple currency totals for display
 */
export function formatMultiCurrencyTotal(
  totals: Record<string, number>
): string[] {
  return Object.entries(totals)
    .filter(([, amount]) => amount > 0)
    .map(([currency, amount]) => formatCurrency(amount, currency));
}

/**
 * Convert amount from one currency to base currency
 */
export function convertToBaseCurrency(
  amount: number,
  fromCurrency: string,
  baseCurrency: string,
  ratesMap: Record<string, number>
): number {
  // Same currency, no conversion needed
  if (fromCurrency === baseCurrency) {
    return amount;
  }

  const rate = ratesMap[fromCurrency];
  if (!rate) {
    // No rate found, return 0 (or could throw error)
    return 0;
  }

  return amount * rate;
}
