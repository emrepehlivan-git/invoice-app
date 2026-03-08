/**
 * Client-side logger for use in "use client" components.
 * In the browser it delegates to console; can be replaced with a reporting service later.
 */

const clientLogger = {
  error: (message: string, meta?: Record<string, unknown>) => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.error(`[invoice-app] ${message}`, meta ?? "");
    }
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn(`[invoice-app] ${message}`, meta ?? "");
    }
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.info(`[invoice-app] ${message}`, meta ?? "");
    }
  },
};

export default clientLogger;
