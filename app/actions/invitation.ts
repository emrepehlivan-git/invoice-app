"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, getSession } from "@/lib/auth/session";
import { verifyAccess, requireAdminAccess } from "@/lib/auth/rbac";
import { z } from "zod";
import type { Invitation } from "@/types";
import type { InvitationWithRelations } from "@/types";
import { Role, InvitationStatus } from "@/types";
import {
  ErrorCode,
  type ActionResult,
  type SimpleResult,
  handleActionError,
  actionError,
  actionSuccess,
  simpleSuccess,
  simpleError,
} from "@/lib/errors";
import { getEmailService, getAppBaseUrl } from "@/lib/email";

const INVITATION_EXPIRY_DAYS = 7;

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role),
});

/**
 * Create a new invitation to an organization
 * Only admins can invite users
 */
export async function createInvitation(
  organizationId: string,
  data: { email: string; role: Role }
): Promise<ActionResult<Invitation>> {
  try {
    // Only admins can invite users
    const access = await requireAdminAccess(organizationId);

    const validated = createInvitationSchema.parse(data);

    // Check if user is already a member
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        user: { email: validated.email },
      },
    });

    if (existingMember) {
      return actionError(ErrorCode.INVITATION_ALREADY_MEMBER);
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        organizationId,
        email: validated.email,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      return actionError(ErrorCode.INVITATION_ALREADY_EXISTS);
    }

    // Create expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    // Get organization name and inviter info for the email
    const [organization, inviter] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      }),
      prisma.user.findUnique({
        where: { id: access.userId },
        select: { name: true, email: true },
      }),
    ]);

    const invitation = await prisma.invitation.create({
      data: {
        email: validated.email,
        role: validated.role,
        organizationId,
        invitedById: access.userId,
        expiresAt,
      },
    });

    // Send invitation email (non-blocking, don't fail if email fails)
    try {
      const emailService = await getEmailService();
      const baseUrl = getAppBaseUrl();
      const acceptUrl = `${baseUrl}/invite/${invitation.token}`;

      await emailService.sendInvitation({
        recipientEmail: validated.email,
        organizationName: organization?.name || "Organization",
        inviterName: inviter?.name || inviter?.email || "Admin",
        role: validated.role,
        acceptUrl,
        expiresAt,
        locale: "en", // TODO: Get from user preference or request
      });
    } catch (emailError) {
      // Log but don't fail the invitation creation
      console.error("[Invitation] Failed to send invitation email:", emailError);
    }

    revalidatePath("/");

    return actionSuccess(invitation);
  } catch (error) {
    return handleActionError(error, "createInvitation", { organizationId, email: data.email });
  }
}

/**
 * Get all invitations for an organization
 */
export async function getOrganizationInvitations(
  organizationId: string
): Promise<InvitationWithRelations[]> {
  try {
    // All members can view the invitation list
    await verifyAccess(organizationId, "read");

    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId,
        status: InvitationStatus.PENDING,
      },
      include: {
        organization: true,
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return invitations;
  } catch {
    return [];
  }
}

/**
 * Cancel a pending invitation
 * Only admins can cancel invitations
 */
export async function cancelInvitation(
  invitationId: string
): Promise<SimpleResult> {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return simpleError(ErrorCode.NOT_FOUND);
    }

    // Only admins can cancel invitations
    await requireAdminAccess(invitation.organizationId);

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.CANCELLED },
    });

    revalidatePath("/");

    return simpleSuccess();
  } catch (error) {
    return handleActionError(error, "cancelInvitation", { invitationId }) as SimpleResult;
  }
}

/**
 * Resend an invitation (creates a new token and extends expiry)
 * Only admins can resend invitations
 */
export async function resendInvitation(
  invitationId: string
): Promise<ActionResult<Invitation>> {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      return actionError(ErrorCode.NOT_FOUND);
    }

    // Only admins can resend invitations
    const access = await requireAdminAccess(invitation.organizationId);

    // Create new expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        expiresAt,
        updatedAt: new Date(),
      },
    });

    // Get organization name and resender info for the email
    const [organization, resender] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: invitation.organizationId },
        select: { name: true },
      }),
      prisma.user.findUnique({
        where: { id: access.userId },
        select: { name: true, email: true },
      }),
    ]);

    // Send invitation email (non-blocking)
    try {
      const emailService = await getEmailService();
      const baseUrl = getAppBaseUrl();
      const acceptUrl = `${baseUrl}/invite/${updatedInvitation.token}`;

      await emailService.sendInvitation({
        recipientEmail: invitation.email,
        organizationName: organization?.name || "Organization",
        inviterName: resender?.name || resender?.email || "Admin",
        role: invitation.role,
        acceptUrl,
        expiresAt,
        locale: "en", // TODO: Get from user preference or request
      });
    } catch (emailError) {
      // Log but don't fail the resend operation
      console.error("[Invitation] Failed to resend invitation email:", emailError);
    }

    revalidatePath("/");

    return actionSuccess(updatedInvitation);
  } catch (error) {
    return handleActionError(error, "resendInvitation", { invitationId });
  }
}

/**
 * Get invitation by token (for accepting invitations)
 * This is a public endpoint - no auth required
 */
export async function getInvitationByToken(
  token: string
): Promise<ActionResult<InvitationWithRelations>> {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: true,
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return actionError(ErrorCode.INVITATION_INVALID);
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return actionError(ErrorCode.INVITATION_INVALID);
    }

    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      return actionError(ErrorCode.INVITATION_EXPIRED);
    }

    return actionSuccess(invitation);
  } catch (error) {
    return handleActionError(error, "getInvitationByToken");
  }
}

/**
 * Accept an invitation
 * User must be logged in
 */
export async function acceptInvitation(
  token: string
): Promise<ActionResult<{ organizationSlug: string }>> {
  try {
    const session = await requireAuth();

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invitation) {
      return actionError(ErrorCode.INVITATION_INVALID);
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return actionError(ErrorCode.INVITATION_INVALID);
    }

    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      return actionError(ErrorCode.INVITATION_EXPIRED);
    }

    // Verify the invitation email matches the logged in user
    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return actionError(ErrorCode.FORBIDDEN);
    }

    // Check if already a member
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
      },
    });

    if (existingMember) {
      // Mark invitation as accepted and return org slug
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      });
      return actionSuccess({ organizationSlug: invitation.organization.slug });
    }

    // Create membership and update invitation in a transaction
    await prisma.$transaction([
      prisma.organizationMember.create({
        data: {
          userId: session.user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      }),
    ]);

    revalidatePath("/");

    return actionSuccess({ organizationSlug: invitation.organization.slug });
  } catch (error) {
    return handleActionError(error, "acceptInvitation");
  }
}

/**
 * Get pending invitations for the current user's email
 * Shows invitations even if not logged in as that email user
 */
export async function getUserPendingInvitations(): Promise<InvitationWithRelations[]> {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return [];
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        email: session.user.email,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        organization: true,
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return invitations;
  } catch {
    return [];
  }
}
