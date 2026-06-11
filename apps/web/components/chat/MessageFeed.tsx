"use client";

import { ActivityGroup } from "@/components/chat/ActivityGroup";
import { SuggestionGrid } from "@/components/chat/SuggestionGrid";
import type { Message } from "@/lib/types";

interface MessageFeedProps {
  messages: Message[];
  streamingText: string;
  onSuggestionPick: (prompt: string) => void;
}

interface Activity {
  user: Message;
  assistant?: Message;
}

const buildActivities = (messages: Message[]): Activity[] => {
  const activities: Activity[] = [];

  for (const message of messages) {
    if (message.role === "user") {
      activities.push({ user: message });
      continue;
    }

    const latest = activities[activities.length - 1];
    if (latest && !latest.assistant) {
      latest.assistant = message;
    }
  }

  return activities;
};

export function MessageFeed({
  messages,
  streamingText,
  onSuggestionPick,
}: MessageFeedProps) {
  const activities = buildActivities(messages);

  if (activities.length === 0) {
    return (
      <div className="flex min-w-0 flex-col gap-10 pb-6 overflow-hidden">
        <div className="min-w-0">
          <h2 className="font-display text-5xl tracking-tight font-bold text-foreground leading-none mb-4">
            Initialize <span className="text-primary italic">Sequence.</span>
          </h2>
          <p className="text-base text-muted-foreground font-medium leading-relaxed max-w-sm break-words">
            Describe the interface you want to generate. Be specific about components, aesthetics, and user flows.
          </p>
        </div>
        <SuggestionGrid onPick={onSuggestionPick} />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6 pb-4 overflow-hidden">
      {activities.map((activity, index) => (
        <ActivityGroup
          key={activity.user.id}
          userMessage={activity.user}
          assistantMessage={activity.assistant}
          streamingText={streamingText}
          isLatest={index === activities.length - 1}
        />
      ))}
    </div>
  );
}
