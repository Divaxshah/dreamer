"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronDown,
  CheckCircle2,
  FileDiff,
  FilePlus2,
  FileSearch2,
  Loader2,
  PencilLine,
  ScanSearch,
  Search,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import type { AgentActivity, Message } from "@/lib/types";
import { ReasoningStream } from "@/components/chat/ReasoningStream";
import { StatusIndicator } from "@/components/chat/StatusIndicator";

interface ActivityGroupProps {
  userMessage: Message;
  assistantMessage?: Message;
  streamingText: string;
  isLatest: boolean;
}

interface ActivityPhase {
  id: string;
  activities: AgentActivity[];
  isComplete: boolean;
}

type TimelineEntry =
  | { kind: "phase"; phase: ActivityPhase }
  | { kind: "reasoning"; activity: AgentActivity };

function isReasoningActivity(activity: AgentActivity): boolean {
  return activity.tool === "hermes.reasoning" || activity.title === "Reasoning";
}

function buildActivityTimeline(
  activities: AgentActivity[],
  isGenerationComplete: boolean
): TimelineEntry[] {
  const timeline: TimelineEntry[] = [];
  let current: AgentActivity[] = [];
  let phaseIndex = 0;
  let reasoningIndex = 0;

  const flushPhase = (isComplete: boolean) => {
    if (current.length === 0) return;
    timeline.push({
      kind: "phase",
      phase: {
        id: `phase-${phaseIndex++}`,
        activities: current,
        isComplete,
      },
    });
    current = [];
  };

  for (const activity of activities) {
    if (isReasoningActivity(activity)) {
      flushPhase(true);
      if (activity.status === "active") {
        timeline.push({
          kind: "reasoning",
          activity,
        });
      }
      continue;
    }
    current.push(activity);
  }

  flushPhase(isGenerationComplete);
  return timeline;
}

function phaseSummary(activities: AgentActivity[]): string {
  const reads = activities.filter((a) => a.kind === "read").length;
  const edits = activities.filter(
    (a) => a.kind === "edit" || a.kind === "patch" || a.kind === "create" || a.kind === "delete" || a.kind === "rename"
  ).length;
  const searches = activities.filter((a) => a.kind === "search").length;
  const terminals = activities.filter((a) => a.title.toLowerCase().includes("terminal")).length;

  const parts: string[] = [];
  if (reads > 0) parts.push(`read ${reads} file${reads === 1 ? "" : "s"}`);
  if (edits > 0) parts.push(`edited ${edits} file${edits === 1 ? "" : "s"}`);
  if (searches > 0) parts.push(`searched ${searches} time${searches === 1 ? "" : "s"}`);
  if (terminals > 0) parts.push(`ran ${terminals} command${terminals === 1 ? "" : "s"}`);

  if (parts.length > 0) return parts.join(", ");
  return `${activities.length} step${activities.length === 1 ? "" : "s"}`;
}

function activityStepLabel(activity: AgentActivity): string {
  const target = activity.targets?.[0];
  if (target) {
    return `${activity.title} · ${target.replace(/^\/+/, "")}`;
  }
  return activity.title;
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-chat text-sm leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-3 list-disc pl-5 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className="my-3 p-3 rounded-lg bg-muted border border-border overflow-x-auto text-xs">
                <code {...props}>{children}</code>
              </pre>
            );
          }
          return (
            <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs" {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        h1: ({ children }) => <h1 className="text-lg font-semibold mt-4 mb-2 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
        a: ({ href, children }) => (
          <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function ActivityGroup({
  userMessage,
  assistantMessage,
  streamingText: _streamingText,
  isLatest,
}: ActivityGroupProps) {
  const isComplete =
    assistantMessage?.status === "done" ||
    assistantMessage?.status === "cancelled";

  const timeline = useMemo(
    () =>
      buildActivityTimeline(
        assistantMessage?.activities ?? [],
        isComplete
      ),
    [assistantMessage?.activities, isComplete]
  );

  const phases = useMemo(
    () =>
      timeline
        .filter((entry): entry is { kind: "phase"; phase: ActivityPhase } => entry.kind === "phase")
        .map((entry) => entry.phase),
    [timeline]
  );

  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      for (const phase of phases) {
        if (phase.isComplete) {
          next.add(phase.id);
        } else {
          next.delete(phase.id);
        }
      }
      return next;
    });
  }, [phases]);

  const togglePhase = (phaseId: string) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const isWriting = assistantMessage?.status === "writing";
  const hasFinalContent =
    Boolean(assistantMessage?.content) &&
    assistantMessage?.status !== "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-w-0 space-y-4 overflow-hidden"
    >
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25 overflow-hidden">
        <p className="break-words text-sm font-medium leading-relaxed text-foreground">
          {userMessage.content}
        </p>
      </div>

      {assistantMessage && (
        <div className="min-w-0 space-y-3 overflow-hidden">
          {assistantMessage.status === "thinking" && phases.length === 0 && (
            <StatusIndicator status="thinking" />
          )}

          {isWriting && phases.length === 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span className="text-xs">Starting agent workflow...</span>
            </div>
          )}

          {timeline.map((entry, entryIndex) => {
            if (entry.kind === "reasoning") {
              return (
                <ReasoningStream
                  key={`${entry.activity.id}-${entryIndex}`}
                  activity={entry.activity}
                />
              );
            }

            const phase = entry.phase;
            const phaseIndex = phases.findIndex((p) => p.id === phase.id);
            const isCollapsed = collapsedPhases.has(phase.id);
            const isActivePhase =
              isWriting &&
              isLatest &&
              phaseIndex === phases.length - 1 &&
              !phase.isComplete;

            return (
              <WorkPhaseCollapsible
                key={phase.id}
                phase={phase}
                phaseIndex={phaseIndex}
                totalPhases={phases.length}
                isCollapsed={isCollapsed}
                isActive={isActivePhase}
                onToggle={() => togglePhase(phase.id)}
              />
            );
          })}

          {assistantMessage.status === "cancelled" && (
            <StatusIndicator status="cancelled" />
          )}

          {assistantMessage.status === "error" && (
            <StatusIndicator status="error" errorMessage={assistantMessage.content} />
          )}

          {hasFinalContent && (
            <div className="min-w-0 pt-1">
              <MarkdownContent content={assistantMessage.content} />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function WorkPhaseCollapsible({
  phase,
  phaseIndex,
  totalPhases,
  isCollapsed,
  isActive,
  onToggle,
}: {
  phase: ActivityPhase;
  phaseIndex: number;
  totalPhases: number;
  isCollapsed: boolean;
  isActive: boolean;
  onToggle: () => void;
}) {
  const summary = phaseSummary(phase.activities);
  const label =
    totalPhases > 1
      ? `${summary} · phase ${phaseIndex + 1}`
      : summary;

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-xs text-muted-foreground transition hover:bg-secondary/30 hover:text-foreground"
      >
        <ChevronDown
          size={14}
          className={`shrink-0 transition ${isCollapsed ? "-rotate-90" : ""}`}
        />
        {isActive ? (
          <motion.span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
        ) : (
          <CheckCircle2 size={14} className="shrink-0 text-primary/70" />
        )}
        <span className="min-w-0 truncate font-medium">
          {isActive ? "Working..." : "Worked"}
        </span>
        <span className="shrink-0 text-muted-foreground/80">{label}</span>
      </button>

      {!isCollapsed && (
        <div className="mt-1 space-y-0.5 pl-5">
          {phase.activities.map((activity, index) => (
            <ActivityRow
              key={`${activity.id}-${index}`}
              activity={activity}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRow({ activity }: { activity: AgentActivity }) {
  return (
    <div className="flex items-center gap-2 py-0.5 text-xs text-foreground/90">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-primary/10 bg-primary/5 text-primary">
        {renderActivityIcon(activity.kind, 12)}
      </span>
      <span className="min-w-0 truncate">{activityStepLabel(activity)}</span>
    </div>
  );
}

function renderActivityIcon(kind: AgentActivity["kind"], size = 16) {
  switch (kind) {
    case "inspect":
      return <ScanSearch size={size} />;
    case "search":
      return <Search size={size} />;
    case "read":
      return <FileSearch2 size={size} />;
    case "edit":
      return <PencilLine size={size} />;
    case "patch":
      return <FileDiff size={size} />;
    case "create":
      return <FilePlus2 size={size} />;
    case "delete":
      return <Trash2 size={size} />;
    case "rename":
      return <Wand2 size={size} />;
    case "verify":
    case "complete":
      return <CheckCircle2 size={size} />;
    case "plan":
    default:
      return <Sparkles size={size} />;
  }
}
