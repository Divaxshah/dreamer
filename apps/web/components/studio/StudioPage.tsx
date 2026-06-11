"use client";

import { useMemo, useState } from "react";
import { Square } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import { SessionRail } from "@/components/studio/SessionRail";
import { ModelSettingsDialog } from "@/components/studio/ModelSettingsDialog";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ResizablePanel } from "@/components/ui/ResizablePanel";
import { useGeneration } from "@/hooks/useGeneration";
import { useDashboardSessionSync } from "@/hooks/useDashboardSessionSync";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  getActiveSessionMessages,
  getActiveSessionProject,
  useAppStore,
} from "@/lib/store";
import { createId } from "@/lib/utils";

type MobileTab = "chat" | "workspace";

export function StudioPage() {
  useDashboardSessionSync(true);

  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [composerValue, setComposerValue] = useState("");
  const [composerFocusToken, setComposerFocusToken] = useState<string | null>(null);

  const { generate, stopGeneration } = useGeneration();
  const sessions = useAppStore((state) => state.sessions);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const isGenerating = useAppStore((state) => state.isGenerating);
  const streamingText = useAppStore((state) => state.streamingText);
  const lastPrompt = useAppStore((state) => state.lastPrompt);
  const runtimeError = useAppStore((state) => state.runtimeError);
  const modelSettings = useAppStore((state) => state.modelSettings);

  const messages = useAppStore(getActiveSessionMessages);
  const project = useAppStore(getActiveSessionProject);
  const activeSession = useAppStore((state) =>
    state.sessions.find((session) => session.id === state.activeSessionId)
  );

  const deleteSession = useAppStore((state) => state.deleteSession);
  const setRuntimeError = useAppStore((state) => state.setRuntimeError);
  const setActiveSessionId = useAppStore((state) => state.setActiveSessionId);
  const newSession = useAppStore((state) => state.newSession);

  const fixPrompt = useMemo(() => {
    return runtimeError?.prompt ?? "";
  }, [runtimeError?.prompt]);

  const modelLabel = modelSettings?.model
    ? `${modelSettings.model} via ${modelSettings.provider}`
    : "Hermes default";

  const submitPrompt = async (prompt: string) => {
    setMobileTab("workspace");
    setComposerValue("");
    await generate({ prompt, includeCurrentProject: true });
  };

  const fixError = async () => {
    if (!fixPrompt) return;
    await generate({ prompt: fixPrompt, includeCurrentProject: true });
  };

  const createSession = () => {
    newSession();
    setMobileTab("chat");
  };

  const removeSession = (id: string) => {
    deleteSession(id);
    setMobileTab("chat");
  };

  const chatPanel = (
    <ChatPanel
      messages={messages}
      isGenerating={isGenerating}
      streamingText={streamingText}
      lastPrompt={lastPrompt}
      composerValue={composerValue}
      composerFocusToken={composerFocusToken}
      modelLabel={modelLabel}
      onComposerChange={setComposerValue}
      onSubmit={submitPrompt}
      onStop={stopGeneration}
      onNewSession={createSession}
    />
  );

  const previewPanel = (
    <PreviewPanel
      project={project}
      workspaceId={activeSession?.workspace?.id ?? activeSessionId ?? "default"}
      runtimeError={runtimeError}
      isGenerating={isGenerating}
      onDismissError={() => setRuntimeError(null)}
      onFixError={fixError}
      onShareError={() => {
        if (!runtimeError?.prompt) return;
        setComposerValue(runtimeError.prompt);
        setComposerFocusToken(createId());
        setMobileTab("chat");
      }}
    />
  );

  return (
    <SidebarProvider>
      <main className="studio-shell flex min-h-dvh w-full overflow-hidden bg-background text-foreground font-sans selection:bg-primary/20">
        <SessionRail
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={(id) => {
            setActiveSessionId(id);
            setMobileTab("chat");
          }}
          onDelete={removeSession}
          onNewSession={createSession}
        />

        <SidebarInset className="flex flex-col flex-1 h-dvh min-h-0 bg-background rounded-none">
          {/* Top Navbar */}
          <header className="flex shrink-0 items-center justify-between bg-background/50 backdrop-blur-md px-6 h-20 z-20">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center font-display text-lg leading-none rounded-xl rotate-3">
                W
              </div>
              <div className="flex flex-col">
                <h1 className="font-display text-xl tracking-tight text-foreground font-bold">
                  {project.title || "New Project"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {isGenerating && (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-destructive transition hover:bg-destructive/15"
                >
                  <Square size={12} className="fill-current" />
                  Stop
                </button>
              )}
              <ModelSettingsDialog />
              <ThemeToggle />
              {isGenerating && (
                <div className="hidden items-center gap-3 text-xs font-bold tracking-tight md:flex rounded-full px-5 py-2 transition-all bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground"></span>
                  </span>
                  Generating...
                </div>
              )}
            </div>
          </header>

          <div className="flex flex-1 flex-col overflow-hidden relative z-10 p-4 pt-0">
            {/* Mobile Header Tabs */}
            <div className="px-6 py-4 lg:hidden bg-card/50 backdrop-blur-xl rounded-3xl border border-white/10 mb-4 z-20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <p className="truncate text-base font-display font-bold text-foreground">{project.title}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">
                    {Object.keys(project.files).length} files
                  </p>
                </div>
                <div className="inline-flex p-1 bg-secondary rounded-full">
                  <button
                    type="button"
                    onClick={() => setMobileTab("chat")}
                    className={`px-6 py-2 text-xs font-bold transition-all rounded-full ${
                      mobileTab === "chat" 
                        ? "bg-foreground text-background shadow-md" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("workspace")}
                    className={`px-6 py-2 text-xs font-bold transition-all rounded-full ${
                      mobileTab === "workspace" 
                        ? "bg-foreground text-background shadow-md" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Workspace
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile View */}
            <div className="flex min-h-0 flex-1 flex-col lg:hidden relative z-10">
              <div className="min-h-0 flex-1 overflow-hidden p-0 rounded-3xl bg-card border border-white/10 shadow-xl">
                {mobileTab === "chat" ? (
                  chatPanel
                ) : (
                  <div className="h-full min-h-0 overflow-hidden">
                    {previewPanel}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden min-h-0 flex-1 lg:flex relative">
              <div className="relative z-10 flex-1 min-h-0 min-w-0 w-full">
                <ResizablePanel
                  left={
                    <div className="h-full min-h-0 overflow-hidden p-2">
                      {chatPanel}
                    </div>
                  }
                  right={
                    <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden p-2 pl-0">
                      {previewPanel}
                    </div>
                  }
                  initialWidth={450}
                  minWidth={320}
                  maxWidth={800}
                />
              </div>
            </div>
          </div>
        </SidebarInset>
        <span suppressHydrationWarning className="sr-only">
          Session: {activeSession?.id ?? activeSessionId}
        </span>
      </main>
    </SidebarProvider>
  );
}
