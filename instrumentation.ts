export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const cron = await import("node-cron");
  const { markOverdueInvoices } = await import("@/app/actions/invoice");
  const logger = (await import("@/lib/logger")).default;

  cron.default.schedule("0 0 * * *", async () => {
    try {
      const { updated } = await markOverdueInvoices();
      if (updated > 0) {
        logger.info("Overdue invoices marked", { updated });
      }
    } catch (error) {
      logger.error("markOverdueInvoices cron failed", { error });
    }
  });

  logger.info("Overdue cron job registered (daily at 00:00)");
}
