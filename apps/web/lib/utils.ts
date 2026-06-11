import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { GeneratedProject } from "./types"
import JSZip from "jszip"
import { getBootstrapFiles } from "./download-bootstrap"
import { createPlaceholderProject } from "./project"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max)
}

export function createId() {
  return Math.random().toString(36).substring(2, 9)
}

export function estimateTokenCount(text: string) {
  return Math.ceil(text.length / 4)
}

export const STARTER_PROJECT: GeneratedProject = createPlaceholderProject();

export async function downloadProjectBundle(project: GeneratedProject) {
  const zip = new JSZip();

  // Bootstrap: runnable project config (package.json, index.html, vite/tailwind, README). When the agent
  // creates these root files, they are in project.files and overwrite these defaults when we add files below.
  const bootstrap = getBootstrapFiles(project);
  for (const [path, content] of Object.entries(bootstrap)) {
    zip.file(path, content);
  }

  for (const [path, file] of Object.entries(project.files)) {
    const cleanPath = path.replace(/^\//, "");
    zip.file(cleanPath, file.code);
  }

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.title.toLowerCase().replace(/\s+/g, "-") || "webmaker-project"}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

