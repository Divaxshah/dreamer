import { NextResponse } from "next/server";
import { getWebmakerHealth } from "@/lib/env-config";

export const runtime = "nodejs";

/**
 * Operator endpoint: verify env and optional integrations after deploy.
 * GET /api/health — no secrets returned.
 */
export async function GET() {
  const health = await getWebmakerHealth();
  const statusCode = health.checks.hermesBridge.ok ? 200 : 503;
  return NextResponse.json(
    {
      service: "webmaker",
      status: health.status,
      checks: health.checks,
      messages: health.messages,
    },
    { status: statusCode }
  );
}
