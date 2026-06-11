import type { GeneratedProject } from "@/lib/types";

/** Stable fingerprint so preview embeds fully remount when project contents change. */
export function getPreviewSessionFingerprint(project: GeneratedProject): string {
  const parts: string[] = [project.title, project.entry];
  for (const path of Object.keys(project.files).sort()) {
    const file = project.files[path];
    parts.push(path, file.code);
  }
  return parts.join("\x00");
}

function fnv1a32Hex(bytes: Uint8Array): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i]!;
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/** Compact React key for preview embeds (hash avoids huge keys on large projects). */
export function getPreviewSessionKey(project: GeneratedProject): string {
  const fp = getPreviewSessionFingerprint(project);
  return `${project.entry}-${fnv1a32Hex(new TextEncoder().encode(fp))}`;
}
