"use client";

import { Cpu } from "lucide-react";
import type { Message } from "@/lib/types";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageFeed } from "@/components/chat/MessageFeed";

interface ChatPanelProps {
  messages: Message[];
  isGenerating: boolean;
  streamingText: string;
  lastPrompt: string;
  composerValue: string;
  composerFocusToken?: string | null;
  modelLabel?: string;
  onComposerChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
  onStop: () => void;
  onNewSession: () => void;
}

export function ChatPanel({
  messages,
  isGenerating,
  streamingText,
  lastPrompt,
  composerValue,
  composerFocusToken,
  modelLabel = "Hermes default",
  onComposerChange,
  onSubmit,
  onStop,
}: ChatPanelProps) {
  return (
    <section className="relative flex h-full min-h-0 min-w-0 flex-col bg-card/30 backdrop-blur-xl border-2 border-border rounded-3xl transition-all">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-3xl">
      <header className="relative shrink-0 p-6 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl">
            <Cpu className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl text-foreground tracking-tight leading-none">Studio Assistant</span>
            <span className="mt-1 max-w-[18rem] truncate text-xs font-medium text-muted-foreground">
              {modelLabel}
            </span>
          </div>
        </div>
      </header>

      <div className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-6 scrollbar-thin">
        <MessageFeed
          messages={messages}
          streamingText={streamingText}
          onSuggestionPick={onSubmit}
        />
      </div>

      <div className="shrink-0 p-6 pt-4 bg-background/30 backdrop-blur-xl">
        <ChatInput 
          isGenerating={isGenerating} 
          lastPrompt={lastPrompt} 
          value={composerValue}
          focusToken={composerFocusToken}
          onChange={onComposerChange}
          onSubmit={onSubmit}
          onStop={onStop}
        />
      </div>
      </div>
    </section>
  );
}
