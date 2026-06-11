"use client";

import { Plus, Trash2, FolderTree } from "lucide-react";
import type { Session } from "@/lib/types";

interface SessionStripProps {
  sessions: Session[];
  activeSessionId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewSession: () => void;
}

const getLabel = (session: Session): string => {
  const firstUserMessage = session.messages.find((message) => message.role === "user");
  return firstUserMessage?.content ?? session.currentProject.title;
};

export function SessionStrip({
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
  onNewSession,
}: SessionStripProps) {
  return (
    <div className="border-b border-[var(--wm-border)] px-3 py-3 xl:hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--wm-muted)]">
          Sessions
        </p>
        <button
          type="button"
          onClick={onNewSession}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--wm-text)]"
        >
          <Plus size={14} className="text-[var(--wm-accent)]" />
          New
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <div
              key={session.id}
              className={`min-w-[240px] border-l pl-3 ${
                isActive ? "border-[var(--wm-accent)]" : "border-[var(--wm-border)]"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(session.id)}
                className="block w-full text-left"
              >
                <div className="flex items-center gap-2">
                  {isActive && <FolderTree size={13} className="text-foreground" />}
                  <p className="truncate text-sm font-semibold text-[var(--wm-text)]">
                    {session.currentProject.title}
                  </p>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--wm-muted)]">
                  {getLabel(session)}
                </p>
              </button>
              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDelete(session.id)}
                  className="mt-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--wm-muted)] transition hover:text-[var(--wm-text)]"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
