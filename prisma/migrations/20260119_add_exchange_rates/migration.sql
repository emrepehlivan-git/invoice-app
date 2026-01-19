-- Rename defaultCurrency to baseCurrency in Organization table
ALTER TABLE "Organization" RENAME COLUMN "defaultCurrency" TO "baseCurrency";

-- Create ExchangeRate table
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DECIMAL(12,6) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- Create indexes for ExchangeRate
CREATE INDEX "ExchangeRate_organizationId_idx" ON "ExchangeRate"("organizationId");
CREATE INDEX "ExchangeRate_fromCurrency_toCurrency_idx" ON "ExchangeRate"("fromCurrency", "toCurrency");
CREATE INDEX "ExchangeRate_effectiveDate_idx" ON "ExchangeRate"("effectiveDate");
CREATE UNIQUE INDEX "ExchangeRate_organizationId_fromCurrency_toCurrency_effectiveDate_key" ON "ExchangeRate"("organizationId", "fromCurrency", "toCurrency", "effectiveDate");

-- Add foreign key constraint
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
