"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";
import type { ExchangeRate } from "@/prisma/generated/prisma";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit";
import {
  ErrorCode,
  type ActionResult,
  type SimpleResult,
  handleActionError,
  actionError,
  actionSuccess,
  simpleSuccess,
  simpleError,
  assertExists,
  assertAccess,
} from "@/lib/errors";

const exchangeRateSchema = z.object({
  fromCurrency: z.string().length(3),
  rate: z.number().positive(),
});

type ExchangeRateInput = z.infer<typeof exchangeRateSchema>;

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
  } catch {
    return [];
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
  } catch {
    return null;
  }
}

/**
 * Create or update an exchange rate
 */
export async function upsertExchangeRate(
  organizationId: string,
  data: ExchangeRateInput
): Promise<ActionResult<ExchangeRate>> {
  try {
    const hasAccess = await verifyOrganizationAccess(organizationId);
    assertAccess(hasAccess);

    const validated = exchangeRateSchema.parse(data);

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { baseCurrency: true },
    });
    assertExists(organization, "Organization", organizationId);

    // Don't allow setting rate for base currency to itself
    if (validated.fromCurrency === organization.baseCurrency) {
      return actionError(ErrorCode.INVALID_INPUT, "Cannot set rate for base currency to itself");
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

    return actionSuccess(exchangeRate);
  } catch (error) {
    return handleActionError(error, "upsertExchangeRate", { organizationId, data });
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
  } catch {
    return {};
  }
}

/**
 * Delete an exchange rate
 */
export async function deleteExchangeRate(
  exchangeRateId: string
): Promise<SimpleResult> {
  try {
    const exchangeRate = await prisma.exchangeRate.findUnique({
      where: { id: exchangeRateId },
    });
    assertExists(exchangeRate, "ExchangeRate", exchangeRateId);

    const hasAccess = await verifyOrganizationAccess(exchangeRate.organizationId);
    assertAccess(hasAccess);

    await prisma.exchangeRate.delete({
      where: { id: exchangeRateId },
    });

    revalidatePath("/");

    await auditDelete("ExchangeRate", exchangeRateId, {
      fromCurrency: exchangeRate.fromCurrency,
      toCurrency: exchangeRate.toCurrency,
      rate: Number(exchangeRate.rate),
    }, exchangeRate.organizationId);

    return simpleSuccess();
  } catch (error) {
    const result = handleActionError(error, "deleteExchangeRate", { exchangeRateId });
    return simpleError(result.error, result.message);
  }
}

