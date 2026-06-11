"use client";

import { AlertTriangle, Bug, FileWarning, Sparkles } from "lucide-react";
import type { RuntimeErrorState } from "@/lib/types";

interface ErrorBannerProps {
  error: RuntimeErrorState;
  onDismiss: () => void;
  onOpenFile: () => void;
  onFix: () => void;
  onShare: () => void;
}

export function ErrorBanner({
  error,
  onDismiss,
  onOpenFile,
  onFix,
  onShare,
}: ErrorBannerProps) {
  return (
    <div className="absolute bottom-6 left-6 right-6 z-30 rounded-3xl border border-destructive/20 bg-[linear-gradient(180deg,rgba(84,20,20,0.22),rgba(27,12,12,0.94))] backdrop-blur-xl p-4 shadow-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-destructive/60">
              {error.source === "compile" ? "Compile Error" : "Runtime Error"}
            </p>
            {error.filePath && (
              <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 font-mono text-[10px] text-destructive/80">
                {error.filePath}
                {error.line ? `:${error.line}${error.column ? `:${error.column}` : ""}` : ""}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium leading-relaxed text-destructive">
            {error.message}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {error.filePath && (
            <button
              type="button"
              onClick={onOpenFile}
              className="inline-flex items-center gap-2 rounded-xl border border-destructive/20 bg-background/30 px-4 py-2 text-xs font-bold text-foreground transition-all hover:bg-background/50"
            >
              <FileWarning size={14} />
              Open File
            </button>
          )}
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/15"
          >
            <Bug size={14} />
            Share to Chat
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={onFix}
            className="inline-flex items-center gap-2 rounded-xl bg-destructive text-destructive-foreground px-5 py-2 text-xs font-bold shadow-lg shadow-destructive/20 transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles size={14} />
            Auto Fix
          </button>
        </div>
      </div>
    </div>
  );
}
