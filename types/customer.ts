import type { Customer, Organization } from "@/prisma/generated/prisma";

/**
 * Customer with organization relation included
 */
export type CustomerWithOrganization = Customer & {
  organization: Organization;
};
