const getPreviewRouterIpcUrl = (): string =>
  process.env.PREVIEW_ROUTER_IPC_URL?.trim() || "http://127.0.0.1:4998";

const warnedPaths = new Set<string>();

async function postJson(path: string, body: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${getPreviewRouterIpcUrl()}${path}`, {
      method: path === "/unregister" ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2_500),
    });
  } catch (error) {
    if (warnedPaths.has(path)) return;
    warnedPaths.add(path);
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[preview-port-registry] Failed to notify ${path}: ${message}`);
  }
}

export async function registerPreviewPort(
  workspaceId: string,
  port: number
): Promise<void> {
  await postJson("/register", { workspaceId, port });
}

export async function unregisterPreviewPort(workspaceId: string): Promise<void> {
  await postJson("/unregister", { workspaceId });
}
