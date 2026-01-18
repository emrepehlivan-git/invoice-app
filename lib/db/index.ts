import { PrismaClient } from "@/prisma/generated/prisma";
import logger from "@/lib/logger";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

prisma.$on("query" as never, (e: { query: string; params: string; duration: number; target: string }) => {
  if (e.duration > 1000) {
    logger.warn("Slow database query detected", { query: e.query, duration: e.duration });
  }
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
