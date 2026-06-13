import { exec, execSync, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { mergeProjectWithBootstrap } from "@/lib/download-bootstrap";
import { registerPreviewPort, unregisterPreviewPort } from "@/lib/preview-port-registry";
import { normalizeProjectPath } from "@/lib/project";
import type { GeneratedProject } from "@/lib/types";

const execAsync = promisify(exec);

const PREVIEW_PORT = 5173;
const DEV_SERVER_TIMEOUT_MS = 180_000;
const IDLE_TTL_MS = 30 * 60 * 1000;
const MAX_CONCURRENT_CONTAINERS = 10;
const INSTALL_CMD =
  "cd /app && npm install && npm run dev -- --host 0.0.0.0 --port 5173";

const getWorkspaceRoot = (): string =>
  process.env.WEBMAKER_WORKSPACE_ROOT?.trim() ||
  path.join(process.cwd(), ".webmaker", "workspaces");

/** Never overwrite these on disk once a workspace is scaffolded (avoids Vite restart storms). */
const SCAFFOLD_PATHS = new Set([
  "/package.json",
  "/index.html",
  "/vite.config.js",
  "/vite.config.ts",
  "/tsconfig.json",
  "/tsconfig.node.json",
  "/tailwind.config.js",
  "/tailwind.config.ts",
  "/postcss.config.js",
  "/postcss.config.ts",
  "/.gitignore",
  "/README.md",
]);

export interface DockerPreviewSession {
  workspaceId: string;
  containerId: string;
  hostPort: number;
  url: string;
  startedAt: string;
  reused?: boolean;
}

interface ActivePreview {
  session: DockerPreviewSession;
  containerName: string;
  ttlTimer: ReturnType<typeof setTimeout>;
  lastActivityAt: number;
}

type PodmanContainerInfo = {
  Id?: string;
  ID?: string;
  Names?: string[];
  Namespaces?: unknown;
  State?: string;
  Status?: string;
};

const activePreviews = new Map<string, ActivePreview>();
const previewLocks = new Map<string, Promise<void>>();
const previewPortRegistry = new Map<string, number>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const sanitizeWorkspaceId = (workspaceId: string): string =>
  workspaceId.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "default";

export const getWorkspaceDiskPath = (workspaceId: string): string =>
  path.join(getWorkspaceRoot(), sanitizeWorkspaceId(workspaceId));

const getContainerName = (workspaceId: string): string =>
  `preview-${sanitizeWorkspaceId(workspaceId)}`;

const getPreviewImage = (): string =>
  process.env.WEBMAKER_PREVIEW_IMAGE?.trim() ||
  process.env.WEBMAKER_DOCKER_IMAGE?.trim() ||
  "node:20-alpine";

const getPreviewDomain = (): string =>
  process.env.WEBMAKER_PREVIEW_DOMAIN?.trim() || "preview.localhost";

const getPreviewProtocol = (): "http" | "https" => {
  const configured = process.env.WEBMAKER_PREVIEW_PROTOCOL?.trim().toLowerCase();
  if (configured === "http" || configured === "https") {
    return configured;
  }
  return getPreviewDomain().endsWith(".localhost") ? "http" : "https";
};

const getPreviewPortSuffix = (): string => {
  const configured = process.env.WEBMAKER_PREVIEW_PUBLIC_PORT?.trim();
  if (configured) return `:${configured}`;
  if (getPreviewDomain().endsWith(".localhost")) {
    return `:${process.env.WEBMAKER_PREVIEW_ROUTER_PORT?.trim() || "4999"}`;
  }
  return "";
};

const getPreviewUrl = (workspaceId: string): string =>
  `${getPreviewProtocol()}://${sanitizeWorkspaceId(workspaceId)}.${getPreviewDomain()}${getPreviewPortSuffix()}`;

const getDirectPreviewUrl = (hostPort: number): string =>
  `http://127.0.0.1:${hostPort}`;

const getBrowserPreviewUrl = (workspaceId: string, hostPort: number): string =>
  getPreviewDomain().endsWith(".localhost")
    ? getDirectPreviewUrl(hostPort)
    : getPreviewUrl(workspaceId);

const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

const withPreviewLock = async <T>(
  workspaceId: string,
  fn: () => Promise<T>
): Promise<T> => {
  const key = sanitizeWorkspaceId(workspaceId);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = previewLocks.get(key) ?? Promise.resolve();
  previewLocks.set(key, previous.then(() => gate));
  await previous;
  try {
    return await fn();
  } finally {
    release();
  }
};

export async function isPodmanAvailable(): Promise<boolean> {
  try {
    execSync("podman info", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export const isDockerAvailable = isPodmanAvailable;

const pathExists = async (target: string): Promise<boolean> => {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
};

const toRelativeDiskPath = (projectPath: string): string => {
  const normalized = normalizeProjectPath(projectPath).replace(/^\/+/, "");
  const resolved = path.normalize(normalized);
  if (resolved.startsWith("..") || path.isAbsolute(resolved)) {
    throw new Error(`Unsafe project path: ${projectPath}`);
  }
  return resolved;
};

/**
 * Write project files to disk. Hermes is the source of truth - preview must not
 * rewrite scaffold config once package.json exists (that restarts Vite mid-HMR).
 */
export async function syncProjectToWorkspaceDisk(
  workspaceId: string,
  project?: GeneratedProject
): Promise<string> {
  const workspacePath = getWorkspaceDiskPath(workspaceId);
  await mkdir(workspacePath, { recursive: true });

  if (!project) {
    return workspacePath;
  }

  const packageJsonPath = path.join(workspacePath, "package.json");
  const scaffolded = await pathExists(packageJsonPath);

  if (!scaffolded) {
    const files = mergeProjectWithBootstrap(project);
    for (const [filePath, file] of Object.entries(files)) {
      const diskPath = path.join(workspacePath, toRelativeDiskPath(filePath));
      await mkdir(path.dirname(diskPath), { recursive: true });
      await writeFile(diskPath, file.code, "utf8");
    }
    return workspacePath;
  }

  for (const [filePath, file] of Object.entries(project.files)) {
    const normalized = normalizeProjectPath(filePath);
    if (SCAFFOLD_PATHS.has(normalized)) {
      continue;
    }
    const diskPath = path.join(workspacePath, toRelativeDiskPath(normalized));
    await mkdir(path.dirname(diskPath), { recursive: true });
    await writeFile(diskPath, file.code, "utf8");
  }

  return workspacePath;
}

async function waitForDevServer(port: number, timeoutMs = DEV_SERVER_TIMEOUT_MS): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}`, {
        signal: AbortSignal.timeout(2_500),
      });
      if (response.status < 500) {
        return;
      }
    } catch {
      // Server not ready yet.
    }
    await sleep(1_000);
  }

  throw new Error("Dev server did not become ready in the Podman container.");
}

async function readContainerHostPort(containerName: string): Promise<number> {
  let mapped = "";
  try {
    const { stdout } = await execAsync(
      `podman port ${shellQuote(containerName)} ${PREVIEW_PORT}/tcp`
    );
    mapped = stdout.trim();
  } catch {
    const { stdout } = await execAsync(
      `podman inspect --format '{{(index (index .NetworkSettings.Ports "5173/tcp") 0).HostPort}}' ${shellQuote(containerName)}`
    );
    mapped = stdout.trim();
  }

  const hostPort = Number(mapped.split(":").pop()?.trim());
  if (!Number.isFinite(hostPort) || hostPort <= 0) {
    throw new Error("Podman did not assign a host port for the preview container.");
  }
  return hostPort;
}

async function inspectStartedAt(containerName: string): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `podman inspect --format '{{.State.StartedAt}}' ${shellQuote(containerName)}`
    );
    return stdout.trim() || new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

async function readContainerLogTail(containerName: string): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `podman logs --tail 80 ${shellQuote(containerName)}`
    );
    return stdout.trim();
  } catch {
    return "";
  }
}

async function isContainerRunning(containerName: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `podman inspect --format '{{.State.Running}}' ${shellQuote(containerName)}`
    );
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}

async function hydrateActivePreviewFromPodman(
  key: string,
  containerName: string,
  containerId?: string
): Promise<ActivePreview | null> {
  if (!(await isContainerRunning(containerName))) {
    return null;
  }

  const hostPort = await readContainerHostPort(containerName);
  previewPortRegistry.set(key, hostPort);
  void registerPreviewPort(key, hostPort);

  const session: DockerPreviewSession = {
    workspaceId: key,
    containerId: containerId || containerName,
    hostPort,
    url: getBrowserPreviewUrl(key, hostPort),
    startedAt: await inspectStartedAt(containerName),
    reused: true,
  };

  const ttlTimer = setTimeout(() => {
    void stopDockerPreview(key);
  }, IDLE_TTL_MS);

  const active: ActivePreview = {
    session,
    containerName,
    ttlTimer,
    lastActivityAt: Date.now(),
  };

  activePreviews.set(key, active);
  return active;
}

async function findPreviewContainer(key: string): Promise<PodmanContainerInfo | null> {
  try {
    const { stdout } = await execAsync(
      `podman ps --filter ${shellQuote(`label=webmaker.workspace=${key}`)} --format json`
    );
    const parsed = JSON.parse(stdout || "[]") as PodmanContainerInfo[];
    return parsed[0] ?? null;
  } catch {
    return null;
  }
}

async function resolvePreviewContainer(key: string): Promise<ActivePreview | null> {
  const cached = activePreviews.get(key);
  if (cached && (await isContainerRunning(cached.containerName))) {
    return cached;
  }

  if (cached) {
    clearPreviewTtl(key);
    activePreviews.delete(key);
  }

  const listed = await findPreviewContainer(key);
  if (!listed) {
    return null;
  }

  return hydrateActivePreviewFromPodman(
    key,
    getContainerName(key),
    listed.Id || listed.ID
  );
}

function clearPreviewTtl(key: string): void {
  const active = activePreviews.get(key);
  if (!active) return;
  clearTimeout(active.ttlTimer);
}

function schedulePreviewTtl(key: string): void {
  clearPreviewTtl(key);
  const active = activePreviews.get(key);
  if (!active) return;

  active.ttlTimer = setTimeout(() => {
    void stopDockerPreview(key);
  }, IDLE_TTL_MS);
}

export function touchDockerPreviewActivity(workspaceId: string): void {
  const key = sanitizeWorkspaceId(workspaceId);
  const active = activePreviews.get(key);
  if (!active) return;
  active.lastActivityAt = Date.now();
  schedulePreviewTtl(key);
}

function evictOldestPreviewIfNeeded(): void {
  if (activePreviews.size < MAX_CONCURRENT_CONTAINERS) return;

  let oldestKey: string | null = null;
  let oldestActivity = Infinity;
  for (const [key, active] of activePreviews) {
    if (active.lastActivityAt < oldestActivity) {
      oldestActivity = active.lastActivityAt;
      oldestKey = key;
    }
  }
  if (oldestKey) {
    void stopDockerPreview(oldestKey);
  }
}

export async function stopDockerPreview(workspaceId: string): Promise<void> {
  const key = sanitizeWorkspaceId(workspaceId);
  const active = activePreviews.get(key);
  const containerName = active?.containerName || getContainerName(key);

  if (active) {
    clearPreviewTtl(key);
    activePreviews.delete(key);
  }
  previewPortRegistry.delete(key);
  void unregisterPreviewPort(key);

  try {
    await execAsync(`podman stop -t 2 ${shellQuote(containerName)}`);
  } catch {
    // Container may already be stopped or gone.
  }

  try {
    await execAsync(`podman rm -f ${shellQuote(containerName)}`);
  } catch {
    // Best-effort cleanup.
  }
}

export interface StartDockerPreviewOptions {
  force?: boolean;
  project?: GeneratedProject;
}

export async function startDockerPreview(
  workspaceId: string,
  options: StartDockerPreviewOptions = {}
): Promise<DockerPreviewSession> {
  return withPreviewLock(workspaceId, async () => {
    const key = sanitizeWorkspaceId(workspaceId);
    const containerName = getContainerName(key);

    if (options.project) {
      await syncProjectToWorkspaceDisk(key, options.project);
    }

    if (!options.force) {
      const existing = await resolvePreviewContainer(key);
      if (existing) {
        touchDockerPreviewActivity(key);
        return { ...existing.session, reused: true };
      }
    } else {
      await stopDockerPreview(key);
    }

    const workspacePath = getWorkspaceDiskPath(key);
    const packageJsonPath = path.join(workspacePath, "package.json");

    if (!(await pathExists(packageJsonPath))) {
      if (!options.project) {
        throw new Error(
          "Workspace is missing package.json on disk. Run a generation first."
        );
      }
    }

    if (!(await pathExists(packageJsonPath))) {
      throw new Error(
        "Workspace is missing package.json on disk. Run a generation first or sync the project."
      );
    }

    evictOldestPreviewIfNeeded();

    if (!(await isPodmanAvailable())) {
      throw new Error("Podman is not available. Install Podman and ensure `podman info` succeeds.");
    }

    await execAsync(`podman rm -f ${shellQuote(containerName)}`).catch(() => undefined);
    const runCommand = [
      "podman run -d",
      `--name ${shellQuote(containerName)}`,
      `--label ${shellQuote(`webmaker.workspace=${key}`)}`,
      "--label webmaker.preview=true",
      "--userns keep-id",
      `-v ${shellQuote(`${workspacePath}:/app`)}`,
      `-p 127.0.0.1::${PREVIEW_PORT}`,
      "--memory 512m",
      "--cpus 0.5",
      shellQuote(getPreviewImage()),
      "sh -c",
      shellQuote(INSTALL_CMD),
    ].join(" ");

    const { stdout } = await execAsync(runCommand);
    const containerId = stdout.trim() || containerName;
    const hostPort = await readContainerHostPort(containerName);
    previewPortRegistry.set(key, hostPort);
    void registerPreviewPort(key, hostPort);
    try {
      await waitForDevServer(hostPort);
    } catch (error) {
      const logs = await readContainerLogTail(containerName);
      throw new Error(
        logs
          ? `Dev server did not become ready in the Podman container.\n\nRecent container logs:\n${logs}`
          : error instanceof Error
            ? error.message
            : "Dev server did not become ready in the Podman container."
      );
    }

    const session: DockerPreviewSession = {
      workspaceId: key,
      containerId,
      hostPort,
      url: getBrowserPreviewUrl(key, hostPort),
      startedAt: new Date().toISOString(),
      reused: false,
    };

    const ttlTimer = setTimeout(() => {
      void stopDockerPreview(key);
    }, IDLE_TTL_MS);

    activePreviews.set(key, {
      session,
      containerName,
      ttlTimer,
      lastActivityAt: Date.now(),
    });

    return session;
  });
}

export function getActiveDockerPreview(
  workspaceId: string
): DockerPreviewSession | null {
  return activePreviews.get(sanitizeWorkspaceId(workspaceId))?.session ?? null;
}

export function getRegisteredPreviewPort(workspaceId: string): number | undefined {
  return previewPortRegistry.get(sanitizeWorkspaceId(workspaceId));
}

export async function streamDockerPreviewLogs(
  workspaceId: string,
  onChunk: (line: string) => void
): Promise<() => void> {
  const key = sanitizeWorkspaceId(workspaceId);
  const active = await resolvePreviewContainer(key);
  if (!active) {
    throw new Error("No active Podman preview for this workspace.");
  }

  const child: ChildProcessWithoutNullStreams = spawn("podman", [
    "logs",
    "--follow",
    "--tail",
    "100",
    active.containerName,
  ]);

  const onData = (chunk: Buffer) => {
    onChunk(chunk.toString("utf8"));
    touchDockerPreviewActivity(key);
  };

  child.stdout.on("data", onData);
  child.stderr.on("data", onData);

  return () => {
    child.stdout.removeListener("data", onData);
    child.stderr.removeListener("data", onData);
    child.kill();
  };
}
