"use server";

import { prisma } from "@/lib/db";
import { InvoiceStatus } from "@/types";
import logger from "@/lib/logger";
import { getEmailService } from "@/lib/email/service";
import { markOverdueInvoicesSystem } from "@/app/actions/invoice";

const OVERDUE_REMINDER_INTERVAL_DAYS = 7;
const DUE_SOON_DAYS = 3;

export type InvoiceReminderResult = {
  overdueSent: number;
  dueSoonSent: number;
  errors: string[];
};

function getStartOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export async function runInvoiceReminders(): Promise<InvoiceReminderResult> {
  await markOverdueInvoicesSystem();

  const result: InvoiceReminderResult = {
    overdueSent: 0,
    dueSoonSent: 0,
    errors: [],
  };

  const now = new Date();
  const startOfToday = getStartOfDay(now);
  const overdueCutoff = new Date(startOfToday);
  overdueCutoff.setDate(overdueCutoff.getDate() - OVERDUE_REMINDER_INTERVAL_DAYS);
  const dueSoonEnd = new Date(startOfToday);
  dueSoonEnd.setDate(dueSoonEnd.getDate() + DUE_SOON_DAYS);

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: InvoiceStatus.OVERDUE,
      dueDate: { lt: startOfToday },
      customer: { email: { not: null } },
      OR: [
        { lastReminderSentAt: null },
        { lastReminderSentAt: { lt: overdueCutoff } },
      ],
    },
    include: {
      customer: true,
      organization: true,
    },
  });

  const dueSoonInvoices = await prisma.invoice.findMany({
    where: {
      status: InvoiceStatus.SENT,
      dueDate: { gte: startOfToday, lte: dueSoonEnd },
      lastReminderSentAt: null,
      customer: { email: { not: null } },
    },
    include: {
      customer: true,
      organization: true,
    },
  });

  const emailService = await getEmailService();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (const invoice of overdueInvoices) {
    const email = invoice.customer.email;
    if (!email) continue;
    try {
      const locale = "en";
      await emailService.sendInvoiceReminder({
        locale,
        recipientEmail: email,
        recipientName: invoice.customer.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.total).toFixed(2),
        currency: invoice.currency,
        dueDate: new Date(invoice.dueDate),
        organizationName: invoice.organization.name,
        reminderType: "overdue",
        viewUrl: `${baseUrl}/en/${invoice.organization.slug}/invoices/${invoice.id}`,
      });
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { lastReminderSentAt: now },
      });
      result.overdueSent++;
    } catch (error) {
      const msg = `Overdue reminder failed for invoice ${invoice.invoiceNumber}: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(msg);
      result.errors.push(msg);
    }
  }

  for (const invoice of dueSoonInvoices) {
    const email = invoice.customer.email;
    if (!email) continue;
    try {
      const locale = "en";
      await emailService.sendInvoiceReminder({
        locale,
        recipientEmail: email,
        recipientName: invoice.customer.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.total).toFixed(2),
        currency: invoice.currency,
        dueDate: new Date(invoice.dueDate),
        organizationName: invoice.organization.name,
        reminderType: "due_soon",
        viewUrl: `${baseUrl}/en/${invoice.organization.slug}/invoices/${invoice.id}`,
      });
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { lastReminderSentAt: now },
      });
      result.dueSoonSent++;
    } catch (error) {
      const msg = `Due-soon reminder failed for invoice ${invoice.invoiceNumber}: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(msg);
      result.errors.push(msg);
    }
  }

  if (result.overdueSent > 0 || result.dueSoonSent > 0) {
    logger.info(
      `Invoice reminders sent: overdue=${result.overdueSent}, dueSoon=${result.dueSoonSent}`
    );
  }

  return result;
}
