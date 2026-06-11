import {
  createPlaceholderProject,
  ensureScaffoldedProject,
  getProjectFilePaths,
  normalizeProject,
  normalizeProjectPath,
} from "@/lib/project";
import type { GeneratedProject, ProjectFile, WorkspaceSnapshot } from "@/lib/types";
import { getRuntimeConfig, getRuntimeProviderLabel } from "@/lib/runtime-config";

/** Placeholder root for snapshots; Podman preview maps this under `.webmaker/workspaces`. */
export const DEFAULT_WORKSPACE_ROOT = "/workspace";

const cloneProjectFile = (file: ProjectFile): ProjectFile => ({
  code: file.code,
  hidden: file.hidden,
  active: file.active,
});

const cloneProject = (project: GeneratedProject): GeneratedProject => ({
  ...project,
  dependencies: { ...project.dependencies },
  files: Object.fromEntries(
    Object.entries(project.files).map(([filePath, file]) => [
      filePath,
      cloneProjectFile(file),
    ])
  ),
});

export const generateWorkspaceId = (): string =>
  `ws-${Math.random().toString(36).slice(2, 10)}`;

export const ensureWorkspaceProjectIntegrity = (
  project: GeneratedProject
): GeneratedProject => {
  const normalized = normalizeProject(project);
  const filePaths = Object.keys(normalized.files);

  if (filePaths.length === 0) {
    return createPlaceholderProject();
  }

  const entry = normalized.files[normalized.entry]
    ? normalized.entry
    : normalized.files["/src/main.tsx"]
      ? "/src/main.tsx"
      : filePaths.sort((left, right) => left.localeCompare(right))[0];

  const scaffolded = ensureScaffoldedProject(normalized);

  const files = Object.fromEntries(
    Object.entries(scaffolded.files).map(([filePath, file]) => [
      filePath,
      {
        ...cloneProjectFile(file),
        active: filePath === entry,
      },
    ])
  );

  return {
    ...normalized,
    entry,
    files,
  };
};

export const createWorkspaceSnapshot = (
  project?: GeneratedProject,
  workspaceId = generateWorkspaceId()
): WorkspaceSnapshot => {
  const runtimeMode = getRuntimeConfig().mode;
  return {
    id: workspaceId,
    project: ensureWorkspaceProjectIntegrity(project ?? createPlaceholderProject()),
    runtime: {
      provider: runtimeMode,
      status: "idle",
      rootPath: DEFAULT_WORKSPACE_ROOT,
      workspaceId,
      providerLabel: getRuntimeProviderLabel(),
      providerMeta: { mode: "local" },
      preview: {
        status: "idle",
      },
    },
    updatedAt: new Date().toISOString(),
  };
};

export const workspaceFromProject = (
  project: GeneratedProject,
  workspaceId?: string
): WorkspaceSnapshot =>
  createWorkspaceSnapshot(project, workspaceId ?? generateWorkspaceId());

/** Normalize persisted sessions onto the supported local runtime provider. */
export const coerceWorkspaceToSupportedProvider = (
  workspace: WorkspaceSnapshot
): WorkspaceSnapshot => {
  if (workspace.runtime.provider === "local") {
    return workspace;
  }

  return {
    ...workspace,
    runtime: {
      ...workspace.runtime,
      provider: "local",
      providerLabel: getRuntimeProviderLabel(),
      status: "idle",
      preview: { status: "idle" },
      providerMeta: { mode: "local" },
      lastCommand: undefined,
      lastOutput: undefined,
      lastError: undefined,
    },
  };
};

export const syncProjectToWorkspace = (
  workspace: WorkspaceSnapshot,
  project: GeneratedProject
): WorkspaceSnapshot => ({
  ...workspace,
  project: ensureWorkspaceProjectIntegrity(project),
  updatedAt: new Date().toISOString(),
});

export const syncWorkspaceToProject = (
  workspace: WorkspaceSnapshot
): GeneratedProject => ensureWorkspaceProjectIntegrity(workspace.project);

export const listWorkspaceFilePaths = (workspace: WorkspaceSnapshot): string[] =>
  getProjectFilePaths(workspace.project);

export const getWorkspaceFile = (
  workspace: WorkspaceSnapshot,
  filePath: string
): ProjectFile | undefined => {
  const normalized = normalizeProjectPath(filePath);
  return workspace.project.files[normalized];
};

export const cloneWorkspaceSnapshot = (
  workspace: WorkspaceSnapshot
): WorkspaceSnapshot => ({
  ...workspace,
  project: cloneProject(workspace.project),
  runtime: {
    ...workspace.runtime,
    preview: { ...workspace.runtime.preview },
    providerMeta: workspace.runtime.providerMeta
      ? { ...workspace.runtime.providerMeta }
      : undefined,
  },
});
