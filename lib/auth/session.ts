import { headers } from "next/headers";
import { auth } from "./index";
import logger from "@/lib/logger";

export async function getSession() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });
    return session;
  } catch (error) {
    logger.error("Failed to get session", { error });
    throw error;
  }
}

export async function requireAuth() {
  try {
    const session = await getSession();
    if (!session?.user) {
      logger.error("Unauthorized access attempt");
      throw new Error("Unauthorized");
    }
    return session;
  } catch (error) {
    logger.error("Auth requirement failed", { error });
    throw error;
  }
}
