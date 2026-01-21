-- AlterTable: Add exchange rate snapshot fields to Invoice
-- These fields store the historical exchange rate at the time of invoice creation
-- for accurate revenue/outstanding calculations in reports

ALTER TABLE "Invoice" ADD COLUMN "exchangeRateToBase" DECIMAL(12,6);
ALTER TABLE "Invoice" ADD COLUMN "totalInBaseCurrency" DECIMAL(12,2);

-- Backfill existing invoices with current exchange rates
-- This update sets totalInBaseCurrency for invoices where currency matches baseCurrency
UPDATE "Invoice" i
SET
  "exchangeRateToBase" = 1.0,
  "totalInBaseCurrency" = i.total
FROM "Organization" o
WHERE i."organizationId" = o.id
  AND i.currency = o."baseCurrency"
  AND i."exchangeRateToBase" IS NULL;

-- For invoices with different currencies, try to use existing exchange rates
-- Note: This will use the CURRENT rate, not the historical rate (since we don't have historical data)
-- For future invoices, the rate will be captured at creation time
UPDATE "Invoice" i
SET
  "exchangeRateToBase" = er.rate,
  "totalInBaseCurrency" = i.total * er.rate
FROM "Organization" o
JOIN "ExchangeRate" er ON er."organizationId" = o.id
WHERE i."organizationId" = o.id
  AND i.currency = er."fromCurrency"
  AND o."baseCurrency" = er."toCurrency"
  AND i."exchangeRateToBase" IS NULL;
