/**
 * Central place for environment expectations (used by /api/health and docs).
 * Server-only values — never import from client components.
 */

export interface WebmakerHealthChecks {
  /** Optional: durable preview IDs and dashboard sync across restarts. */
  upstashRedis: { ok: boolean; hint?: string };
  /** Required for Hermes-backed generation. */
  hermesBridge: {
    ok: boolean;
    hint?: string;
    path?: string;
    python?: string;
    model?: string;
    provider?: string;
    hermesHome?: string;
  };
  /** Required for Studio Podman preview (bind-mount workspaces). */
  dockerPreview: { ok: boolean; hint?: string };
  previewRouter: {
    ok: boolean;
    domain: string;
    protocol: string;
    ipcUrl: string;
    routerPort: string;
  };
}

export interface WebmakerHealthResult {
  status: "ok" | "degraded";
  checks: WebmakerHealthChecks;
  messages: string[];
}

const hint = {
  upstashRedis:
    "Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for shared preview links and dashboard sync across restarts.",
  hermesBridge:
    "Set WEBMAKER_HERMES_PATH and WEBMAKER_HERMES_PYTHON for Hermes-backed generation.",
  dockerPreview:
    "Install Podman and ensure `podman info` succeeds for Studio preview containers.",
};

export const getWebmakerHealth = async (): Promise<WebmakerHealthResult> => {
  const upstashOk =
    Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim()) &&
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim());

  const { getHermesBridgeConfig } = await import("@/lib/hermes-bridge");
  const bridgeConfig = getHermesBridgeConfig();
  const hermesPath = process.env.WEBMAKER_HERMES_PATH?.trim() || bridgeConfig.hermesPath;
  const hermesPython =
    process.env.WEBMAKER_HERMES_PYTHON?.trim() || bridgeConfig.python;
  const hermesOk = Boolean(hermesPath) && Boolean(hermesPython.trim());

  let runtimeInfo = {
    model: "Hermes configured default",
    provider: "Hermes configured default",
    hermesHome: "",
  };
  try {
    const { readHermesRuntimeInfo } = await import("@/lib/hermes-bridge");
    runtimeInfo = await readHermesRuntimeInfo();
  } catch {
    // Health still reports path/python even if runtime info probe fails.
  }

  let dockerOk = false;
  try {
    const { isDockerAvailable } = await import("@/lib/podman-preview");
    dockerOk = await isDockerAvailable();
  } catch {
    dockerOk = false;
  }

  const checks: WebmakerHealthChecks = {
    upstashRedis: upstashOk ? { ok: true } : { ok: false, hint: hint.upstashRedis },
    hermesBridge: hermesOk
      ? {
          ok: true,
          path: hermesPath,
          python: hermesPython,
          model: runtimeInfo.model,
          provider: runtimeInfo.provider,
          hermesHome: runtimeInfo.hermesHome ?? "",
        }
      : {
          ok: false,
          hint: hint.hermesBridge,
          path: hermesPath || undefined,
          python: hermesPython,
          model: runtimeInfo.model,
          provider: runtimeInfo.provider,
          hermesHome: runtimeInfo.hermesHome ?? "",
        },
    dockerPreview: dockerOk
      ? { ok: true }
      : { ok: false, hint: hint.dockerPreview },
    previewRouter: {
      ok: Boolean(process.env.WEBMAKER_PREVIEW_DOMAIN?.trim()),
      domain: process.env.WEBMAKER_PREVIEW_DOMAIN?.trim() || "preview.localhost",
      protocol: process.env.WEBMAKER_PREVIEW_PROTOCOL?.trim() || "http",
      ipcUrl: process.env.PREVIEW_ROUTER_IPC_URL?.trim() || "http://127.0.0.1:4998",
      routerPort: process.env.WEBMAKER_PREVIEW_ROUTER_PORT?.trim() || "4999",
    },
  };

  const messages: string[] = [];
  if (!upstashOk) messages.push(hint.upstashRedis);
  if (!hermesOk) messages.push(hint.hermesBridge);
  if (!dockerOk) messages.push(hint.dockerPreview);

  const criticalOk = hermesOk && dockerOk;
  return {
    status: criticalOk && upstashOk ? "ok" : criticalOk ? "degraded" : "degraded",
    checks,
    messages,
  };
};
