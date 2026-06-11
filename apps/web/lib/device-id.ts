"use client";

const STORAGE_KEY = "webmaker-device-id";

/** Stable per-browser id for server-backed dashboard sync (no auth). */
export const getOrCreateDeviceId = (): string => {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length > 8) {
      return existing;
    }
    const id = `dev-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return "";
  }
};

export const APPLIED_SERVER_TS_KEY = "webmaker-dashboard-server-ts";

export const getAppliedServerTimestamp = (): string => {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(APPLIED_SERVER_TS_KEY) ?? "";
  } catch {
    return "";
  }
};

export const setAppliedServerTimestamp = (iso: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(APPLIED_SERVER_TS_KEY, iso);
  } catch {
    /* ignore */
  }
};
