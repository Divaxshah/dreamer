"use client";

import { useEffect, useState } from "react";
import type { GeneratedProject } from "@/lib/types";
import { PreviewEmbed } from "@/components/preview/PreviewEmbed";

interface ClientPreviewFallbackProps {
  id: string;
}

export function ClientPreviewFallback({ id }: ClientPreviewFallbackProps) {
  const [project, setProject] = useState<GeneratedProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(`wm-preview-${id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as GeneratedProject;
        if (parsed && typeof parsed === "object" && parsed.files) {
          setProject(parsed);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to parse localStorage preview:", e);
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <p className="text-sm font-medium animate-pulse">Loading preview...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="text-center">
          <p className="text-4xl font-bold text-zinc-200 mb-3">404</p>
          <p className="text-sm">Preview not found or has expired.</p>
          <p className="text-xs text-zinc-600 mt-6 max-w-sm mx-auto">
            Vercel serverless file systems are ephemeral. The instance that generated this preview 
            may no longer exist. Generate a new preview to view it locally.
          </p>
        </div>
      </div>
    );
  }

  return <PreviewEmbed project={project} />;
}
