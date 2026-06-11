import type {
  AgentActivity,
  AgentActivityKind,
  AgentActivityStatus,
  GeneratedProject,
} from "@/lib/types";

const STEP_BLOCK_PATTERN = /<agent:step>\s*([\s\S]*?)\s*<\/agent:step>/g;
const PROJECT_BLOCK_PATTERN = /<agent:project>\s*([\s\S]*?)\s*<\/agent:project>/;

interface RawAgentActivity {
  id?: unknown;
  kind?: unknown;
  status?: unknown;
  title?: unknown;
  detail?: unknown;
  tool?: unknown;
  targets?: unknown;
}

export type GenerationStreamEvent =
  | {
      type: "delta";
      tail: string;
      tokenCount: number;
    }
  | {
      type: "activity";
      activity: AgentActivity;
    }
  | {
      type: "project";
      project: GeneratedProject;
    }
  | {
      type: "complete";
      project: GeneratedProject;
      summary: string;
      tokenCount: number;
    }
  | {
      type: "aborted";
      project: GeneratedProject;
      summary: string;
      tokenCount: number;
    };

const ACTIVITY_KINDS: AgentActivityKind[] = [
  "plan",
  "inspect",
  "search",
  "read",
  "edit",
  "create",
  "patch",
  "delete",
  "rename",
  "verify",
  "complete",
];

const ACTIVITY_STATUSES: AgentActivityStatus[] = [
  "pending",
  "active",
  "completed",
  "error",
];

const normalizeKind = (value: unknown): AgentActivityKind => {
  return typeof value === "string" && ACTIVITY_KINDS.includes(value as AgentActivityKind)
    ? (value as AgentActivityKind)
    : "plan";
};

const normalizeStatus = (value: unknown): AgentActivityStatus => {
  return typeof value === "string" &&
    ACTIVITY_STATUSES.includes(value as AgentActivityStatus)
    ? (value as AgentActivityStatus)
    : "completed";
};

const normalizeTargets = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const targets = value.filter((item): item is string => typeof item === "string");
  return targets.length > 0 ? targets : undefined;
};

const normalizeActivity = (
  value: RawAgentActivity,
  index: number
): AgentActivity | null => {
  if (typeof value.title !== "string" || typeof value.detail !== "string") {
    return null;
  }

  return {
    id:
      typeof value.id === "string" && value.id.trim().length > 0
        ? value.id.trim()
        : `activity-${index + 1}`,
    kind: normalizeKind(value.kind),
    status: normalizeStatus(value.status),
    title: value.title.trim(),
    detail: value.detail.trim(),
    tool:
      typeof value.tool === "string" && value.tool.trim().length > 0
        ? value.tool.trim()
        : undefined,
    targets: normalizeTargets(value.targets),
  };
};

export const extractAgentActivities = (response: string): AgentActivity[] => {
  const activities: AgentActivity[] = [];
  const matches = response.matchAll(STEP_BLOCK_PATTERN);

  for (const [index, match] of Array.from(matches).entries()) {
    try {
      const parsed = JSON.parse(match[1].trim()) as RawAgentActivity;
      const activity = normalizeActivity(parsed, index);

      if (activity) {
        activities.push(activity);
      }
    } catch {
      continue;
    }
  }

  return activities;
};

export const extractProjectEnvelope = (response: string): string => {
  const match = response.match(PROJECT_BLOCK_PATTERN);
  return match?.[1]?.trim() ?? response;
};

export const buildFallbackActivities = (): AgentActivity[] => {
  return [
    {
      id: "plan-request",
      kind: "plan",
      status: "completed",
      title: "Interpret frontend request",
      detail: "Translate the prompt into a frontend-only build or edit plan.",
      tool: "hermes.plan",
    },
    {
      id: "inspect-project",
      kind: "inspect",
      status: "completed",
      title: "Inspect project shape",
      detail: "Review routes, components, and styling before changing files.",
      tool: "hermes.inspect",
    },
    {
      id: "edit-project",
      kind: "edit",
      status: "completed",
      title: "Apply file edits",
      detail: "Update the generated project files to match the latest request.",
      tool: "hermes.edit",
    },
    {
      id: "verify-project",
      kind: "verify",
      status: "completed",
      title: "Verify frontend output",
      detail: "Check imports, routes, and the final project structure for consistency.",
      tool: "hermes.verify",
    },
  ];
};
