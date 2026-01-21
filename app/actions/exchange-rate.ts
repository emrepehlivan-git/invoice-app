"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";
import logger from "@/lib/logger";
import type { ExchangeRate } from "@/prisma/generated/prisma";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit";

const exchangeRateSchema = z.object({
  fromCurrency: z.string().length(3),
  rate: z.number().positive(),
});

type ExchangeRateInput = z.infer<typeof exchangeRateSchema>;

type ExchangeRateResult =
  | { error: string; data?: never }
  | { data: ExchangeRate; error?: never };

async function verifyOrganizationAccess(organizationId: string): Promise<boolean> {
  const session = await requireAuth();

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
  });

  return !!membership;
}

/**
 * Get all exchange rates for an organization
 */
export async function getExchangeRates(
  organizationId: string
): Promise<ExchangeRate[]> {
  try {
    const hasAccess = await verifyOrganizationAccess(organizationId);
    if (!hasAccess) {
      return [];
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { baseCurrency: true },
    });

    if (!organization) {
      return [];
    }

    // Get the latest rate for each currency pair
    const rates = await prisma.exchangeRate.findMany({
      where: {
        organizationId,
        toCurrency: organization.baseCurrency,
      },
      orderBy: { effectiveDate: "desc" },
      distinct: ["fromCurrency"],
    });

    return rates;
  } catch (error) {
    logger.error("Failed to get exchange rates", { error, organizationId });
    throw error;
  }
}

/**
 * Get the latest exchange rate for a specific currency
 */
export async function getLatestExchangeRate(
  organizationId: string,
  fromCurrency: string
): Promise<ExchangeRate | null> {
  try {
    const hasAccess = await verifyOrganizationAccess(organizationId);
    if (!hasAccess) {
      return null;
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { baseCurrency: true },
    });

    if (!organization) {
      return null;
    }

    const rate = await prisma.exchangeRate.findFirst({
      where: {
        organizationId,
        fromCurrency,
        toCurrency: organization.baseCurrency,
      },
      orderBy: { effectiveDate: "desc" },
    });

    return rate;
  } catch (error) {
    logger.error("Failed to get latest exchange rate", {
      error,
      organizationId,
      fromCurrency,
    });
    throw error;
  }
}

/**
 * Create or update an exchange rate
 */
export async function upsertExchangeRate(
  organizationId: string,
  data: ExchangeRateInput
): Promise<ExchangeRateResult> {
  try {
    const hasAccess = await verifyOrganizationAccess(organizationId);
    if (!hasAccess) {
      return { error: "unauthorized" };
    }

    const validated = exchangeRateSchema.parse(data);

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { baseCurrency: true },
    });

    if (!organization) {
      return { error: "organization_not_found" };
    }

    // Don't allow setting rate for base currency to itself
    if (validated.fromCurrency === organization.baseCurrency) {
      return { error: "same_currency" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if rate already exists to determine audit action
    const existingRate = await prisma.exchangeRate.findUnique({
      where: {
        organizationId_fromCurrency_toCurrency_effectiveDate: {
          organizationId,
          fromCurrency: validated.fromCurrency,
          toCurrency: organization.baseCurrency,
          effectiveDate: today,
        },
      },
    });

    // Upsert: update if exists for today, create if not
    const exchangeRate = await prisma.exchangeRate.upsert({
      where: {
        organizationId_fromCurrency_toCurrency_effectiveDate: {
          organizationId,
          fromCurrency: validated.fromCurrency,
          toCurrency: organization.baseCurrency,
          effectiveDate: today,
        },
      },
      update: {
        rate: validated.rate,
      },
      create: {
        organizationId,
        fromCurrency: validated.fromCurrency,
        toCurrency: organization.baseCurrency,
        rate: validated.rate,
        effectiveDate: today,
      },
    });

    revalidatePath("/");

    // Audit log
    if (existingRate) {
      await auditUpdate("ExchangeRate", exchangeRate.id, {
        fromCurrency: existingRate.fromCurrency,
        toCurrency: existingRate.toCurrency,
        rate: Number(existingRate.rate),
      }, {
        fromCurrency: exchangeRate.fromCurrency,
        toCurrency: exchangeRate.toCurrency,
        rate: Number(exchangeRate.rate),
      }, organizationId);
    } else {
      await auditCreate("ExchangeRate", exchangeRate.id, {
        fromCurrency: exchangeRate.fromCurrency,
        toCurrency: exchangeRate.toCurrency,
        rate: Number(exchangeRate.rate),
      }, organizationId);
    }

    return { data: exchangeRate };
  } catch (error) {
    logger.error("Failed to upsert exchange rate", { error, organizationId, data });
    throw error;
  }
}

/**
 * Get exchange rates map for quick lookup
 * Returns a map of currency -> rate (to base currency)
 */
export async function getExchangeRatesMap(
  organizationId: string
): Promise<Record<string, number>> {
  try {
    const rates = await getExchangeRates(organizationId);

    const ratesMap: Record<string, number> = {};
    for (const rate of rates) {
      ratesMap[rate.fromCurrency] = Number(rate.rate);
    }

    return ratesMap;
  } catch (error) {
    logger.error("Failed to get exchange rates map", { error, organizationId });
    throw error;
  }
}

type DeleteResult =
  | { error: string; success?: never }
  | { success: true; error?: never };

/**
 * Delete an exchange rate
 */
export async function deleteExchangeRate(
  exchangeRateId: string
): Promise<DeleteResult> {
  try {
    const exchangeRate = await prisma.exchangeRate.findUnique({
      where: { id: exchangeRateId },
    });

    if (!exchangeRate) {
      return { error: "not_found" };
    }

    const hasAccess = await verifyOrganizationAccess(exchangeRate.organizationId);
    if (!hasAccess) {
      return { error: "unauthorized" };
    }

    await prisma.exchangeRate.delete({
      where: { id: exchangeRateId },
    });

    revalidatePath("/");

    // Audit log
    await auditDelete("ExchangeRate", exchangeRateId, {
      fromCurrency: exchangeRate.fromCurrency,
      toCurrency: exchangeRate.toCurrency,
      rate: Number(exchangeRate.rate),
    }, exchangeRate.organizationId);

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete exchange rate", { error, exchangeRateId });
    throw error;
  }
}

