"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { migrateLegacySession } from "@/lib/project";
import type {
  GeneratedProject,
  Message,
  RuntimeErrorState,
  Session,
  WorkspaceSnapshot,
} from "@/lib/types";
import { createId, STARTER_PROJECT } from "@/lib/utils";
import {
  coerceWorkspaceToSupportedProvider,
  createWorkspaceSnapshot,
  syncProjectToWorkspace,
} from "@/lib/workspace";

export interface ModelSettings {
  provider: string;
  model: string;
  apiKey: string;
}

interface AppState {
  sessions: Session[];
  activeSessionId: string;
  isGenerating: boolean;
  streamingText: string;
  lastPrompt: string;
  runtimeError: RuntimeErrorState | null;
  modelSettings: ModelSettings | null;
  newSession: () => string;
  deleteSession: (id: string) => void;
  setActiveSessionId: (id: string) => void;
  setGenerating: (value: boolean) => void;
  setStreamingText: (value: string) => void;
  setLastPrompt: (value: string) => void;
  setRuntimeError: (value: RuntimeErrorState | null) => void;
  setModelSettings: (settings: ModelSettings | null) => void;
  setWorkspaceSnapshot: (workspace: WorkspaceSnapshot, sessionId?: string) => void;
  addMessage: (message: Message, sessionId?: string) => void;
  updateMessage: (
    messageId: string,
    updater: (message: Message) => Message,
    sessionId?: string
  ) => void;
  setCurrentProject: (project: GeneratedProject, sessionId?: string) => void;
  clearSessionMessages: (sessionId?: string) => void;
}

const createSession = (): Session => ({
  id: createId(),
  messages: [],
  currentProject: STARTER_PROJECT,
  workspace: createWorkspaceSnapshot(STARTER_PROJECT),
  createdAt: new Date().toISOString(),
});

const initialSession = createSession();

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sessions: [initialSession],
      activeSessionId: initialSession.id,
      isGenerating: false,
      streamingText: "",
      lastPrompt: "",
      runtimeError: null,
      modelSettings: null,
      newSession: () => {
        const session = createSession();
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: session.id,
          streamingText: "",
          runtimeError: null,
        }));
        return session.id;
      },
      deleteSession: (id) =>
        set((state) => {
          const remainingSessions = state.sessions.filter(
            (session) => session.id !== id
          );

          const sessions =
            remainingSessions.length > 0
              ? remainingSessions
              : [createSession()];

          const activeSessionId =
            state.activeSessionId === id
              ? sessions[0].id
              : state.activeSessionId;

          return {
            sessions,
            activeSessionId,
            streamingText: "",
            runtimeError: null,
          };
        }),
      setActiveSessionId: (id) =>
        set({
          activeSessionId: id,
          streamingText: "",
          runtimeError: null,
        }),
      setGenerating: (value) => set({ isGenerating: value }),
      setStreamingText: (value) => set({ streamingText: value }),
      setLastPrompt: (value) => set({ lastPrompt: value }),
      setRuntimeError: (value) => set({ runtimeError: value }),
      setModelSettings: (settings) => set({ modelSettings: settings }),
      setWorkspaceSnapshot: (workspace, sessionId) =>
        set((state) => {
          const targetId = sessionId ?? state.activeSessionId;
          return {
            sessions: state.sessions.map((session) =>
              session.id === targetId
                ? {
                    ...session,
                    workspace,
                    currentProject: workspace.project,
                  }
                : session
            ),
          };
        }),
      addMessage: (message, sessionId) =>
        set((state) => {
          const targetId = sessionId ?? state.activeSessionId;
          return {
            sessions: state.sessions.map((session) =>
              session.id === targetId
                ? { ...session, messages: [...session.messages, message] }
                : session
            ),
          };
        }),
      updateMessage: (messageId, updater, sessionId) =>
        set((state) => {
          const targetId = sessionId ?? state.activeSessionId;
          return {
            sessions: state.sessions.map((session) => {
              if (session.id !== targetId) {
                return session;
              }

              return {
                ...session,
                messages: session.messages.map((message) =>
                  message.id === messageId ? updater(message) : message
                ),
              };
            }),
          };
        }),
      setCurrentProject: (project, sessionId) =>
        set((state) => {
          const targetId = sessionId ?? state.activeSessionId;
          return {
            sessions: state.sessions.map((session) =>
              session.id === targetId
                ? {
                    ...session,
                    currentProject: project,
                    workspace: syncProjectToWorkspace(
                      session.workspace ?? createWorkspaceSnapshot(project),
                      project
                    ),
                  }
                : session
            ),
          };
        }),
      clearSessionMessages: (sessionId) =>
        set((state) => {
          const targetId = sessionId ?? state.activeSessionId;
          return {
            sessions: state.sessions.map((session) =>
              session.id === targetId ? { ...session, messages: [] } : session
            ),
          };
        }),
    }),
    {
      name: "lumino-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        lastPrompt: state.lastPrompt,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState> & {
          sessions?: Array<Partial<Session> & { currentCode?: unknown }>;
        };

        const sessions = Array.isArray(persisted.sessions)
          ? persisted.sessions.map((session) => {
              const migrated = migrateLegacySession(session);
              return {
                ...migrated,
                workspace: coerceWorkspaceToSupportedProvider(
                  syncProjectToWorkspace(
                    migrated.workspace ?? createWorkspaceSnapshot(migrated.currentProject),
                    migrated.currentProject
                  )
                ),
              };
            })
          : currentState.sessions;

        const activeSessionId = sessions.some(
          (session) => session.id === persisted.activeSessionId
        )
          ? (persisted.activeSessionId as string)
          : sessions[0]?.id ?? currentState.activeSessionId;

        return {
          ...currentState,
          ...persisted,
          sessions,
          activeSessionId,
        };
      },
    }
  )
);

export const getActiveSession = (state: AppState): Session => {
  return (
    state.sessions.find((session) => session.id === state.activeSessionId) ??
    state.sessions[0]
  );
};

export const getActiveSessionMessages = (state: AppState): Message[] =>
  getActiveSession(state)?.messages ?? [];

export const getActiveSessionProject = (state: AppState): GeneratedProject =>
  getActiveSession(state)?.currentProject ?? STARTER_PROJECT;

export const getActiveSessionWorkspace = (state: AppState): WorkspaceSnapshot | undefined =>
  getActiveSession(state)?.workspace;

export const getSessionById = (id: string): Session | undefined => {
  return useAppStore.getState().sessions.find((session) => session.id === id);
};

export const hasMultipleSessions = (): boolean =>
  useAppStore.getState().sessions.length > 1;

export const ensureActiveSession = (): string => {
  const state = useAppStore.getState();
  const active = getActiveSession(state);

  if (active) {
    return active.id;
  }

  return state.newSession();
};
