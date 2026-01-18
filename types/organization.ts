import type { Prisma } from "@/prisma/generated/prisma";
import type { Organization, Role } from "./prisma";

/**
 * Organization with user's role
 * Used when returning organization data with membership info
 */
export type OrganizationWithRole = Organization & {
  role: Role;
};

/**
 * OrganizationMember with included Organization relation
 * Used for queries with { include: { organization: true } }
 */
export type OrganizationMemberWithOrg = Prisma.OrganizationMemberGetPayload<{
  include: { organization: true };
}>;
