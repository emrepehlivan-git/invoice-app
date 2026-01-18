/**
 * Translation interpolation values type
 * Used for passing dynamic values to translation functions
 * Compatible with next-intl's TranslationValues
 */
export type TranslationValues = Record<string, string | number | Date>;

/**
 * Translation function type
 * Compatible with next-intl's useTranslations hook return type
 */
export type TranslationFunction = (
  key: string,
  values?: TranslationValues
) => string;
