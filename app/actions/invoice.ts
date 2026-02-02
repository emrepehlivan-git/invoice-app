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

export async function getInvoices(
  organizationId: string
): Promise<InvoiceWithCustomer[]> {
  try {
    // All members can read invoices
    await verifyAccess(organizationId, "read");

    const invoices = await prisma.invoice.findMany({
      where: { organizationId },
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

export async function getInvoiceStats(organizationId: string): Promise<InvoiceStats | null> {
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

    const [totalCount, draftCount, sentCount, paidCount, overdueCount, paidInvoices, outstandingInvoices] =
      await Promise.all([
        prisma.invoice.count({ where: { organizationId } }),
        prisma.invoice.count({
          where: { organizationId, status: InvoiceStatus.DRAFT },
        }),
        prisma.invoice.count({
          where: { organizationId, status: InvoiceStatus.SENT },
        }),
        prisma.invoice.count({
          where: { organizationId, status: InvoiceStatus.PAID },
        }),
        prisma.invoice.count({
          where: { organizationId, status: InvoiceStatus.OVERDUE },
        }),
        prisma.invoice.findMany({
          where: { organizationId, status: InvoiceStatus.PAID },
          select: {
            currency: true,
            total: true,
            totalInBaseCurrency: true,
            exchangeRateToBase: true,
          },
        }),
        prisma.invoice.findMany({
          where: {
            organizationId,
            status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] },
          },
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
