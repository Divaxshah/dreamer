import { NextRequest, NextResponse } from "next/server";
import {
  loadDashboardSession,
  saveDashboardSession,
  type DashboardPersistPayload,
} from "@/lib/dashboard-session-store";
import { hasRedis } from "@/lib/redis-client";

export const runtime = "nodejs";

const isPayload = (value: unknown): value is DashboardPersistPayload => {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    Array.isArray(o.sessions) &&
    typeof o.activeSessionId === "string" &&
    typeof o.lastPrompt === "string"
  );
};

/** DNS / TLS / connection failures from Upstash REST (often nested under Error.cause). */
const looksLikeRedisUnreachable = (error: unknown): boolean => {
  let current: unknown = error;
  for (let depth = 0; depth < 8 && current; depth++) {
    if (current instanceof Error) {
      const msg = current.message;
      if (
        msg.includes("fetch failed") ||
        /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|getaddrinfo/i.test(msg)
      ) {
        return true;
      }
      current = (current as Error & { cause?: unknown }).cause;
    } else {
      break;
    }
  }
  return false;
};

export async function GET(request: NextRequest) {
  if (!hasRedis()) {
    return NextResponse.json(
      { error: "Dashboard sync requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN." },
      { status: 503 }
    );
  }

  const deviceId = request.nextUrl.searchParams.get("deviceId")?.trim() ?? "";
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId query parameter required" }, { status: 400 });
  }

  try {
    const stored = await loadDashboardSession(deviceId);
    if (!stored) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(stored);
  } catch (error) {
    if (looksLikeRedisUnreachable(error)) {
      return NextResponse.json(
        {
          error:
            "Could not reach Redis (check UPSTASH_REDIS_REST_URL or network). Dashboard sync is unavailable.",
          unavailable: true,
        },
        { status: 503 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load dashboard session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!hasRedis()) {
    return NextResponse.json(
      { error: "Dashboard sync requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      deviceId?: string;
      payload?: unknown;
    };

    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    if (!isPayload(body.payload)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await saveDashboardSession(deviceId, body.payload);
    return NextResponse.json(result);
  } catch (error) {
    if (looksLikeRedisUnreachable(error)) {
      return NextResponse.json(
        {
          error:
            "Could not reach Redis. Fix UPSTASH_* env or network; local-only mode until then.",
          unavailable: true,
        },
        { status: 503 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to save dashboard session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
