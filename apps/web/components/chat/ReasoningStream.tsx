"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentActivity } from "@/lib/types";

const MAX_LINES = 3;

function lastReasoningMarkdown(detail: string): string {
  const cleaned = detail.trim();
  if (!cleaned || cleaned === "Reasoned.") {
    return "";
  }

  const lines = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const tail = lines.length <= MAX_LINES ? lines : lines.slice(-MAX_LINES);
  return tail.join("\n\n");
}

interface ReasoningStreamProps {
  activity: AgentActivity;
}

export function ReasoningStream({ activity }: ReasoningStreamProps) {
  const markdown = useMemo(
    () => lastReasoningMarkdown(activity.detail ?? ""),
    [activity.detail]
  );

  const show = activity.status === "active" && markdown.length > 0;

  return (
    <AnimatePresence mode="wait">
      {show ? (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
          aria-live="polite"
          aria-label="Agent reasoning"
        >
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <div className="mb-2 flex items-center gap-2">
              <motion.span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 1.1, repeat: Infinity }}
              />
              <span className="text-[11px] font-medium text-muted-foreground">
                Thinking
              </span>
            </div>
            <div className="markdown-chat text-xs leading-relaxed text-muted-foreground [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_p]:line-clamp-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
