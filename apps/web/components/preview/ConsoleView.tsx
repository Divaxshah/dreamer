"use client";

import { useEffect, useRef, useState } from "react";

interface ConsoleViewProps {
  workspaceId?: string;
  /** Connect log stream only after preview container is up. */
  previewReady?: boolean;
}

export function ConsoleView({ workspaceId, previewReady = false }: ConsoleViewProps) {
  const [lines, setLines] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!workspaceId || !previewReady) {
      return;
    }

    setLines([]);
    const source = new EventSource(
      `/api/preview/docker/logs?workspaceId=${encodeURIComponent(workspaceId)}`
    );

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          line?: string;
          error?: string;
          ready?: boolean;
        };
        const err = payload.error;
        if (err) {
          setLines((prev) => [...prev.slice(-199), `⚠ ${err}`]);
          return;
        }
        const line = payload.line;
        if (typeof line === "string") {
          setLines((prev) => [...prev.slice(-199), line]);
        }
      } catch {
        // Ignore malformed events.
      }
    };

    return () => source.close();
  }, [workspaceId, previewReady]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="h-full overflow-y-auto bg-[#111111] p-4 font-mono text-[12px] leading-relaxed text-white/70">
      <p className="mb-3 font-semibold text-white/85">Podman preview logs</p>
      {!workspaceId ? (
        <p className="text-white/40">No workspace selected.</p>
      ) : !previewReady ? (
        <p className="text-white/40">Logs appear once the Podman preview container is running.</p>
      ) : lines.length === 0 ? (
        <p className="text-white/40">Waiting for container output...</p>
      ) : (
        lines.map((line, index) => (
          <div key={`${index}-${line.slice(0, 24)}`} className="whitespace-pre-wrap break-all">
            {line}
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
