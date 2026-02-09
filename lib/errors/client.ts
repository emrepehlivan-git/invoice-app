/**
 * Client-side Error Handling Utilities
 *
 * Provides utilities for handling and displaying errors in client components.
 */

"use client";

import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { ActionError } from "./types";
import { getErrorMessage, getFieldErrorMessage, getAllFieldErrors } from "./messages";
import type { UseFormSetError, Path } from "react-hook-form";

/**
 * Handle action error and show appropriate toast message
 */
export function handleActionErrorToast(
  error: ActionError | null | undefined,
  t: ReturnType<typeof useTranslations>,
  defaultMessage?: string
): void {
  if (!error) {
    if (defaultMessage) {
      toast.error(defaultMessage);
    }
    return;
  }

  const message = getErrorMessage(error, (key, values) => {
    try {
      return t(key, values as Record<string, string | number | Date>);
    } catch {
      return getErrorMessage(error);
    }
  });

  toast.error(message);
}

/**
 * Set form field errors from action error
 */
export function setFormErrorsFromActionError<TFieldValues extends Record<string, unknown>>(
  error: ActionError | null | undefined,
  setError: UseFormSetError<TFieldValues>,
  t: ReturnType<typeof useTranslations>
): void {
  if (!error) return;

  const fieldErrors = getAllFieldErrors(error);

  for (const [field, message] of Object.entries(fieldErrors)) {
    const errorMessage = message || getFieldErrorMessage(field, error, (key, values) => {
      try {
        return t(key, values as Record<string, string | number | Date>);
      } catch {
        return message || "Validation error";
      }
    }) || "Validation error";
    
    try {
      setError(field as Path<TFieldValues>, {
        type: "manual",
        message: errorMessage,
      });
    } catch {
      // Field path might not exist in form, skip it
    }
  }
}

/**
 * Get user-friendly error message for display
 */
export function getErrorDisplayMessage(
  error: ActionError | null | undefined,
  t: ReturnType<typeof useTranslations>
): string {
  if (!error) {
    return t("common.error");
  }

  return getErrorMessage(error, (key, values) => {
    try {
      return t(key, values as Record<string, string | number | Date>);
    } catch {
      return getErrorMessage(error);
    }
  });
}
