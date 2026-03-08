import { NextRequest, NextResponse } from "next/server";
import { runInvoiceReminders } from "@/app/actions/invoice-reminder";
import { getClientIp, rateLimitCron } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  return authHeader.slice(7) === secret;
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, reset } = await rateLimitCron.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(reset) } }
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runInvoiceReminders();
    return NextResponse.json({
      ok: true,
      overdueSent: result.overdueSent,
      dueSoonSent: result.dueSoonSent,
      errors: result.errors,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
