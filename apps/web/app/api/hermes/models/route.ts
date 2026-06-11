import { spawn } from "node:child_process";
import { NextRequest, NextResponse } from "next/server";
import { getHermesBridgeConfig } from "@/lib/hermes-bridge";

export const runtime = "nodejs";

interface ModelsRequestBody {
  provider?: string;
  apiKey?: string;
}

const PROVIDER_API_KEY_ENV: Record<string, string[]> = {
  openrouter: ["OPENROUTER_API_KEY"],
  nous: ["OPENROUTER_API_KEY"],
  openai: ["OPENAI_API_KEY"],
  "openai-api": ["OPENAI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEY"],
  gemini: ["GOOGLE_API_KEY", "GEMINI_API_KEY"],
  google: ["GOOGLE_API_KEY", "GEMINI_API_KEY"],
  "google-gemini-cli": ["GOOGLE_API_KEY", "GEMINI_API_KEY"],
  xai: ["XAI_API_KEY"],
  "xai-oauth": ["XAI_API_KEY"],
};

const modelListScript = `
import json
import sys

provider = sys.argv[1] if len(sys.argv) > 1 else "openrouter"
try:
    from hermes_cli.models import normalize_provider, provider_model_ids
    normalized = normalize_provider(provider)
    models = provider_model_ids(normalized, force_refresh=True)
    print(json.dumps({"provider": normalized, "models": models}))
except Exception as exc:
    print(json.dumps({"error": str(exc), "provider": provider, "models": []}))
    sys.exit(1)
`;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ModelsRequestBody;
  const provider = body.provider?.trim() || "openrouter";
  const normalized = provider.toLowerCase();
  const apiKey = body.apiKey?.trim() || "";
  const config = getHermesBridgeConfig();

  const env = { ...process.env };
  if (apiKey) {
    for (const key of PROVIDER_API_KEY_ENV[normalized] ?? ["OPENROUTER_API_KEY"]) {
      env[key] = apiKey;
    }
  }
  if (config.hermesHome) {
    env.HERMES_HOME = config.hermesHome;
  }

  const child = spawn(config.python, ["-c", modelListScript, provider], {
    cwd: config.hermesPath,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";

  const result = await new Promise<{ code: number | null }>((resolve, reject) => {
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code }));
  });

  const lastJsonLine = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{"))
    .pop();

  if (!lastJsonLine) {
    return NextResponse.json(
      { error: stderr.trim() || "Hermes did not return a model list.", models: [] },
      { status: 500 }
    );
  }

  const payload = JSON.parse(lastJsonLine) as {
    provider?: string;
    models?: unknown;
    error?: string;
  };

  if (result.code !== 0 || payload.error) {
    return NextResponse.json(
      {
        error: payload.error || stderr.trim() || "Failed to fetch Hermes models.",
        provider: payload.provider || provider,
        models: [],
      },
      { status: 500 }
    );
  }

  const models = Array.isArray(payload.models)
    ? payload.models.filter((model): model is string => typeof model === "string")
    : [];

  return NextResponse.json({
    provider: payload.provider || provider,
    models,
  });
}
