"use client";

import { useCallback, useRef } from "react";
import {
  buildFallbackActivities,
  type GenerationStreamEvent,
} from "@/lib/generation-stream";
import { createId } from "@/lib/utils";
import type { Message } from "@/lib/types";
import {
  getActiveSession,
  getActiveSessionMessages,
  useAppStore,
} from "@/lib/store";

interface GenerateOptions {
  prompt: string;
  includeCurrentProject?: boolean;
}

interface ApiMessage {
  role: "user" | "assistant";
  content: string;
  reasoning_details?: unknown;
}

const parseStreamEvent = (line: string): GenerationStreamEvent | null => {
  try {
    return JSON.parse(line) as GenerationStreamEvent;
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.warn("[useGeneration] dropped malformed stream line", line.slice(0, 120));
    }
    return null;
  }
};

const toApiMessages = (messages: Message[]): ApiMessage[] => {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => {
      const base: ApiMessage = {
        role: message.role,
        content: message.content,
      };
      if (
        message.role === "assistant" &&
        message.reasoning_details !== undefined
      ) {
        return { ...base, reasoning_details: message.reasoning_details };
      }
      return base;
    });
};

export const useGeneration = () => {
  const isGenerating = useAppStore((state) => state.isGenerating);
  const abortControllerRef = useRef<AbortController | null>(null);
  const wasCancelledRef = useRef(false);

  const generate = useCallback(
    async ({ prompt, includeCurrentProject = true }: GenerateOptions) => {
      if (!prompt.trim() || isGenerating) {
        return;
      }

      const state = useAppStore.getState();
      const activeSession = getActiveSession(state);

      if (!activeSession) {
        return;
      }

      const userMessageId = createId();
      const assistantMessageId = createId();
      const now = new Date().toISOString();

      state.setLastPrompt(prompt);
      state.setRuntimeError(null);
      state.setGenerating(true);
      state.setStreamingText("");

      state.addMessage(
        {
          id: userMessageId,
          role: "user",
          content: prompt,
          status: "done",
          createdAt: now,
        },
        activeSession.id
      );

      state.addMessage(
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          status: "thinking",
          createdAt: now,
          codeSnapshot: "",
          activities: [],
        },
        activeSession.id
      );

      const startedAt = performance.now();
      let firstTokenAt: number | null = null;
      let lineBuffer = "";
      let finalTokenCount = 0;
      let finalSummary = "";
      let requestWasCancelled = false;

      try {
        wasCancelledRef.current = false;
        const latestMessages = getActiveSessionMessages(useAppStore.getState());
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const session = getActiveSession(useAppStore.getState());
        const modelSettings = useAppStore.getState().modelSettings;

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
          body: JSON.stringify({
            messages: toApiMessages(latestMessages),
            currentProject: includeCurrentProject ? session.currentProject : null,
            sessionWorkspace: session.workspace ?? null,
            model: modelSettings?.model?.trim() || "",
            provider: modelSettings?.provider?.trim() || "",
            apiKey: modelSettings?.apiKey?.trim() || "",
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`Generation failed (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) {
            continue;
          }

          if (firstTokenAt === null) {
            firstTokenAt = performance.now();
          }

          lineBuffer += chunk;
          const lines = lineBuffer.split("\n");
          lineBuffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
              continue;
            }

            const event = parseStreamEvent(trimmed);
            if (!event) {
              continue;
            }

            if (event.type === "delta") {
              useAppStore.getState().setStreamingText(event.tail);
              useAppStore.getState().updateMessage(
                assistantMessageId,
                (message) => ({
                  ...message,
                  status: "writing",
                  codeSnapshot: event.tail,
                  tokenCount: event.tokenCount,
                }),
                activeSession.id
              );
              continue;
            }

            if (event.type === "activity") {
              useAppStore.getState().updateMessage(
                assistantMessageId,
                (message) => ({
                  ...message,
                  status: "writing",
                  activities: [
                    ...(message.activities ?? []).filter(
                      (activity) => activity.id !== event.activity.id
                    ),
                    event.activity,
                  ],
                }),
                activeSession.id
              );
              continue;
            }

            if (event.type === "project") {
              useAppStore.getState().setCurrentProject(event.project, activeSession.id);
              continue;
            }

            if (event.type === "complete") {
              useAppStore.getState().setCurrentProject(event.project, activeSession.id);
              finalTokenCount = event.tokenCount;
              finalSummary = event.summary;
              continue;
            }

            if (event.type === "aborted") {
              useAppStore.getState().setCurrentProject(event.project, activeSession.id);
              finalTokenCount = event.tokenCount;
              finalSummary = event.summary;
              requestWasCancelled = true;
            }
          }
        }

        if (lineBuffer.trim()) {
          const event = parseStreamEvent(lineBuffer.trim());
          if (event?.type === "project") {
            useAppStore.getState().setCurrentProject(event.project, activeSession.id);
          }
          if (event?.type === "complete") {
            useAppStore.getState().setCurrentProject(event.project, activeSession.id);
            finalSummary = event.summary;
            finalTokenCount = event.tokenCount;
          }
          if (event?.type === "aborted") {
            useAppStore.getState().setCurrentProject(event.project, activeSession.id);
            finalSummary = event.summary;
            finalTokenCount = event.tokenCount;
            requestWasCancelled = true;
          }
        }

        if (wasCancelledRef.current) {
          requestWasCancelled = true;
        }

        const ttfb = firstTokenAt ? Math.round(firstTokenAt - startedAt) : 0;
        const finalState = useAppStore.getState();
        const finalAssistant = getActiveSessionMessages(finalState).find(
          (message) => message.id === assistantMessageId
        );
        const activities =
          finalAssistant?.activities && finalAssistant.activities.length > 0
            ? finalAssistant.activities
            : buildFallbackActivities();

        useAppStore.getState().updateMessage(
          assistantMessageId,
          (message) => ({
            ...message,
            status: requestWasCancelled ? "cancelled" : "done",
            content:
              finalSummary ||
              (requestWasCancelled
                ? "Generation stopped. Preserved the latest workspace snapshot."
                : "Generation completed."),
            codeSnapshot: useAppStore.getState().streamingText,
            activities,
            tokenCount: finalTokenCount || finalAssistant?.tokenCount,
            latencyMs: requestWasCancelled ? undefined : ttfb,
          }),
          activeSession.id
        );
      } catch (error) {
        const isAbort =
          error instanceof DOMException && error.name === "AbortError";
        const errorMessage =
          error instanceof Error ? error.message : "Unknown generation error";

        if (isAbort) {
          useAppStore.getState().updateMessage(
            assistantMessageId,
            (message) => ({
              ...message,
              status: "cancelled",
              content:
                "Generation stopped. Preserved the latest workspace snapshot.",
              codeSnapshot: useAppStore.getState().streamingText,
            }),
            activeSession.id
          );
        } else {
          useAppStore.getState().updateMessage(
            assistantMessageId,
            (message) => ({
              ...message,
              status: "error",
              content: errorMessage,
            }),
            activeSession.id
          );
        }
      } finally {
        abortControllerRef.current = null;
        wasCancelledRef.current = false;
        useAppStore.getState().setGenerating(false);
        useAppStore.getState().setStreamingText("");
      }
    },
    [isGenerating]
  );

  const stopGeneration = useCallback(() => {
    wasCancelledRef.current = true;
    abortControllerRef.current?.abort();
  }, []);

  return { generate, isGenerating, stopGeneration };
};
