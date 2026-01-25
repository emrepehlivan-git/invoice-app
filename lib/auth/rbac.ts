/**
 * Role-Based Access Control (RBAC) utilities
 *
 * Permission Matrix:
 * - Admin: Full access to all organization resources
 * - Member: Read access + Create access (customers, invoices)
 *           No update/delete access to resources
 */

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { Role } from "@/types";

export type Permission = "read" | "create" | "update" | "delete";

export type OrganizationAccess = {
  hasAccess: boolean;
  role: Role | null;
  userId: string;
};

/**
 * Check if a user has access to an organization and get their role
 */
export async function getOrganizationAccess(
  organizationId: string
): Promise<OrganizationAccess> {
  const session = await requireAuth();

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
  });

  return {
    hasAccess: !!membership,
    role: membership?.role ?? null,
    userId: session.user.id,
  };
}

/**
 * Check if a role has a specific permission
 * Permission rules:
 * - Admin: All permissions
 * - Member: read, create only
 */
export function hasPermission(role: Role | null, permission: Permission): boolean {
  if (!role) return false;

  if (role === Role.ADMIN) {
    return true;
  }

  // Members can read and create
  if (role === Role.MEMBER) {
    return permission === "read" || permission === "create";
  }

  return false;
}

/**
 * Verify organization access with optional permission check
 * Returns the access info if successful, throws if unauthorized
 */
export async function verifyAccess(
  organizationId: string,
  requiredPermission?: Permission
): Promise<OrganizationAccess> {
  const access = await getOrganizationAccess(organizationId);

  if (!access.hasAccess) {
    throw new Error("Access denied: Not a member of this organization");
  }

  if (requiredPermission && !hasPermission(access.role, requiredPermission)) {
    throw new Error(`Access denied: Insufficient permissions (requires ${requiredPermission})`);
  }

  return access;
}

/**
 * Check if user has admin access to an organization
 */
export async function requireAdminAccess(organizationId: string): Promise<OrganizationAccess> {
  const access = await getOrganizationAccess(organizationId);

  if (!access.hasAccess || access.role !== Role.ADMIN) {
    throw new Error("Access denied: Admin access required");
  }

  return access;
}
