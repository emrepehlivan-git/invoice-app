"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { z } from "zod";
import type { Customer } from "@/types";
import { auditCreate, auditUpdate, auditDelete } from "@/lib/audit";
import { verifyAccess } from "@/lib/auth/rbac";
import {
  ErrorCode,
  type ActionResult,
  type SimpleResult,
  handleActionError,
  actionError,
  actionSuccess,
  simpleSuccess,
  simpleError,
  assertExists,
  isUniqueConstraintError,
  getUniqueConstraintField,
} from "@/lib/errors";

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

export async function createCustomer(
  organizationId: string,
  data: CustomerInput
): Promise<ActionResult<Customer>> {
  try {
    // Members can create customers
    await verifyAccess(organizationId, "create");

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
        return actionError(ErrorCode.EMAIL_EXISTS);
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

    await auditCreate("Customer", customer.id, {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
    }, organizationId);

    return actionSuccess(customer);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const field = getUniqueConstraintField(error);
      if (field === "email") {
        return actionError(ErrorCode.EMAIL_EXISTS);
      }
    }
    return handleActionError(error, "createCustomer", { organizationId, data });
  }
}

export async function updateCustomer(
  customerId: string,
  data: CustomerInput
): Promise<ActionResult<Customer>> {
  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    assertExists(existingCustomer, "Customer", customerId);

    // Only admins can update customers
    await verifyAccess(existingCustomer.organizationId, "update");

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
        return actionError(ErrorCode.EMAIL_EXISTS);
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

    await auditUpdate("Customer", customer.id, {
      name: existingCustomer.name,
      email: existingCustomer.email,
      phone: existingCustomer.phone,
      city: existingCustomer.city,
    }, {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
    }, existingCustomer.organizationId);

    return actionSuccess(customer);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const field = getUniqueConstraintField(error);
      if (field === "email") {
        return actionError(ErrorCode.EMAIL_EXISTS);
      }
    }
    return handleActionError(error, "updateCustomer", { customerId, data });
  }
}

export async function deleteCustomer(customerId: string): Promise<SimpleResult> {
  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    assertExists(existingCustomer, "Customer", customerId);

    // Only admins can delete customers
    await verifyAccess(existingCustomer.organizationId, "delete");

    await prisma.customer.delete({
      where: { id: customerId },
    });

    revalidatePath("/");

    await auditDelete("Customer", customerId, {
      name: existingCustomer.name,
      email: existingCustomer.email,
      phone: existingCustomer.phone,
      city: existingCustomer.city,
    }, existingCustomer.organizationId);

    return simpleSuccess();
  } catch (error) {
    const result = handleActionError(error, "deleteCustomer", { customerId });
    return simpleError(result.error, result.message);
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

    // All members can read customers
    await verifyAccess(customer.organizationId, "read");

    return customer;
  } catch {
    return null;
  }
}

export async function getCustomers(organizationId: string): Promise<Customer[]> {
  try {
    // All members can read customers
    await verifyAccess(organizationId, "read");

    const customers = await prisma.customer.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    return customers;
  } catch {
    return [];
  }
}

export async function searchCustomers(
  organizationId: string,
  query: string
): Promise<Customer[]> {
  try {
    // All members can read/search customers
    await verifyAccess(organizationId, "read");

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
  } catch {
    return [];
  }
}
