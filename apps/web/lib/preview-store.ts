/**
 * Server-side preview store.
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL is set (e.g. on Vercel);
 * otherwise falls back to /tmp for local dev.
 */

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getRedis } from "@/lib/redis-client";

const STORE_DIR = join(tmpdir(), "wm-previews");
const PREVIEW_TTL_SEC = 86400; // 24 hours

async function ensureDir() {
  await mkdir(STORE_DIR, { recursive: true });
}

function previewKey(id: string): string {
  return `preview:${id}`;
}

/** Unique preview ID: base36 timestamp + short UUID segment */
export function generatePreviewId(): string {
  const ts = Date.now().toString(36);
  const uid = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `${ts}-${uid}`;
}

export async function storePreview(id: string, data: unknown): Promise<void> {
  const r = getRedis();
  if (r) {
    try {
      await r.set(previewKey(id), data as object, { ex: PREVIEW_TTL_SEC });
      return;
    } catch (e) {
      console.warn("[preview-store] Redis set failed, using filesystem", e);
    }
  }
  await ensureDir();
  await writeFile(join(STORE_DIR, `${id}.json`), JSON.stringify(data), "utf8");
}

export async function retrievePreview(id: string): Promise<unknown | null> {
  try {
    if (!id || typeof id !== "string") return null;
    const r = getRedis();
    if (r) {
      try {
        const raw = await r.get(previewKey(id));
        if (raw != null) return raw;
      } catch (e) {
        console.warn("[preview-store] Redis get failed, trying filesystem", e);
      }
    }
    const raw = await readFile(join(STORE_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
