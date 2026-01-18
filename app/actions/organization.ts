"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";
import type { Organization, OrganizationWithRole, OrganizationMemberWithOrg } from "@/types";
import { Role } from "@/types";
import { redirect } from "@/i18n/navigation";

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
});

type CreateOrganizationResult =
  | { error: string; data?: never }
  | { data: Organization; error?: never };

export async function createOrganization(
  data: { name: string; slug: string; locale: string }
): Promise<CreateOrganizationResult> {
  const session = await requireAuth();

  const validated = createOrgSchema.parse(data);

  const existingOrg = await prisma.organization.findUnique({
    where: { slug: validated.slug },
  });

  if (existingOrg) {
    return { error: "slug_exists" };
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

  redirect({
    href: `/${organization.slug}`,
    locale: data.locale,
  });
  
  throw new Error("Unreachable code");
}

export async function getUserOrganizations(): Promise<OrganizationWithRole[]> {
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
}

export async function getOrganizationBySlug(
  slug: string
): Promise<OrganizationWithRole | null> {
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
}
