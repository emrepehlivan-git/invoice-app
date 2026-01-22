/**
 * Error Parsers
 *
 * Parse errors from Prisma, Zod, and other sources into standardized ActionError format.
 */

import { Prisma } from "@/prisma/generated/prisma";
import { ZodError } from "zod";
import { ErrorCode, type ActionError } from "./types";
import { AppError } from "./classes";

/**
 * Parse Prisma errors into ActionError format
 */
export function parsePrismaError(error: unknown): ActionError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      // Unique constraint violation
      case "P2002": {
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || "field";
        return {
          error: ErrorCode.UNIQUE_CONSTRAINT,
          message: `A record with this ${field} already exists`,
          metadata: { field, details: { prismaCode: error.code } },
        };
      }

      // Foreign key constraint violation
      case "P2003": {
        const field = error.meta?.field_name as string | undefined;
        return {
          error: ErrorCode.CONSTRAINT_VIOLATION,
          message: "Related record not found",
          metadata: { field, details: { prismaCode: error.code } },
        };
      }

      // Record not found (for update/delete operations)
      case "P2025":
        return {
          error: ErrorCode.NOT_FOUND,
          message: "Record not found",
          metadata: { details: { prismaCode: error.code } },
        };

      // Required relation violation
      case "P2014":
        return {
          error: ErrorCode.HAS_DEPENDENCIES,
          message: "Cannot delete record with existing dependencies",
          metadata: { details: { prismaCode: error.code } },
        };

      default:
        return {
          error: ErrorCode.DATABASE_ERROR,
          message: "Database operation failed",
          metadata: { details: { prismaCode: error.code } },
        };
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      error: ErrorCode.VALIDATION_ERROR,
      message: "Invalid data provided",
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      error: ErrorCode.DATABASE_ERROR,
      message: "Database connection failed",
    };
  }

  return {
    error: ErrorCode.DATABASE_ERROR,
    message: "An unexpected database error occurred",
  };
}

/**
 * Parse Zod validation errors into ActionError format
 */
export function parseZodError(error: ZodError): ActionError {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return {
    error: ErrorCode.VALIDATION_ERROR,
    message: "Validation failed",
    metadata: { details: fieldErrors },
  };
}

/**
 * Get field errors from a Zod error (for form integration)
 */
export function getZodFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    // Only keep the first error for each field
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }

  return fieldErrors;
}

/**
 * Parse any error into ActionError format
 */
export function parseError(error: unknown): ActionError {
  // Already an AppError
  if (error instanceof AppError) {
    return error.toJSON();
  }

  // Zod validation error
  if (error instanceof ZodError) {
    return parseZodError(error);
  }

  // Prisma errors
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError
  ) {
    return parsePrismaError(error);
  }

  // Standard Error
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message === "Unauthorized") {
      return { error: ErrorCode.UNAUTHORIZED };
    }

    return {
      error: ErrorCode.INTERNAL_ERROR,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred",
    };
  }

  // Unknown error
  return {
    error: ErrorCode.UNKNOWN_ERROR,
    message: "An unexpected error occurred",
  };
}

/**
 * Check if error is a Prisma error
 */
export function isPrismaError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  );
}

/**
 * Check if error is a unique constraint violation
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Get the field name from a unique constraint error
 */
export function getUniqueConstraintField(error: unknown): string | undefined {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target as string[] | undefined;
    return target?.[0];
  }
  return undefined;
}
