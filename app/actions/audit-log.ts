"use server";

import { prisma } from "@/lib/db";
import { requireAdminAccess } from "@/lib/auth/rbac";
import type { AuditLog } from "@/types";
import { AuditAction } from "@/prisma/generated/prisma";
import type { ActionResult } from "@/lib/errors/types";
import { actionSuccess, handleActionError } from "@/lib/errors/handler";

export type AuditLogFilters = {
  action?: AuditAction;
  entityType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
};

export type AuditLogsResult = {
  logs: AuditLog[];
  totalCount: number;
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const EXPORT_MAX_ROWS = 5000;

export async function getAuditLogs(
  organizationId: string,
  filters?: AuditLogFilters,
  pagination?: { page?: number; pageSize?: number }
): Promise<ActionResult<AuditLogsResult>> {
  try {
    await requireAdminAccess(organizationId);

    const page = Math.max(1, pagination?.page ?? 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, pagination?.pageSize ?? DEFAULT_PAGE_SIZE)
    );
    const skip = (page - 1) * pageSize;

    const where: {
      organizationId: string;
      action?: AuditAction;
      entityType?: string;
      createdAt?: { gte?: Date; lte?: Date };
      OR?: Array<{ entityId?: { contains: string; mode: "insensitive" }; userId?: { contains: string; mode: "insensitive" } }>;
    } = { organizationId };

    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }
    if (filters?.search?.trim()) {
      const term = filters.search.trim();
      where.OR = [
        { entityId: { contains: term, mode: "insensitive" } },
        { userId: { contains: term, mode: "insensitive" } },
      ];
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return actionSuccess({ logs, totalCount });
  } catch (error) {
    return handleActionError(error, "getAuditLogs", { organizationId });
  }
}

export async function getAuditLogsForExport(
  organizationId: string,
  filters?: AuditLogFilters
): Promise<ActionResult<AuditLog[]>> {
  try {
    await requireAdminAccess(organizationId);

    const where: {
      organizationId: string;
      action?: AuditAction;
      entityType?: string;
      createdAt?: { gte?: Date; lte?: Date };
      OR?: Array<{ entityId?: { contains: string; mode: "insensitive" }; userId?: { contains: string; mode: "insensitive" } }>;
    } = { organizationId };

    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }
    if (filters?.search?.trim()) {
      const term = filters.search.trim();
      where.OR = [
        { entityId: { contains: term, mode: "insensitive" } },
        { userId: { contains: term, mode: "insensitive" } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: EXPORT_MAX_ROWS,
    });

    return actionSuccess(logs);
  } catch (error) {
    return handleActionError(error, "getAuditLogsForExport", { organizationId });
  }
}
