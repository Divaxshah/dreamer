"use client";

import { useMemo, useState } from "react";
import {
  FileCode2,
  Copy,
  Download,
  Check,
  AlertTriangle,
  MessageSquareShare,
} from "lucide-react";
import { getProjectFilePaths } from "@/lib/project";
import type { GeneratedProject, RuntimeErrorState } from "@/lib/types";
import { downloadProjectBundle } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CodeViewerProps {
  project: GeneratedProject;
  activeFile: string;
  runtimeError: RuntimeErrorState | null;
  onActiveFileChange: (path: string) => void;
  onShareError: () => void;
}

export function CodeViewer({
  project,
  activeFile,
  runtimeError,
  onActiveFileChange,
  onShareError,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const files = useMemo(() => getProjectFilePaths(project), [project]);
  const activeFileContents = project.files[activeFile]?.code ?? "";
  const hasActiveError = runtimeError?.filePath === activeFile;

  const copyCode = async () => {
    await navigator.clipboard.writeText(activeFileContents.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-card rounded-3xl overflow-hidden border border-border">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-secondary/30 backdrop-blur-md border-b border-border/50">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">
            Project Files
          </p>
          <p className="font-bold text-foreground tracking-tight mt-1">{project.title}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={copyCode}
            className="rounded-xl border-border bg-background hover:bg-secondary text-foreground h-9 px-4 text-xs font-bold transition-all shadow-sm"
          >
            {copied ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void downloadProjectBundle(project)}
            className="rounded-xl border-border bg-background hover:bg-secondary text-foreground h-9 px-4 text-xs font-bold transition-all shadow-sm"
          >
            <Download size={14} className="mr-2" />
            ZIP
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="min-h-0 overflow-y-auto bg-secondary/10 p-4 border-r border-border/50">
          <div className="space-y-1">
            {files.map((path) => {
              const depth = Math.max(path.split("/").length - 2, 0);
              const isActive = path === activeFile;
              const hasError = runtimeError?.filePath === path;
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => onActiveFileChange(path)}
                  className={`flex w-full items-center gap-3 text-left text-xs font-bold p-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                      : hasError
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                  }`}
                  style={{ paddingLeft: `calc(${depth * 12}px + 1rem)` }}
                >
                  {hasError ? (
                    <AlertTriangle
                      size={16}
                      className={isActive ? "text-primary-foreground" : "text-destructive"}
                    />
                  ) : (
                    <FileCode2 size={16} className={isActive ? "text-primary-foreground" : "text-primary/60"} />
                  )}
                  <span className="truncate">{path.replace(/^\//, "")}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex flex-col bg-[#111111]">
          {runtimeError && hasActiveError && (
            <div className="border-b border-destructive/20 bg-destructive/10 px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-destructive/70">
                    Error in active file
                  </p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-destructive">
                    {runtimeError.message}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onShareError}
                  className="rounded-xl border-destructive/20 bg-background/40 text-foreground hover:bg-background/60"
                >
                  <MessageSquareShare size={14} className="mr-2" />
                  Share to Chat
                </Button>
              </div>
            </div>
          )}
          <div className="border-b border-white/5 px-6 py-3 text-xs font-bold text-white/40 bg-white/5 backdrop-blur-sm">
            {activeFile.replace(/^\//, "")}
          </div>
          <pre className="flex-1 overflow-auto p-6 font-mono text-[13px] leading-relaxed text-white/80 scrollbar-thin">
            <code>{activeFileContents}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
