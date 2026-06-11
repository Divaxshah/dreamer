"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { GeneratedProject } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

interface DockerPreviewFrameProps {
  project: GeneratedProject;
  workspaceId: string;
  refreshKey?: number;
  forceRestart?: boolean;
  onRetry?: () => void;
  onReady?: () => void;
}

const PREVIEW_LOAD_HINT_MS = 150_000;

export function DockerPreviewFrame({
  project,
  workspaceId,
  refreshKey = 0,
  forceRestart = false,
  onRetry,
  onReady,
}: DockerPreviewFrameProps) {
  const projectRef = useRef(project);
  projectRef.current = project;
  const workspaceIdRef = useRef(workspaceId);
  workspaceIdRef.current = workspaceId;
  const runGenRef = useRef(0);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>("Starting Podman preview...");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSlowHint, setShowSlowHint] = useState(false);

  useLayoutEffect(() => {
    const myGen = ++runGenRef.current;
    const abort = new AbortController();

    setError(null);
    setStatus(forceRestart ? "Restarting Podman preview..." : "Connecting to Podman preview...");
    if (forceRestart) {
      setPreviewUrl(null);
    }
    setShowSlowHint(false);

    const slowTimer = window.setTimeout(() => {
      if (myGen === runGenRef.current) setShowSlowHint(true);
    }, PREVIEW_LOAD_HINT_MS);

    const run = async () => {
      try {
        const response = await fetch("/api/preview/docker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project: projectRef.current,
            workspaceId: workspaceIdRef.current,
            force: forceRestart,
          }),
          signal: abort.signal,
        });

        const payload = (await response.json()) as {
          url?: string;
          error?: string;
          reused?: boolean;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to start Podman preview.");
        }

        if (!payload.url) {
          throw new Error("Preview API did not return a URL.");
        }

        if (abort.signal.aborted || myGen !== runGenRef.current) return;

        setPreviewUrl(payload.url);
        setStatus(null);
        onReady?.();
      } catch (e) {
        if (abort.signal.aborted || myGen !== runGenRef.current) return;
        const message =
          e instanceof Error ? e.message : "Failed to load Podman preview.";
        console.error("[webmaker:preview]", message, e);
        setError(message);
        setStatus(null);
      } finally {
        window.clearTimeout(slowTimer);
      }
    };

    void run();

    return () => {
      abort.abort();
      window.clearTimeout(slowTimer);
    };
  }, [refreshKey, workspaceId, forceRestart, onReady]);

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border border-[var(--wm-border)] bg-white dark:bg-zinc-900 p-1"
      style={{ height: "100%", minHeight: 0 }}
    >
      {previewUrl ? (
        <iframe
          key={previewUrl}
          title="App preview"
          src={previewUrl}
          className="min-h-0 flex-1 w-full border-0 bg-white"
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          {!error ? (
            <>
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                {status ?? "Loading preview..."}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Volume-mounting your workspace, then npm install + dev server in Podman.
                First boot can take 1-3 minutes; later edits hot-reload via Vite HMR.
              </p>
              {showSlowHint ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 max-w-sm">
                  Still working - npm install inside the container can take a while on first run.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center backdrop-blur-sm">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm font-medium text-foreground">{error}</p>
          <p className="text-xs text-muted-foreground max-w-md">
            Ensure Podman is installed and <code className="text-foreground">podman info</code>{" "}
            succeeds for the app user.
          </p>
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="size-4" />
            Restart container
          </Button>
        </div>
      ) : null}
    </div>
  );
}

interface DockerPreviewFrameWithRetryProps extends DockerPreviewFrameProps {
  onRetryFullRemount?: () => void;
  onReady?: () => void;
}

export function DockerPreviewFrameWithRetry({
  project,
  workspaceId,
  refreshKey,
  forceRestart,
  onRetryFullRemount,
  onReady,
}: DockerPreviewFrameWithRetryProps) {
  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{ height: "100%", minHeight: 0 }}
    >
      <DockerPreviewFrame
        project={project}
        workspaceId={workspaceId}
        refreshKey={refreshKey}
        forceRestart={forceRestart}
        onRetry={onRetryFullRemount}
        onReady={onReady}
      />
    </div>
  );
}
