import type { Invitation, Organization, User } from "./prisma";

/**
 * Invitation with organization relation
 */
export type InvitationWithOrganization = Invitation & {
  organization: Organization;
};

/**
 * Invitation with all relations (for detailed views)
 */
export type InvitationWithRelations = Invitation & {
  organization: Organization;
  invitedBy: Pick<User, "id" | "name" | "email">;
};
