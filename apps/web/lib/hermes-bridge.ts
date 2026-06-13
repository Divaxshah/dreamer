import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GenerationStreamEvent } from "@/lib/generation-stream";
import { mergeProjectWithBootstrap } from "@/lib/download-bootstrap";
import {
  createPlaceholderProject,
  normalizeProject,
  resolveProjectEntry,
} from "@/lib/project";
import type { AgentActivity, GeneratedProject, ProjectFileMap } from "@/lib/types";
import { estimateTokenCount } from "@/lib/utils";

interface AgentInputMessage {
  role: "user" | "assistant";
  content: string;
  reasoning_details?: unknown;
}

interface RunHermesAgentLoopOptions {
  messages: AgentInputMessage[];
  currentProject: GeneratedProject | null;
  sessionWorkspace?: import("@/lib/types").WorkspaceSnapshot | null;
  model?: string;
  provider?: string;
  apiKey?: string;
  signal?: AbortSignal;
  onEvent: (event: GenerationStreamEvent) => void | Promise<void>;
}

const WORKSPACE_BASE = path.join(process.cwd(), ".webmaker", "workspaces");
const CONTAINER_AGENT_PATH = "/opt/hermes";
const CONTAINER_WORKSPACE_BASE = "/workspaces";
const CONTAINER_HERMES_HOME = "/hermes-home";
const MAX_SCAN_BYTES = 2_000_000;
const IGNORED_DIRS = new Set([".git", ".next", "node_modules", "dist", "build"]);

const IGNORED_SCAN_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lock",
]);

const shouldSkipScannedFile = (name: string): boolean => {
  if (IGNORED_SCAN_FILES.has(name)) return true;
  if (name.endsWith(".tsbuildinfo")) return true;
  if (name === "vite.config.d.ts") return true;
  return false;
};

interface HermesBridgeEvent {
  type?: unknown;
  tail?: unknown;
  tokenCount?: unknown;
  activity?: unknown;
  project?: unknown;
  summary?: unknown;
  message?: unknown;
  model?: unknown;
  provider?: unknown;
  hermesHome?: unknown;
}

interface HermesBridgeActivity {
  id?: unknown;
  kind?: unknown;
  status?: unknown;
  title?: unknown;
  detail?: unknown;
  tool?: unknown;
  targets?: unknown;
}

interface HermesRuntimeInfo {
  model: string;
  provider: string;
  hermesHome: string;
}

const resolveFromAppRoot = (value: string) =>
  path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);

const hermesPath = () =>
  resolveFromAppRoot(
    process.env.WEBMAKER_HERMES_PATH?.trim() || "../../agent"
  );
const hermesPython = () => {
  const configured = process.env.WEBMAKER_HERMES_PYTHON?.trim();
  if (configured) return resolveFromAppRoot(configured);
  return path.join(hermesPath(), ".venv", "bin", "python");
};
const hermesHome = () =>
  process.env.WEBMAKER_HERMES_HOME?.trim() ||
  (process.env.HOME ? path.join(process.env.HOME, ".hermes") : "");
const hermesRunner = () =>
  (process.env.WEBMAKER_HERMES_RUNNER?.trim().toLowerCase() || "podman");
const hermesImage = () =>
  process.env.WEBMAKER_HERMES_IMAGE?.trim() || "dreamer-hermes:local";

const apiKeyEnvForProvider = (provider: string, apiKey: string): Record<string, string> => {
  const key = apiKey.trim();
  if (!key) return {};

  const normalized = provider.trim().toLowerCase();
  if (normalized === "openrouter" || normalized === "nous") {
    return { OPENROUTER_API_KEY: key };
  }
  if (normalized === "openai" || normalized === "openai-api") {
    return { OPENAI_API_KEY: key };
  }
  if (normalized === "anthropic") {
    return { ANTHROPIC_API_KEY: key };
  }
  if (normalized === "gemini" || normalized === "google" || normalized === "google-gemini-cli") {
    return { GOOGLE_API_KEY: key, GEMINI_API_KEY: key };
  }
  if (normalized === "xai" || normalized === "xai-oauth") {
    return { XAI_API_KEY: key };
  }
  return { OPENROUTER_API_KEY: key };
};

const hermesEnv = (provider = "", apiKey = "") => {
  const home = hermesHome();
  const base = {
    ...process.env,
    ...apiKeyEnvForProvider(provider, apiKey),
  };
  return home
    ? {
        ...base,
        HERMES_HOME: home,
      }
    : base;
};

const workspaceContainerPath = (workspaceRoot: string) =>
  path.posix.join(CONTAINER_WORKSPACE_BASE, path.basename(workspaceRoot));

const ensureHermesMounts = async () => {
  await mkdir(WORKSPACE_BASE, { recursive: true });
  const home = hermesHome();
  if (home) {
    await mkdir(home, { recursive: true });
  }
};

const bridgeSpawn = async (
  args: string[],
  options: {
    provider?: string;
    apiKey?: string;
  } = {}
) => {
  if (hermesRunner() === "local") {
    return spawn(hermesPython(), ["-m", "webmaker_bridge", ...args], {
      cwd: hermesPath(),
      env: {
        ...hermesEnv(options.provider, options.apiKey),
        WEBMAKER_WORKSPACE_ROOT: WORKSPACE_BASE,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
  }

  await ensureHermesMounts();
  const env = hermesEnv(options.provider, options.apiKey);
  const podmanEnv: NodeJS.ProcessEnv = { ...process.env };
  const podmanArgs = [
    "run",
    "--rm",
    "-i",
    "--userns",
    "keep-id",
    "-v",
    `${hermesPath()}:${CONTAINER_AGENT_PATH}:ro`,
    "-v",
    `${WORKSPACE_BASE}:${CONTAINER_WORKSPACE_BASE}:rw`,
    "-w",
    CONTAINER_AGENT_PATH,
    "-e",
    `WEBMAKER_WORKSPACE_ROOT=${CONTAINER_WORKSPACE_BASE}`,
    "-e",
    "PYTHONDONTWRITEBYTECODE=1",
    "-e",
    "WEBMAKER_HERMES_INSIDE_CONTAINER=1",
  ];

  const home = hermesHome();
  if (home) {
    podmanArgs.push("-v", `${home}:${CONTAINER_HERMES_HOME}:rw`);
    podmanArgs.push("-e", `HERMES_HOME=${CONTAINER_HERMES_HOME}`);
  }

  for (const key of [
    "OPENROUTER_API_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GOOGLE_API_KEY",
    "GEMINI_API_KEY",
    "XAI_API_KEY",
    "WEBMAKER_HERMES_MODEL",
    "WEBMAKER_HERMES_PROVIDER",
    "HERMES_MODEL",
    "HERMES_PROVIDER",
    "WEBMAKER_PREVIEW_IMAGE",
    "WEBMAKER_DOCKER_IMAGE",
  ]) {
    const value = env[key];
    if (value) {
      podmanEnv[key] = value;
      podmanArgs.push("-e", key);
    }
  }

  podmanArgs.push(hermesImage(), "python", "-m", "webmaker_bridge", ...args);

  return spawn("podman", podmanArgs, {
    env: podmanEnv,
    stdio: ["pipe", "pipe", "pipe"],
  });
};

const logHermes = (message: string, detail?: unknown) => {
  if (detail === undefined) {
    console.log(`[webmaker:hermes] ${message}`);
    return;
  }
  console.log(`[webmaker:hermes] ${message}`, detail);
};

const truncateLogValue = (value: string, limit = 500) =>
  value.length > limit ? `${value.slice(0, limit)}...` : value;

const logHermesEvent = (event: HermesBridgeEvent) => {
  if (process.env.WEBMAKER_HERMES_DEBUG === "1") {
    logHermes("event", event);
    return;
  }

  if (event.type === "activity" && event.activity && typeof event.activity === "object") {
    const activity = event.activity as HermesBridgeActivity;
    const title = typeof activity.title === "string" ? activity.title : "Activity";
    const tool = typeof activity.tool === "string" ? activity.tool : "";
    const status = typeof activity.status === "string" ? activity.status : "";
    const detail = typeof activity.detail === "string" ? activity.detail : "";
    const targets = Array.isArray(activity.targets)
      ? activity.targets.filter((target): target is string => typeof target === "string")
      : [];

    if (tool === "hermes.reasoning") {
      logHermes(`reasoning ${status || "update"} (${detail.length} chars)`);
      return;
    }

    logHermes(
      `activity ${status || "update"}: ${title}${tool ? ` [${tool}]` : ""}`,
      targets.length > 0 ? { targets } : undefined
    );
    return;
  }

  if (event.type === "project") {
    logHermes("project snapshot updated");
    return;
  }

  if (event.type === "complete" || event.type === "aborted" || event.type === "error") {
    const summary =
      typeof event.summary === "string"
        ? event.summary
        : typeof event.message === "string"
          ? event.message
          : "";
    logHermes(`${event.type}`, summary ? truncateLogValue(summary, 240) : undefined);
  }
};

const toWorkspaceId = (options: RunHermesAgentLoopOptions) =>
  (options.sessionWorkspace?.id || `session-${Date.now()}`)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 120);

const assertInside = (base: string, target: string) => {
  const relative = path.relative(base, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to access path outside Webmaker workspace: ${target}`);
  }
};

const materializeProject = async (workspaceRoot: string, project: GeneratedProject) => {
  await mkdir(workspaceRoot, { recursive: true });

  const files = mergeProjectWithBootstrap(project);
  for (const [projectPath, file] of Object.entries(files)) {
    const relativePath = projectPath.replace(/^\/+/, "");
    const absolutePath = path.join(workspaceRoot, relativePath);
    assertInside(workspaceRoot, absolutePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, file.code, "utf8");
  }

  await writeFile(
    path.join(workspaceRoot, ".webmaker-project.json"),
    JSON.stringify(project, null, 2),
    "utf8"
  );
};

const scanFiles = async (
  workspaceRoot: string,
  dir = workspaceRoot,
  out: ProjectFileMap = {}
): Promise<ProjectFileMap> => {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".webmaker-project.json") continue;
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;

    const absolutePath = path.join(dir, entry.name);
    assertInside(workspaceRoot, absolutePath);

    if (entry.isDirectory()) {
      await scanFiles(workspaceRoot, absolutePath, out);
      continue;
    }

    if (!entry.isFile()) continue;
    if (shouldSkipScannedFile(entry.name)) continue;
    const statlessContent = await readFile(absolutePath);
    if (statlessContent.byteLength > MAX_SCAN_BYTES) continue;
    const projectPath = `/${path.relative(workspaceRoot, absolutePath).replace(/\\/g, "/")}`;
    out[projectPath] = { code: statlessContent.toString("utf8") };
  }

  return out;
};

const projectFromWorkspace = async (
  workspaceRoot: string,
  previous: GeneratedProject
): Promise<GeneratedProject> => {
  const files = await scanFiles(workspaceRoot);
  const activePath = resolveProjectEntry(files, previous.entry);

  if (files[activePath]) {
    files[activePath] = { ...files[activePath], active: true };
  }

  return normalizeProject({
    ...previous,
    files,
    entry: activePath,
  });
};

export const parseHermesBridgeLine = (line: string): HermesBridgeEvent | null => {
  if (!line.trim() || !line.trimStart().startsWith("{")) {
    return null;
  }

  try {
    return JSON.parse(line) as HermesBridgeEvent;
  } catch {
    return null;
  }
};

const normalizeHermesEvent = async (
  event: HermesBridgeEvent,
  currentProject: GeneratedProject,
  workspaceRoot: string
): Promise<GenerationStreamEvent | null> => {
  if (event.type === "delta" && typeof event.tail === "string") {
    return {
      type: "delta",
      tail: event.tail,
      tokenCount:
        typeof event.tokenCount === "number"
          ? event.tokenCount
          : estimateTokenCount(event.tail),
    };
  }

  if (event.type === "activity" && event.activity && typeof event.activity === "object") {
    return { type: "activity", activity: event.activity as AgentActivity };
  }

  if (event.type === "project") {
    return { type: "project", project: await projectFromWorkspace(workspaceRoot, currentProject) };
  }

  if (event.type === "complete" || event.type === "aborted") {
    const project = await projectFromWorkspace(workspaceRoot, currentProject);
    return {
      type: event.type,
      project,
      summary: typeof event.summary === "string" ? event.summary : "Hermes generation finished.",
      tokenCount:
        typeof event.tokenCount === "number"
          ? event.tokenCount
          : estimateTokenCount(typeof event.summary === "string" ? event.summary : ""),
    };
  }

  if (event.type === "error") {
    const project = await projectFromWorkspace(workspaceRoot, currentProject);
    return {
      type: "aborted",
      project,
      summary:
        typeof event.message === "string"
          ? event.message
          : "Hermes generation failed.",
      tokenCount:
        typeof event.message === "string" ? estimateTokenCount(event.message) : 0,
    };
  }

  return null;
};

export const getHermesBridgeConfig = () => ({
  python: hermesPython(),
  hermesPath: hermesPath(),
  hermesHome: hermesHome(),
});

export const readHermesRuntimeInfo = async (): Promise<HermesRuntimeInfo> => {
  logHermes("reading runtime info", {
    hermesPath: hermesPath(),
    python: hermesPython(),
    runner: hermesRunner(),
    image: hermesImage(),
    hermesHome: hermesHome() || "(Hermes default)",
  });

  const child = await bridgeSpawn(["--runtime-info"]);
  child.stdin?.end();

  let stdout = "";
  let stderr = "";

  await new Promise<void>((resolve, reject) => {
    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stdout += text;
      for (const line of text.split(/\r?\n/)) {
        if (line.trim()) logHermes(`runtime-info stdout: ${line}`);
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stderr += text;
      for (const line of text.split(/\r?\n/)) {
        if (line.trim()) logHermes(`runtime-info stderr: ${line}`);
      }
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Hermes runtime info exited with code ${code}.`));
        return;
      }
      resolve();
    });
  });

  for (const line of stdout.split(/\r?\n/)) {
    const parsed = parseHermesBridgeLine(line);
    if (parsed?.type === "runtime_info") {
      return {
        model:
          typeof parsed.model === "string" ? parsed.model : "Hermes configured default",
        provider:
          typeof parsed.provider === "string" ? parsed.provider : "Hermes configured default",
        hermesHome:
          typeof parsed.hermesHome === "string" ? parsed.hermesHome : hermesHome(),
      };
    }
  }

  return {
    model: "Hermes configured default",
    provider: "Hermes configured default",
    hermesHome: hermesHome(),
  };
};

export const runHermesAgentLoop = async (options: RunHermesAgentLoopOptions) => {
  const project = options.currentProject ?? createPlaceholderProject();
  const workspaceRoot = path.join(WORKSPACE_BASE, toWorkspaceId(options));
  const bridgePath = hermesPath();
  const python = hermesPython();
  const runtimeInfo = await readHermesRuntimeInfo();
  const requestedModel = options.model?.trim() || "";
  const requestedProvider = options.provider?.trim() || "";
  const hermesModel =
    process.env.WEBMAKER_HERMES_MODEL ||
    requestedModel ||
    process.env.HERMES_MODEL ||
    (runtimeInfo.model !== "Hermes configured default" ? runtimeInfo.model : "");
  const hermesProvider =
    process.env.WEBMAKER_HERMES_PROVIDER ||
    requestedProvider ||
    process.env.HERMES_PROVIDER ||
    (runtimeInfo.provider !== "Hermes configured default" ? runtimeInfo.provider : "");
  const effectiveModel = hermesModel || runtimeInfo.model;
  const effectiveProvider = hermesProvider || runtimeInfo.provider;

  await materializeProject(workspaceRoot, project);

  await options.onEvent({
    type: "activity",
    activity: {
      id: "hermes-backend",
      kind: "runtime",
      status: "completed",
      title: "Hermes backend",
      detail: `Using Hermes at ${bridgePath}. Model: ${effectiveModel}; provider: ${effectiveProvider}; home: ${runtimeInfo.hermesHome || "Hermes default"}.`,
      tool: "hermes.bridge",
    },
  });

  logHermes("starting generation", {
    hermesPath: bridgePath,
    python,
    runner: hermesRunner(),
    image: hermesImage(),
    workspaceRoot,
    model: effectiveModel,
    provider: effectiveProvider,
    hermesHome: runtimeInfo.hermesHome || "(Hermes default)",
  });

  const child = await bridgeSpawn([], {
    provider: hermesProvider,
    apiKey: options.apiKey,
  });

  const abort = () => {
    child.kill("SIGTERM");
  };
  options.signal?.addEventListener("abort", abort, { once: true });

  const request = {
    sessionId: options.sessionWorkspace?.id,
    workspaceRoot:
      hermesRunner() === "local" ? workspaceRoot : workspaceContainerPath(workspaceRoot),
    messages: options.messages,
    currentProject: project,
    model: hermesModel,
    provider: hermesProvider,
    runtimePolicy: { frontendOnly: true },
  };

  child.stdin.end(`${JSON.stringify(request)}\n`);

  let buffer = "";
  let stderr = "";
  let sawTerminalEvent = false;

  await new Promise<void>((resolve, reject) => {
    let stdoutProcessing = Promise.resolve();

    const processStdoutLines = async (lines: string[]) => {
      for (const line of lines) {
        if (!line.trim()) continue;
        const parsed = parseHermesBridgeLine(line);
        if (!parsed) {
          logHermes(`stdout: ${truncateLogValue(line)}`);
          stderr += `${line}\n`;
          continue;
        }
        logHermesEvent(parsed);
        const normalized = await normalizeHermesEvent(parsed, project, workspaceRoot);
        if (!normalized) continue;
        if (normalized.type === "complete" || normalized.type === "aborted") {
          sawTerminalEvent = true;
        }
        await options.onEvent(normalized);
      }
    };

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stderr += text;
      for (const line of text.split(/\r?\n/)) {
        if (line.trim()) logHermes(`stderr: ${line}`);
      }
    });

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      buffer += text;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      stdoutProcessing = stdoutProcessing
        .then(() => processStdoutLines(lines))
        .catch(reject);
    });

    child.on("error", reject);
    child.on("close", async (code) => {
      try {
        if (buffer.trim()) {
          const finalLine = buffer;
          buffer = "";
          stdoutProcessing = stdoutProcessing.then(() => processStdoutLines([finalLine]));
        }
        await stdoutProcessing;
        logHermes("generation process closed", { code });
        if (options.signal?.aborted) {
          const finalProject = await projectFromWorkspace(workspaceRoot, project);
          await options.onEvent({
            type: "aborted",
            project: finalProject,
            summary: "Hermes generation was aborted.",
            tokenCount: 0,
          });
          resolve();
          return;
        }

        if (code !== 0) {
          const finalProject = await projectFromWorkspace(workspaceRoot, project);
          await options.onEvent({
            type: "aborted",
            project: finalProject,
            summary: stderr.trim() || `Hermes bridge exited with code ${code}.`,
            tokenCount: estimateTokenCount(stderr),
          });
          resolve();
          return;
        }

        if (!sawTerminalEvent) {
          const finalProject = await projectFromWorkspace(workspaceRoot, project);
          await options.onEvent({
            type: "complete",
            project: finalProject,
            summary: "Hermes generation finished.",
            tokenCount: 0,
          });
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }).finally(() => {
    options.signal?.removeEventListener("abort", abort);
  });
};
