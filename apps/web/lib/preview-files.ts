import { getBootstrapFiles, pinPackageJsonForPreview } from "@/lib/download-bootstrap";
import { hasScaffoldedPackageJson, resolveProjectEntry } from "@/lib/project";
import type { GeneratedProject } from "@/lib/types";

/** Paths fully defined by bootstrap; user project must not override (legacy non-scaffolded previews). */
const PREVIEW_LOCKED_PATHS = new Set([
  "/package.json",
  "/index.html",
  "/vite.config.js",
  "/vite.config.ts",
  "/tsconfig.json",
  "/tsconfig.node.json",
  "/.gitignore",
  "/README.md",
]);

const PREVIEW_SKIP_PATHS = new Set([
  "/package-lock.json",
  "/yarn.lock",
  "/pnpm-lock.yaml",
  "/bun.lock",
  "/.webmaker-project.json",
]);

const PREVIEW_SKIP_SUFFIXES = [".tsbuildinfo", ".d.ts.map"];

function toRelativePath(projectPath: string): string {
  return projectPath.replace(/^\//, "");
}

function shouldSkipPreviewPath(projectPath: string, allPaths: Set<string>): boolean {
  if (PREVIEW_SKIP_PATHS.has(projectPath)) {
    return true;
  }

  const rel = toRelativePath(projectPath);
  if (PREVIEW_SKIP_SUFFIXES.some((suffix) => rel.endsWith(suffix))) {
    return true;
  }

  if (projectPath === "/vite.config.js" && allPaths.has("/vite.config.ts")) {
    return true;
  }
  if (projectPath === "/vite.config.d.ts") {
    return true;
  }

  return false;
}

function patchViteConfigForContainer(code: string): string {
  if (code.includes("host:") || code.includes("host :")) {
    return code;
  }
  if (code.includes("defineConfig(")) {
    return code.replace(
      /defineConfig\s*\(\s*\{/,
      "defineConfig({\n  server: { host: true },"
    );
  }
  return code;
}

function sanitizeFileForPreview(projectPath: string, code: string): string {
  if (projectPath === "/package.json") {
    return pinPackageJsonForPreview(code);
  }
  if (projectPath === "/vite.config.ts" || projectPath === "/vite.config.js") {
    return patchViteConfigForContainer(code);
  }
  return code;
}

/** Flat repo-relative paths -> file contents for container preview / download bundles. */
export function getPreviewProjectFiles(
  project: GeneratedProject
): Record<string, string> {
  const scaffolded = hasScaffoldedPackageJson(project);
  const allPaths = new Set(Object.keys(project.files));

  if (scaffolded) {
    const files: Record<string, string> = {};
    for (const [path, file] of Object.entries(project.files)) {
      if (shouldSkipPreviewPath(path, allPaths)) {
        continue;
      }
      files[toRelativePath(path)] = sanitizeFileForPreview(path, file.code);
    }
    return files;
  }

  const bootstrap = getBootstrapFiles(project);
  const files: Record<string, string> = { ...bootstrap };

  for (const [path, file] of Object.entries(project.files)) {
    if (PREVIEW_LOCKED_PATHS.has(path) || shouldSkipPreviewPath(path, allPaths)) {
      continue;
    }
    files[toRelativePath(path)] = file.code;
  }

  return files;
}

export function getPreviewEntryPath(project: GeneratedProject): string {
  const files = getPreviewProjectFiles(project);
  const entry = resolveProjectEntry(project.files, project.entry);
  const rel = toRelativePath(entry);
  return files[rel] ? rel : "src/main.tsx";
}
