import "server-only";

import type { Session } from "@/lib/types";
import { getRedis } from "@/lib/redis-client";

const KEY_PREFIX = "wm:dashboard:";
const TTL_SEC = 60 * 60 * 24 * 90; // 90 days

/** Matches Zustand persist partialize + merge shape for sessions. */
export interface DashboardPersistPayload {
  sessions: Session[];
  activeSessionId: string;
  lastPrompt: string;
}

export interface StoredDashboardSession {
  updatedAt: string;
  payload: DashboardPersistPayload;
}

export const loadDashboardSession = async (
  deviceId: string
): Promise<StoredDashboardSession | null> => {
  const r = getRedis();
  if (!r || !deviceId.trim()) {
    return null;
  }
  const raw = await r.get<string>(`${KEY_PREFIX}${deviceId.trim()}`);
  if (!raw) {
    return null;
  }
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as StoredDashboardSession).updatedAt !== "string" ||
      !(parsed as StoredDashboardSession).payload
    ) {
      return null;
    }
    return parsed as StoredDashboardSession;
  } catch {
    return null;
  }
};

export const saveDashboardSession = async (
  deviceId: string,
  payload: DashboardPersistPayload
): Promise<{ updatedAt: string }> => {
  const r = getRedis();
  if (!r || !deviceId.trim()) {
    throw new Error("Redis is not configured.");
  }
  const updatedAt = new Date().toISOString();
  const body: StoredDashboardSession = {
    updatedAt,
    payload,
  };
  await r.set(`${KEY_PREFIX}${deviceId.trim()}`, JSON.stringify(body), {
    ex: TTL_SEC,
  });
  return { updatedAt };
};
