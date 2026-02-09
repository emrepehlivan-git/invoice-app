"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { InvoiceStatus, DiscountType } from "@/types";
import type { InvoiceWithCustomer, InvoiceWithRelations } from "@/types";
import logger from "@/lib/logger";
import { Decimal } from "@/prisma/generated/prisma/runtime/library";
import { auditCreate, auditUpdate, auditDelete, auditStatusChange } from "@/lib/audit";
import { verifyAccess } from "@/lib/auth/rbac";
import { getExchangeRatesMap } from "./exchange-rate";
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
} from "@/lib/errors";
import { getEmailService } from "@/lib/email/service";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { getInvoicePdfLabels } from "@/lib/pdf/labels";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

const invoiceItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0.01).max(999999),
  unitPrice: z.number().min(0).max(99999999),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1),
  currency: z.string().min(1),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  discountType: z.nativeEnum(DiscountType).nullable().optional(),
  discountValue: z.number().min(0).max(100).nullable().optional(),
  taxRate: z.number().min(0).max(100),
  notes: z.string().max(1000).optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1),
});

type InvoiceInput = z.infer<typeof invoiceSchema>;

async function generateInvoiceNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear();

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      organizationId,
      invoiceNumber: {
        startsWith: `INV-${year}-`,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
  });

  let nextNumber = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split("-");
    const lastNumber = parseInt(parts[2], 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `INV-${year}-${nextNumber.toString().padStart(4, "0")}`;
}

function calculateTotals(
  items: InvoiceInput["items"],
  taxRate: number,
  discountType?: DiscountType | null,
  discountValue?: number | null
) {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  // Calculate discount amount based on type
  let discountAmount = 0;
  if (discountType && discountValue && discountValue > 0) {
    if (discountType === DiscountType.PERCENTAGE) {
      discountAmount = subtotal * (discountValue / 100);
    } else if (discountType === DiscountType.FIXED) {
      discountAmount = Math.min(discountValue, subtotal); // Can't discount more than subtotal
    }
  }

  // Calculate tax on discounted amount
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  return {
    subtotal: new Decimal(subtotal.toFixed(2)),
    discountAmount: new Decimal(discountAmount.toFixed(2)),
    taxAmount: new Decimal(taxAmount.toFixed(2)),
    total: new Decimal(total.toFixed(2)),
  };
}

/**
 * Calculate exchange rate snapshot for invoice
 * This captures the exchange rate at invoice creation time for accurate historical reporting
 */
async function calculateExchangeRateSnapshot(
  organizationId: string,
  invoiceCurrency: string,
  total: Decimal
): Promise<{ exchangeRateToBase: Decimal | null; totalInBaseCurrency: Decimal | null }> {
  try {
    // Get organization's base currency
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { baseCurrency: true },
    });

    if (!organization) {
      return { exchangeRateToBase: null, totalInBaseCurrency: null };
    }

    const baseCurrency = organization.baseCurrency;

    // If invoice currency is same as base currency, rate is 1.0
    if (invoiceCurrency === baseCurrency) {
      return {
        exchangeRateToBase: new Decimal(1),
        totalInBaseCurrency: total,
      };
    }

    // Get current exchange rate for this currency
    const ratesMap = await getExchangeRatesMap(organizationId);
    const rate = ratesMap[invoiceCurrency];

    if (!rate) {
      // No exchange rate defined - store null (will use current rate in reports)
      return { exchangeRateToBase: null, totalInBaseCurrency: null };
    }

    const exchangeRateToBase = new Decimal(rate.toFixed(6));
    const totalInBaseCurrency = new Decimal((Number(total) * rate).toFixed(2));

    return { exchangeRateToBase, totalInBaseCurrency };
  } catch (error) {
    logger.error("Failed to calculate exchange rate snapshot", {
      error,
      organizationId,
      invoiceCurrency,
    });
    return { exchangeRateToBase: null, totalInBaseCurrency: null };
  }
}

export async function createInvoice(
  organizationId: string,
  data: InvoiceInput
): Promise<ActionResult<InvoiceWithRelations>> {
  try {
    // Members can create invoices
    await verifyAccess(organizationId, "create");

    const validated = invoiceSchema.parse(data);

    // Verify customer belongs to organization
    const customer = await prisma.customer.findFirst({
      where: {
        id: validated.customerId,
        organizationId,
      },
    });

    if (!customer) {
      return actionError(ErrorCode.NOT_FOUND, "Customer not found");
    }

    const invoiceNumber = await generateInvoiceNumber(organizationId);
    const { subtotal, discountAmount, taxAmount, total } = calculateTotals(
      validated.items,
      validated.taxRate,
      validated.discountType,
      validated.discountValue
    );

    // Capture exchange rate snapshot at invoice creation time
    const { exchangeRateToBase, totalInBaseCurrency } = await calculateExchangeRateSnapshot(
      organizationId,
      validated.currency,
      total
    );

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        organizationId,
        customerId: validated.customerId,
        currency: validated.currency,
        issueDate: validated.issueDate,
        dueDate: validated.dueDate,
        discountType: validated.discountType || null,
        discountValue: validated.discountValue ? new Decimal(validated.discountValue) : null,
        discountAmount,
        taxRate: new Decimal(validated.taxRate),
        subtotal,
        taxAmount,
        total,
        exchangeRateToBase,
        totalInBaseCurrency,
        notes: validated.notes || null,
        items: {
          create: validated.items.map((item) => ({
            description: item.description,
            quantity: new Decimal(item.quantity),
            unitPrice: new Decimal(item.unitPrice),
            total: new Decimal((item.quantity * item.unitPrice).toFixed(2)),
          })),
        },
      },
      include: {
        customer: true,
        organization: true,
        items: true,
      },
    });

    revalidatePath("/");

    await auditCreate("Invoice", invoice.id, {
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      currency: invoice.currency,
      total: Number(invoice.total),
      status: invoice.status,
    }, organizationId);

    return actionSuccess(invoice);
  } catch (error) {
    return handleActionError(error, "createInvoice", { organizationId, data });
  }
}

export async function updateInvoice(
  invoiceId: string,
  data: InvoiceInput
): Promise<ActionResult<InvoiceWithRelations>> {
  try {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    assertExists(existingInvoice, "Invoice", invoiceId);

    // Only admins can update invoices
    await verifyAccess(existingInvoice.organizationId, "update");

    // Can only edit DRAFT invoices
    if (existingInvoice.status !== InvoiceStatus.DRAFT) {
      return actionError(ErrorCode.CANNOT_EDIT, "Only draft invoices can be edited");
    }

    const validated = invoiceSchema.parse(data);

    // Verify customer belongs to organization
    const customer = await prisma.customer.findFirst({
      where: {
        id: validated.customerId,
        organizationId: existingInvoice.organizationId,
      },
    });

    if (!customer) {
      return actionError(ErrorCode.NOT_FOUND, "Customer not found");
    }

    const { subtotal, discountAmount, taxAmount, total } = calculateTotals(
      validated.items,
      validated.taxRate,
      validated.discountType,
      validated.discountValue
    );

    // Recalculate exchange rate snapshot when invoice is updated
    const { exchangeRateToBase, totalInBaseCurrency } = await calculateExchangeRateSnapshot(
      existingInvoice.organizationId,
      validated.currency,
      total
    );

    // Delete existing items and create new ones
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId },
    });

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        customerId: validated.customerId,
        currency: validated.currency,
        issueDate: validated.issueDate,
        dueDate: validated.dueDate,
        discountType: validated.discountType || null,
        discountValue: validated.discountValue ? new Decimal(validated.discountValue) : null,
        discountAmount,
        taxRate: new Decimal(validated.taxRate),
        subtotal,
        taxAmount,
        total,
        exchangeRateToBase,
        totalInBaseCurrency,
        notes: validated.notes || null,
        items: {
          create: validated.items.map((item) => ({
            description: item.description,
            quantity: new Decimal(item.quantity),
            unitPrice: new Decimal(item.unitPrice),
            total: new Decimal((item.quantity * item.unitPrice).toFixed(2)),
          })),
        },
      },
      include: {
        customer: true,
        organization: true,
        items: true,
      },
    });

    revalidatePath("/");

    await auditUpdate("Invoice", invoice.id, {
      invoiceNumber: existingInvoice.invoiceNumber,
      customerId: existingInvoice.customerId,
      currency: existingInvoice.currency,
      total: Number(existingInvoice.total),
    }, {
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      currency: invoice.currency,
      total: Number(invoice.total),
    }, existingInvoice.organizationId);

    return actionSuccess(invoice);
  } catch (error) {
    return handleActionError(error, "updateInvoice", { invoiceId, data });
  }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
): Promise<ActionResult<InvoiceWithRelations>> {
  try {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    assertExists(existingInvoice, "Invoice", invoiceId);

    // Only admins can update invoice status
    await verifyAccess(existingInvoice.organizationId, "update");

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
      include: {
        customer: true,
        organization: true,
        items: true,
      },
    });

    revalidatePath("/");

    await auditStatusChange(
      "Invoice",
      invoice.id,
      existingInvoice.status,
      status,
      existingInvoice.organizationId
    );

    return actionSuccess(invoice);
  } catch (error) {
    return handleActionError(error, "updateInvoiceStatus", { invoiceId, status });
  }
}

export async function deleteInvoice(invoiceId: string): Promise<SimpleResult> {
  try {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    assertExists(existingInvoice, "Invoice", invoiceId);

    // Only admins can delete invoices
    await verifyAccess(existingInvoice.organizationId, "delete");

    // Can only delete DRAFT or CANCELLED invoices
    if (
      existingInvoice.status !== InvoiceStatus.DRAFT &&
      existingInvoice.status !== InvoiceStatus.CANCELLED
    ) {
      return simpleError(ErrorCode.CANNOT_DELETE, "Only draft or cancelled invoices can be deleted");
    }

    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    revalidatePath("/");

    await auditDelete("Invoice", invoiceId, {
      invoiceNumber: existingInvoice.invoiceNumber,
      customerId: existingInvoice.customerId,
      currency: existingInvoice.currency,
      total: Number(existingInvoice.total),
      status: existingInvoice.status,
    }, existingInvoice.organizationId);

    return simpleSuccess();
  } catch (error) {
    const result = handleActionError(error, "deleteInvoice", { invoiceId });
    return simpleError(result.error, result.message);
  }
}

export async function getInvoice(
  invoiceId: string
): Promise<InvoiceWithRelations | null> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        organization: true,
        items: true,
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!invoice) {
      return null;
    }

    // All members can read invoices
    await verifyAccess(invoice.organizationId, "read");

    return invoice;
  } catch {
    return null;
  }
}

/**
 * Mark SENT invoices with dueDate < today as OVERDUE for a specific organization.
 * Requires update permission to modify invoice statuses.
 */
export async function markOverdueInvoices(
  organizationId: string
): Promise<{ updated: number }> {
  // Verify user has update access to this organization
  await verifyAccess(organizationId, "update");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const overdueCandidates = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: InvoiceStatus.SENT,
      dueDate: { lt: startOfToday },
    },
    select: { id: true, organizationId: true, invoiceNumber: true, status: true },
  });

  let updated = 0;
  for (const inv of overdueCandidates) {
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { status: InvoiceStatus.OVERDUE },
    });
    await auditStatusChange(
      "Invoice",
      inv.id,
      inv.status,
      InvoiceStatus.OVERDUE,
      inv.organizationId
    );
    updated++;
  }

  if (updated > 0) {
    revalidatePath("/");
  }

  return { updated };
}

/**
 * Internal function to mark overdue invoices across all organizations.
 * For use in scheduled jobs/cron only - no user context required.
 * @internal
 */
export async function markOverdueInvoicesSystem(): Promise<{ updated: number }> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const overdueCandidates = await prisma.invoice.findMany({
    where: {
      status: InvoiceStatus.SENT,
      dueDate: { lt: startOfToday },
    },
    select: { id: true, organizationId: true, invoiceNumber: true, status: true },
  });

  let updated = 0;
  for (const inv of overdueCandidates) {
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { status: InvoiceStatus.OVERDUE },
    });
    await auditStatusChange(
      "Invoice",
      inv.id,
      inv.status,
      InvoiceStatus.OVERDUE,
      inv.organizationId
    );
    updated++;
  }

  return { updated };
}

export type InvoiceFilters = {
  dateRange?: { from: Date; to: Date };
  customerId?: string;
  status?: InvoiceStatus;
};

export async function getInvoices(
  organizationId: string,
  filters?: InvoiceFilters
): Promise<InvoiceWithCustomer[]> {
  try {
    // All members can read invoices
    await verifyAccess(organizationId, "read");

    const where: any = { organizationId };

    if (filters?.dateRange) {
      where.issueDate = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      };
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return invoices;
  } catch {
    return [];
  }
}

export type CurrencyTotal = Record<string, number>;

export type InvoiceStats = {
  totalCount: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
  overdueCount: number;
  revenueByCurrency: CurrencyTotal;
  outstandingByCurrency: CurrencyTotal;
  // New: Pre-calculated totals in base currency using historical rates
  revenueInBaseCurrency: number;
  outstandingInBaseCurrency: number;
  // Currencies that don't have historical rate stored
  missingHistoricalRates: string[];
};

export async function getInvoiceStats(
  organizationId: string,
  filters?: InvoiceFilters
): Promise<InvoiceStats | null> {
  try {
    // All members can view stats
    await verifyAccess(organizationId, "read");

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { baseCurrency: true },
    });

    if (!organization) {
      return null;
    }

    const baseCurrency = organization.baseCurrency;

    const baseWhere: any = { organizationId };
    if (filters?.dateRange) {
      baseWhere.issueDate = {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      };
    }
    if (filters?.customerId) {
      baseWhere.customerId = filters.customerId;
    }

    const paidWhere = {
      ...baseWhere,
      status: InvoiceStatus.PAID,
    };
    if (filters?.status) {
      paidWhere.status = filters.status;
    }

    const outstandingWhere = {
      ...baseWhere,
      status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] },
    };
    if (filters?.status) {
      outstandingWhere.status = filters.status;
    }

    const [totalCount, draftCount, sentCount, paidCount, overdueCount, paidInvoices, outstandingInvoices] =
      await Promise.all([
        prisma.invoice.count({ where: baseWhere }),
        prisma.invoice.count({
          where: { ...baseWhere, status: InvoiceStatus.DRAFT },
        }),
        prisma.invoice.count({
          where: { ...baseWhere, status: InvoiceStatus.SENT },
        }),
        prisma.invoice.count({
          where: { ...baseWhere, status: InvoiceStatus.PAID },
        }),
        prisma.invoice.count({
          where: { ...baseWhere, status: InvoiceStatus.OVERDUE },
        }),
        prisma.invoice.findMany({
          where: paidWhere,
          select: {
            currency: true,
            total: true,
            totalInBaseCurrency: true,
            exchangeRateToBase: true,
          },
        }),
        prisma.invoice.findMany({
          where: outstandingWhere,
          select: {
            currency: true,
            total: true,
            totalInBaseCurrency: true,
            exchangeRateToBase: true,
          },
        }),
      ]);

    // Group revenue by currency (for breakdown display)
    const revenueByCurrency: CurrencyTotal = {};
    let revenueInBaseCurrency = 0;
    const missingHistoricalRates: string[] = [];

    for (const invoice of paidInvoices) {
      const currency = invoice.currency;
      const amount = Number(invoice.total);
      revenueByCurrency[currency] = (revenueByCurrency[currency] ?? 0) + amount;

      // Use stored totalInBaseCurrency if available (historical rate)
      if (invoice.totalInBaseCurrency !== null) {
        revenueInBaseCurrency += Number(invoice.totalInBaseCurrency);
      } else if (currency === baseCurrency) {
        // Same currency, no conversion needed
        revenueInBaseCurrency += amount;
      } else {
        // No historical rate stored - mark as missing
        if (!missingHistoricalRates.includes(currency)) {
          missingHistoricalRates.push(currency);
        }
      }
    }

    // Group outstanding by currency (for breakdown display)
    const outstandingByCurrency: CurrencyTotal = {};
    let outstandingInBaseCurrency = 0;

    for (const invoice of outstandingInvoices) {
      const currency = invoice.currency;
      const amount = Number(invoice.total);
      outstandingByCurrency[currency] = (outstandingByCurrency[currency] ?? 0) + amount;

      // Use stored totalInBaseCurrency if available (historical rate)
      if (invoice.totalInBaseCurrency !== null) {
        outstandingInBaseCurrency += Number(invoice.totalInBaseCurrency);
      } else if (currency === baseCurrency) {
        // Same currency, no conversion needed
        outstandingInBaseCurrency += amount;
      } else {
        // No historical rate stored - mark as missing
        if (!missingHistoricalRates.includes(currency)) {
          missingHistoricalRates.push(currency);
        }
      }
    }

    return {
      totalCount,
      draftCount,
      sentCount,
      paidCount,
      overdueCount,
      revenueByCurrency,
      outstandingByCurrency,
      revenueInBaseCurrency,
      outstandingInBaseCurrency,
      missingHistoricalRates,
    };
  } catch {
    return null;
  }
}

/**
 * Monthly revenue data point
 */
export type MonthlyRevenueData = {
  month: string; // YYYY-MM format
  year: number;
  monthNumber: number;
  revenue: number; // Paid invoices total in base currency
  invoiceCount: number;
  outstanding: number; // Sent + Overdue total in base currency
};

/**
 * Period type for stats
 */
export type StatsPeriod = "monthly" | "yearly";

/**
 * Get monthly revenue breakdown for the last N months
 */
export async function getMonthlyRevenueStats(
  organizationId: string,
  months: number = 12,
  filters?: InvoiceFilters
): Promise<MonthlyRevenueData[]> {
  try {
    await verifyAccess(organizationId, "read");

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { baseCurrency: true },
    });

    if (!organization) {
      return [];
    }

    const baseCurrency = organization.baseCurrency;

    // Calculate date range (last N months) or use filter date range
    let startDate: Date;
    let endDate: Date;

    if (filters?.dateRange) {
      startDate = filters.dateRange.from;
      endDate = filters.dateRange.to;
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months + 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    const where: any = {
      organizationId,
      issueDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: [InvoiceStatus.PAID, InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
      },
    };

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    // Get all invoices in the date range
    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        status: true,
        issueDate: true,
        total: true,
        currency: true,
        totalInBaseCurrency: true,
      },
    });

    // Initialize all months in the range
    const monthlyData: Map<string, MonthlyRevenueData> = new Map();
    const current = new Date(startDate);

    while (current <= endDate) {
      const year = current.getFullYear();
      const monthNumber = current.getMonth() + 1;
      const monthKey = `${year}-${String(monthNumber).padStart(2, "0")}`;

      monthlyData.set(monthKey, {
        month: monthKey,
        year,
        monthNumber,
        revenue: 0,
        invoiceCount: 0,
        outstanding: 0,
      });

      current.setMonth(current.getMonth() + 1);
    }

    // Aggregate invoice data by month
    for (const invoice of invoices) {
      const invoiceDate = new Date(invoice.issueDate);
      const year = invoiceDate.getFullYear();
      const monthNumber = invoiceDate.getMonth() + 1;
      const monthKey = `${year}-${String(monthNumber).padStart(2, "0")}`;

      const monthData = monthlyData.get(monthKey);
      if (!monthData) continue;

      // Get amount in base currency
      let amountInBase: number;
      if (invoice.totalInBaseCurrency !== null) {
        amountInBase = Number(invoice.totalInBaseCurrency);
      } else if (invoice.currency === baseCurrency) {
        amountInBase = Number(invoice.total);
      } else {
        // No exchange rate - use original amount (not ideal but better than 0)
        amountInBase = Number(invoice.total);
      }

      if (invoice.status === InvoiceStatus.PAID) {
        monthData.revenue += amountInBase;
        monthData.invoiceCount += 1;
      } else {
        // SENT or OVERDUE
        monthData.outstanding += amountInBase;
      }
    }

    // Convert to array and sort by date
    return Array.from(monthlyData.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  } catch {
    return [];
  }
}

/**
 * Yearly revenue data point
 */
export type YearlyRevenueData = {
  year: number;
  revenue: number;
  invoiceCount: number;
  outstanding: number;
};

/**
 * Get yearly revenue breakdown for the last N years
 */
export async function getYearlyRevenueStats(
  organizationId: string,
  years: number = 5,
  filters?: InvoiceFilters
): Promise<YearlyRevenueData[]> {
  try {
    await verifyAccess(organizationId, "read");

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { baseCurrency: true },
    });

    if (!organization) {
      return [];
    }

    const baseCurrency = organization.baseCurrency;

    // Calculate date range or use filter date range
    let startDate: Date;
    let endDate: Date;

    if (filters?.dateRange) {
      startDate = filters.dateRange.from;
      endDate = filters.dateRange.to;
    } else {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years + 1;
      startDate = new Date(startYear, 0, 1);
      endDate = new Date();
    }

    const where: any = {
      organizationId,
      issueDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: [InvoiceStatus.PAID, InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
      },
    };

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    // Get all invoices in the date range
    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        status: true,
        issueDate: true,
        total: true,
        currency: true,
        totalInBaseCurrency: true,
      },
    });

    // Initialize all years in the range
    const yearlyData: Map<number, YearlyRevenueData> = new Map();
    for (let year = startYear; year <= currentYear; year++) {
      yearlyData.set(year, {
        year,
        revenue: 0,
        invoiceCount: 0,
        outstanding: 0,
      });
    }

    // Aggregate invoice data by year
    for (const invoice of invoices) {
      const invoiceDate = new Date(invoice.issueDate);
      const year = invoiceDate.getFullYear();

      const yearData = yearlyData.get(year);
      if (!yearData) continue;

      // Get amount in base currency
      let amountInBase: number;
      if (invoice.totalInBaseCurrency !== null) {
        amountInBase = Number(invoice.totalInBaseCurrency);
      } else if (invoice.currency === baseCurrency) {
        amountInBase = Number(invoice.total);
      } else {
        amountInBase = Number(invoice.total);
      }

      if (invoice.status === InvoiceStatus.PAID) {
        yearData.revenue += amountInBase;
        yearData.invoiceCount += 1;
      } else {
        yearData.outstanding += amountInBase;
      }
    }

    // Convert to array and sort by year
    return Array.from(yearlyData.values()).sort((a, b) => a.year - b.year);
  } catch {
    return [];
  }
}

/**
 * Send invoice via email with PDF attachment
 * Updates invoice status to SENT if currently DRAFT
 */
export async function sendInvoiceEmail(
  invoiceId: string,
  locale: string = "en"
): Promise<SimpleResult> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        organization: true,
        items: true,
      },
    });
    assertExists(invoice, "Invoice", invoiceId);

    // Only admins can send invoices via email
    await verifyAccess(invoice.organizationId, "update");

    // Check if customer has an email
    if (!invoice.customer.email) {
      return simpleError(
        ErrorCode.VALIDATION_ERROR,
        "Customer does not have an email address"
      );
    }

    // Generate PDF attachment
    const messages: Record<string, Parameters<typeof getInvoicePdfLabels>[0]> = {
      en: en as Parameters<typeof getInvoicePdfLabels>[0],
      tr: tr as Parameters<typeof getInvoicePdfLabels>[0],
    };
    const localeKey = locale === "tr" ? "tr" : "en";
    const msg = messages[localeKey] ?? messages.en;
    const labels = getInvoicePdfLabels(msg);
    const pdfBuffer = generateInvoicePdf(invoice, labels, localeKey);

    // Send email with PDF attachment
    const emailService = await getEmailService();
    await emailService.sendInvoice({
      locale: localeKey,
      recipientEmail: invoice.customer.email,
      recipientName: invoice.customer.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.total).toFixed(2),
      currency: invoice.currency,
      dueDate: new Date(invoice.dueDate),
      organizationName: invoice.organization.name,
      pdfAttachment: Buffer.from(pdfBuffer),
    });

    // Update status to SENT if currently DRAFT
    if (invoice.status === InvoiceStatus.DRAFT) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: InvoiceStatus.SENT },
      });

      await auditStatusChange(
        "Invoice",
        invoiceId,
        InvoiceStatus.DRAFT,
        InvoiceStatus.SENT,
        invoice.organizationId
      );

      revalidatePath("/");
    }

    logger.info(`Invoice ${invoice.invoiceNumber} sent to ${invoice.customer.email}`);

    return simpleSuccess();
  } catch (error) {
    const result = handleActionError(error, "sendInvoiceEmail", { invoiceId });
    return simpleError(result.error, result.message);
  }
}
