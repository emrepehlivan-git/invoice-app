"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";
import type { Organization, OrganizationWithRole, OrganizationMemberWithOrg } from "@/types";
import { Role } from "@/types";
import { redirect } from "@/i18n/navigation";
import {
  ErrorCode,
  type ActionResult,
  handleActionError,
  actionError,
  actionSuccess,
  assertAccess,
  isUniqueConstraintError,
  getUniqueConstraintField,
} from "@/lib/errors";

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

    redirect({
      href: "/onboarding",
      locale: data.locale,
    });

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
    const session = await requireAuth();

    // Verify user has access and is admin
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        role: Role.ADMIN,
      },
    });
    assertAccess(!!membership, "Admin access required");

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
