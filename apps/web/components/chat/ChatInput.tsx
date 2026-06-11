"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  isGenerating: boolean;
  lastPrompt: string;
  value: string;
  focusToken?: string | null;
  onChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
  onStop: () => void;
}

export function ChatInput({
  isGenerating,
  lastPrompt,
  value,
  focusToken,
  onChange,
  onSubmit,
  onStop,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const next = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${Math.max(next, 56)}px`;
  };

  useEffect(() => {
    resizeTextarea();
  }, [value]);

  useEffect(() => {
    if (!focusToken) {
      return;
    }

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const length = value.length;
      textareaRef.current?.setSelectionRange(length, length);
    });
  }, [focusToken, value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isGenerating) return;
    onSubmit(trimmed);
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 overflow-hidden">
      <div className="relative min-w-0 overflow-hidden rounded-[2rem] bg-card border-2 border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
            if (event.key === "ArrowUp" && !value && lastPrompt) {
              event.preventDefault();
              onChange(lastPrompt);
            }
          }}
          placeholder="Describe the frontend you want to build..."
          disabled={isGenerating}
          className="w-full min-w-0 resize-none border-none bg-transparent px-6 py-5 text-sm font-medium leading-relaxed text-foreground shadow-none outline-none ring-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 disabled:cursor-not-allowed break-words"
          style={{ minHeight: "56px" }}
        />

        <div className="flex items-center justify-between px-6 pb-4">
          <span className="text-[10px] font-bold text-muted-foreground/60">
            Shift + Enter for new line
          </span>
          <Button
            type="button"
            onClick={isGenerating ? onStop : submit}
            disabled={!isGenerating && !value.trim()}
            size="icon"
            className={`h-12 w-12 rounded-2xl text-primary-foreground transition-all shadow-lg ${
              isGenerating
                ? "bg-destructive hover:scale-105 active:scale-95 shadow-destructive/20"
                : "bg-primary hover:scale-105 active:scale-95 shadow-primary/20"
            } disabled:opacity-50`}
            title={isGenerating ? "Stop Generation" : "Send Prompt"}
          >
            {isGenerating ? (
              <Square size={16} className="fill-current" />
            ) : (
              <ArrowUp size={18} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
