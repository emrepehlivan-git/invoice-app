"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { verifyAccess, requireAdminAccess } from "@/lib/auth/rbac";
import { z } from "zod";
import type { Organization, OrganizationWithRole, OrganizationMemberWithOrg, OrganizationMember, User } from "@/types";
import { Role } from "@/types";
import {
  ErrorCode,
  type ActionResult,
  type SimpleResult,
  handleActionError,
  actionError,
  actionSuccess,
  simpleSuccess,
  simpleError,
  isUniqueConstraintError,
  getUniqueConstraintField,
} from "@/lib/errors";

export type OrganizationMemberWithUser = OrganizationMember & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
});

export async function createOrganization(
  data: { name: string; slug: string; locale: string }
): Promise<ActionResult<Organization>> {
  try {
    const session = await requireAuth();

    const validated = createOrgSchema.parse(data);

    const existingOrg = await prisma.organization.findUnique({
      where: { slug: validated.slug },
    });

    if (existingOrg) {
      return actionError(ErrorCode.SLUG_EXISTS);
    }

    const organization = await prisma.organization.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        members: {
          create: {
            userId: session.user.id,
            role: Role.ADMIN,
          },
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/onboarding");

    return actionSuccess(organization);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const field = getUniqueConstraintField(error);
      if (field === "slug") {
        return actionError(ErrorCode.SLUG_EXISTS);
      }
    }
    return handleActionError(error, "createOrganization", { name: data.name, slug: data.slug });
  }
}

export async function getUserOrganizations(): Promise<OrganizationWithRole[]> {
  try {
    const session = await requireAuth();

    const memberships = await prisma.organizationMember.findMany({
      where: { userId: session.user.id },
      include: {
        organization: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return memberships.map((m: OrganizationMemberWithOrg) => ({
      ...m.organization,
      role: m.role,
    }));
  } catch {
    return [];
  }
}

export async function getOrganizationBySlug(
  slug: string
): Promise<OrganizationWithRole | null> {
  try {
    const session = await requireAuth();

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organization: { slug },
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      return null;
    }

    return {
      ...membership.organization,
      role: membership.role,
    };
  } catch {
    return null;
  }
}

const updateOrgSchema = z.object({
  baseCurrency: z.string().length(3),
});

export async function updateOrganizationSettings(
  organizationId: string,
  data: { baseCurrency: string }
): Promise<ActionResult<Organization>> {
  try {
    // Only admins can update organization settings
    await requireAdminAccess(organizationId);

    const validated = updateOrgSchema.parse(data);

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        baseCurrency: validated.baseCurrency,
      },
    });

    revalidatePath("/");

    return actionSuccess(organization);
  } catch (error) {
    return handleActionError(error, "updateOrganizationSettings", { organizationId, data });
  }
}

/**
 * Get all members of an organization
 */
export async function getOrganizationMembers(
  organizationId: string
): Promise<OrganizationMemberWithUser[]> {
  try {
    // All members can view the member list
    await verifyAccess(organizationId, "read");

    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });

    return members;
  } catch {
    return [];
  }
}

/**
 * Remove a member from the organization
 * Only admins can remove members, and cannot remove themselves if they are the last admin
 */
export async function removeMember(
  memberId: string
): Promise<SimpleResult> {
  try {
    const memberToRemove = await prisma.organizationMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove) {
      return simpleError(ErrorCode.NOT_FOUND);
    }

    // Only admins can remove members
    const access = await requireAdminAccess(memberToRemove.organizationId);

    // Prevent removing yourself
    if (memberToRemove.userId === access.userId) {
      return simpleError(ErrorCode.CANNOT_DELETE, "Cannot remove yourself from the organization");
    }

    // Check if this is the last admin
    if (memberToRemove.role === Role.ADMIN) {
      const adminCount = await prisma.organizationMember.count({
        where: {
          organizationId: memberToRemove.organizationId,
          role: Role.ADMIN,
        },
      });

      if (adminCount <= 1) {
        return simpleError(ErrorCode.CANNOT_DELETE, "Cannot remove the last admin");
      }
    }

    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    revalidatePath("/");

    return simpleSuccess();
  } catch (error) {
    return handleActionError(error, "removeMember", { memberId }) as SimpleResult;
  }
}

/**
 * Update a member's role
 * Only admins can update roles, and cannot demote the last admin
 */
export async function updateMemberRole(
  memberId: string,
  newRole: Role
): Promise<ActionResult<OrganizationMember>> {
  try {
    const memberToUpdate = await prisma.organizationMember.findUnique({
      where: { id: memberId },
    });

    if (!memberToUpdate) {
      return actionError(ErrorCode.NOT_FOUND);
    }

    // Only admins can update member roles
    const access = await requireAdminAccess(memberToUpdate.organizationId);

    // Prevent demoting yourself
    if (memberToUpdate.userId === access.userId && newRole !== Role.ADMIN) {
      return actionError(ErrorCode.CANNOT_EDIT, "Cannot demote yourself");
    }

    // If demoting an admin, check if this is the last admin
    if (memberToUpdate.role === Role.ADMIN && newRole !== Role.ADMIN) {
      const adminCount = await prisma.organizationMember.count({
        where: {
          organizationId: memberToUpdate.organizationId,
          role: Role.ADMIN,
        },
      });

      if (adminCount <= 1) {
        return actionError(ErrorCode.CANNOT_EDIT, "Cannot demote the last admin");
      }
    }

    const updatedMember = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    revalidatePath("/");

    return actionSuccess(updatedMember);
  } catch (error) {
    return handleActionError(error, "updateMemberRole", { memberId, newRole });
  }
}
