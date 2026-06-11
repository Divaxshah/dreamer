"use client";

import { useEffect, useRef } from "react";
import { migrateLegacySession } from "@/lib/project";
import {
  getAppliedServerTimestamp,
  getOrCreateDeviceId,
  setAppliedServerTimestamp,
} from "@/lib/device-id";
import type { DashboardPersistPayload } from "@/lib/dashboard-session-store";
import type { Session } from "@/lib/types";
import { createWorkspaceSnapshot, syncProjectToWorkspace } from "@/lib/workspace";
import { useAppStore } from "@/lib/store";

const DEBOUNCE_MS = 2500;

const hydrateSession = (session: Session): Session => {
  const migrated = migrateLegacySession(session as Session & { currentCode?: unknown });
  return {
    ...migrated,
    workspace: syncProjectToWorkspace(
      migrated.workspace ?? createWorkspaceSnapshot(migrated.currentProject),
      migrated.currentProject
    ),
  };
};

/**
 * When Upstash Redis is configured, loads dashboard state from the server on mount
 * (if newer than last applied) and debounces saves back to Redis.
 */
export function useDashboardSessionSync(enabled = true) {
  const hydrateDone = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redisSyncDisabledRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      const deviceId = getOrCreateDeviceId();
      if (!deviceId) {
        hydrateDone.current = true;
        return;
      }

      try {
        const res = await fetch(
          `/api/dashboard-session?deviceId=${encodeURIComponent(deviceId)}`,
          { cache: "no-store" }
        );

        if (res.status === 503 || res.status === 502 || res.status === 404 || cancelled) {
          if (res.status === 503 || res.status === 502) {
            redisSyncDisabledRef.current = true;
          }
          hydrateDone.current = true;
          return;
        }

        if (!res.ok) {
          hydrateDone.current = true;
          return;
        }

        const data = (await res.json()) as {
          updatedAt: string;
          payload: DashboardPersistPayload;
        };

        const applied = getAppliedServerTimestamp();
        if (applied && data.updatedAt <= applied) {
          hydrateDone.current = true;
          return;
        }

        const payload = data.payload;
        const sessions = payload.sessions.map((s) => hydrateSession(s));

        useAppStore.setState({
          sessions,
          activeSessionId: payload.activeSessionId,
          lastPrompt: payload.lastPrompt,
        });
        setAppliedServerTimestamp(data.updatedAt);
      } catch {
        /* offline or missing Redis */
      } finally {
        hydrateDone.current = true;
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const push = () => {
      if (!hydrateDone.current || redisSyncDisabledRef.current) {
        return;
      }

      const deviceId = getOrCreateDeviceId();
      if (!deviceId) {
        return;
      }

      const state = useAppStore.getState();
      const payload: DashboardPersistPayload = {
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        lastPrompt: state.lastPrompt,
      };

      void (async () => {
        try {
          const res = await fetch("/api/dashboard-session", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId, payload }),
          });

          if (!res.ok) {
            if (res.status === 503 || res.status === 502) {
              redisSyncDisabledRef.current = true;
            }
            return;
          }

          const json = (await res.json()) as { updatedAt?: string };
          if (json.updatedAt) {
            setAppliedServerTimestamp(json.updatedAt);
          }
        } catch {
          /* offline */
        }
      })();
    };

    const unsubscribe = useAppStore.subscribe((state, prev) => {
      if (
        state.sessions === prev.sessions &&
        state.activeSessionId === prev.activeSessionId &&
        state.lastPrompt === prev.lastPrompt
      ) {
        return;
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(push, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled]);
}
