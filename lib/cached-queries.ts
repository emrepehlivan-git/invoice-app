import { cache } from "react";
import {
  getOrganizationBySlug as getOrganizationBySlugAction,
  getUserOrganizations as getUserOrganizationsAction,
} from "@/app/actions/organization";
import type { OrganizationWithRole } from "@/types";

export const getCachedOrganizationBySlug = cache(
  (slug: string): Promise<OrganizationWithRole | null> => {
    return getOrganizationBySlugAction(slug);
  }
);

export const getCachedUserOrganizations = cache(() => {
  return getUserOrganizationsAction();
});
