"use client";

import { useEffect, useRef, useState } from "react";
import { clamp } from "@/lib/utils";

interface ResizablePanelProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export function ResizablePanel({
  left,
  right,
  initialWidth = 380,
  minWidth = 280,
  maxWidth = 600,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(() =>
    clamp(initialWidth, minWidth, maxWidth)
  );
  const draggingRef = useRef(false);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!draggingRef.current) {
        return;
      }

      setWidth(clamp(event.clientX, minWidth, maxWidth));
    };

    const onMouseUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [maxWidth, minWidth]);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0">
      <div className="h-full min-h-0 min-w-0 overflow-hidden" style={{ width }}>
        {left}
      </div>

      <button
        type="button"
        className="group relative w-3 shrink-0 bg-transparent"
        onMouseDown={() => {
          draggingRef.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        aria-label="Resize panels"
      >
        <span className="absolute inset-y-8 left-1/2 w-px -translate-x-1/2 rounded-full bg-[var(--wm-border)] transition group-hover:bg-[var(--wm-border-strong)]" />
        <span className="absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--wm-border-strong)] opacity-0 transition group-hover:opacity-100" />
      </button>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">{right}</div>
    </div>
  );
}
