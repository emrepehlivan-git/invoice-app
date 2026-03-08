import { validateEnv } from "@/lib/env";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  validateEnv();

  const cron = await import("node-cron");
  const { markOverdueInvoicesSystem } = await import("@/app/actions/invoice");
  const logger = (await import("@/lib/logger")).default;

  cron.default.schedule("0 0 * * *", async () => {
    try {
      const { updated } = await markOverdueInvoicesSystem();
      if (updated > 0) {
        logger.info("Overdue invoices marked", { updated });
      }
    } catch (error) {
      logger.error("markOverdueInvoices cron failed", { error });
    }
  });

  logger.info("Overdue cron job registered (daily at 00:00)");
}
