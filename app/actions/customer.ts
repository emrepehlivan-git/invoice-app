"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { z } from "zod";
import type { Customer } from "@/types";
import logger from "@/lib/logger";

const customerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  taxNumber: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

type CustomerInput = z.infer<typeof customerSchema>;

type CustomerResult =
  | { error: string; data?: never }
  | { data: Customer; error?: never };

type DeleteResult =
  | { error: string; success?: never }
  | { success: true; error?: never };

async function verifyOrganizationAccess(organizationId: string): Promise<boolean> {
  const session = await requireAuth();

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
  });

  return !!membership;
}

export async function createCustomer(
  organizationId: string,
  data: CustomerInput
): Promise<CustomerResult> {
  try {
    const hasAccess = await verifyOrganizationAccess(organizationId);
    if (!hasAccess) {
      return { error: "unauthorized" };
    }

    const validated = customerSchema.parse(data);

    // Check for duplicate email within organization
    if (validated.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          organizationId,
          email: validated.email,
        },
      });

      if (existingCustomer) {
        return { error: "email_exists" };
      }
    }

    const customer = await prisma.customer.create({
      data: {
        organizationId,
        name: validated.name,
        email: validated.email || null,
        phone: validated.phone || null,
        taxNumber: validated.taxNumber || null,
        address: validated.address || null,
        city: validated.city || null,
        country: validated.country || null,
        postalCode: validated.postalCode || null,
        notes: validated.notes || null,
      },
    });

    revalidatePath("/");

    return { data: customer };
  } catch (error) {
    logger.error("Failed to create customer", { error, data });
    throw error;
  }
}

export async function updateCustomer(
  customerId: string,
  data: CustomerInput
): Promise<CustomerResult> {
  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return { error: "not_found" };
    }

    const hasAccess = await verifyOrganizationAccess(existingCustomer.organizationId);
    if (!hasAccess) {
      return { error: "unauthorized" };
    }

    const validated = customerSchema.parse(data);

    // Check for duplicate email within organization (excluding current customer)
    if (validated.email) {
      const duplicateCustomer = await prisma.customer.findFirst({
        where: {
          organizationId: existingCustomer.organizationId,
          email: validated.email,
          NOT: { id: customerId },
        },
      });

      if (duplicateCustomer) {
        return { error: "email_exists" };
      }
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: validated.name,
        email: validated.email || null,
        phone: validated.phone || null,
        taxNumber: validated.taxNumber || null,
        address: validated.address || null,
        city: validated.city || null,
        country: validated.country || null,
        postalCode: validated.postalCode || null,
        notes: validated.notes || null,
      },
    });

    revalidatePath("/");

    return { data: customer };
  } catch (error) {
    logger.error("Failed to update customer", { error, customerId, data });
    throw error;
  }
}

export async function deleteCustomer(customerId: string): Promise<DeleteResult> {
  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return { error: "not_found" };
    }

    const hasAccess = await verifyOrganizationAccess(existingCustomer.organizationId);
    if (!hasAccess) {
      return { error: "unauthorized" };
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    logger.error("Failed to delete customer", { error, customerId });
    throw error;
  }
}

export async function getCustomer(customerId: string): Promise<Customer | null> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return null;
    }

    const hasAccess = await verifyOrganizationAccess(customer.organizationId);
    if (!hasAccess) {
      return null;
    }

    return customer;
  } catch (error) {
    logger.error("Failed to get customer", { error, customerId });
    throw error;
  }
}

export async function getCustomers(organizationId: string): Promise<Customer[]> {
  try {
    const hasAccess = await verifyOrganizationAccess(organizationId);
    if (!hasAccess) {
      return [];
    }

    const customers = await prisma.customer.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return customers;
  } catch (error) {
    logger.error("Failed to get customers", { error, organizationId });
    throw error;
  }
}

export async function searchCustomers(
  organizationId: string,
  query: string
): Promise<Customer[]> {
  try {
    const hasAccess = await verifyOrganizationAccess(organizationId);
    if (!hasAccess) {
      return [];
    }

    const customers = await prisma.customer.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { taxNumber: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
    });

    return customers;
  } catch (error) {
    logger.error("Failed to search customers", { error, organizationId, query });
    throw error;
  }
}
