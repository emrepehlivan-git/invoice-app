"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { AuditAction, Prisma } from "@/prisma/generated/prisma";
import logger from "@/lib/logger";
import type { InputJsonValue } from "@/prisma/generated/prisma/runtime/library";

export type AuditEntityType =
  | "Invoice"
  | "Customer"
  | "ExchangeRate"
  | "Organization";

type AuditLogInput = {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  organizationId?: string;
  oldData?: InputJsonValue;
  newData?: InputJsonValue;
};

/**
 * Get client info from request headers
 */
async function getClientInfo(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? null;
    const userAgent = headersList.get("user-agent");
    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const session = await getSession();
    const { ipAddress, userAgent } = await getClientInfo();

    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: session?.user?.id ?? null,
        organizationId: input.organizationId ?? null,
        oldData: input.oldData ?? Prisma.JsonNull,
        newData: input.newData ?? Prisma.JsonNull,
        ipAddress,
        userAgent,
      },
    });

    logger.debug("Audit log created", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: session?.user?.id,
    });
  } catch (error) {
    // Don't throw - audit logging should not break the main operation
    logger.error("Failed to create audit log", { error, input });
  }
}

/**
 * Helper to create audit log for entity creation
 */
export async function auditCreate(
  entityType: AuditEntityType,
  entityId: string,
  newData: Record<string, unknown>,
  organizationId?: string
): Promise<void> {
  await createAuditLog({
    action: AuditAction.CREATE,
    entityType,
    entityId,
    organizationId,
    newData: sanitizeAuditData(newData),
  });
}

/**
 * Helper to create audit log for entity update
 */
export async function auditUpdate(
  entityType: AuditEntityType,
  entityId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  organizationId?: string
): Promise<void> {
  await createAuditLog({
    action: AuditAction.UPDATE,
    entityType,
    entityId,
    organizationId,
    oldData: sanitizeAuditData(oldData),
    newData: sanitizeAuditData(newData),
  });
}

/**
 * Helper to create audit log for entity deletion
 */
export async function auditDelete(
  entityType: AuditEntityType,
  entityId: string,
  oldData: Record<string, unknown>,
  organizationId?: string
): Promise<void> {
  await createAuditLog({
    action: AuditAction.DELETE,
    entityType,
    entityId,
    organizationId,
    oldData: sanitizeAuditData(oldData),
  });
}

/**
 * Helper to create audit log for status changes
 */
export async function auditStatusChange(
  entityType: AuditEntityType,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  organizationId?: string
): Promise<void> {
  await createAuditLog({
    action: AuditAction.STATUS_CHANGE,
    entityType,
    entityId,
    organizationId,
    oldData: { status: oldStatus },
    newData: { status: newStatus },
  });
}

/**
 * Sanitize data for audit logging - remove sensitive fields and convert types
 */
function sanitizeAuditData(
  data: Record<string, unknown>
): InputJsonValue {
  const sensitiveFields = ["password", "token", "secret", "accessToken", "refreshToken"];
  const sanitized: Record<string, string | number | boolean | InputJsonValue> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // Skip sensitive fields
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    // Convert Decimal to number for JSON serialization
    if (typeof value === "object" && "toNumber" in value) {
      sanitized[key] = Number(value);
    } else if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
    } else {
      // For complex objects, stringify and parse to ensure valid JSON
      sanitized[key] = JSON.parse(JSON.stringify(value)) as InputJsonValue;
    }
  }

  return sanitized;
}
