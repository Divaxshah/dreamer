"use client";

import type { GeneratedProject } from "@/lib/types";
import { getPreviewSessionKey } from "@/lib/preview-session-key";
import { DockerPreviewFrame } from "@/components/preview/DockerPreviewFrame";

interface PreviewEmbedProps {
  project: GeneratedProject;
}

export function PreviewEmbed({ project }: PreviewEmbedProps) {
  const sessionKey = getPreviewSessionKey(project);

  return (
    <div className="preview-embed-wrapper rounded-none" style={{ width: "100vw", height: "100vh" }}>
      <style>{`
        .preview-embed-wrapper iframe {
          width: 100% !important;
          height: 100% !important;
          min-height: 100vh !important;
          border: none !important;
          border-radius: 0 !important;
        }
      `}</style>
      <DockerPreviewFrame
        project={project}
        workspaceId={`share-${sessionKey}`}
        refreshKey={0}
      />
    </div>
  );
}
