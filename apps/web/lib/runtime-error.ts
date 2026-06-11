import type { RuntimeErrorState } from "@/lib/types";

interface NormalizeRuntimeErrorInput {
  message: string;
  code: string;
}

const FILE_LOCATION_PATTERN =
  /(\/[^:\s)\]]+\.(?:tsx?|jsx?|js|css|scss|sass)):(\d+):(\d+)/i;
const FILE_PATH_PATTERN =
  /(\/[^:\s)\]]+\.(?:tsx?|jsx?|js|css|scss|sass))/i;

const toNumber = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const detectSource = (message: string): RuntimeErrorState["source"] => {
  const lowered = message.toLowerCase();

  if (
    lowered.includes("failed to compile") ||
    lowered.includes("syntaxerror") ||
    lowered.includes("transform failed") ||
    lowered.includes("unexpected token") ||
    lowered.includes("cannot find module")
  ) {
    return "compile";
  }

  if (lowered.includes("error")) {
    return "runtime";
  }

  return "unknown";
};

const extractFileMetadata = (message: string, code: string) => {
  const locationMatch = message.match(FILE_LOCATION_PATTERN);

  if (locationMatch) {
    return {
      filePath: locationMatch[1],
      line: toNumber(locationMatch[2]),
      column: toNumber(locationMatch[3]),
    };
  }

  const filePath = message.match(FILE_PATH_PATTERN)?.[1] ?? code.match(FILE_PATH_PATTERN)?.[1];

  return {
    filePath,
    line: undefined,
    column: undefined,
  };
};

const buildPrompt = ({
  message,
  code,
  filePath,
  line,
  column,
}: {
  message: string;
  code: string;
  filePath?: string;
  line?: number;
  column?: number;
}) => {
  const location = filePath
    ? `${filePath}${line ? `:${line}${column ? `:${column}` : ""}` : ""}`
    : "unknown file";

  const snippet = code.trim().slice(0, 2400);

  return [
    "Fix this generated frontend error and preserve the rest of the project.",
    `Error location: ${location}`,
    `Error message: ${message}`,
    snippet ? `Relevant file contents:\n${snippet}` : "",
    "Return the full corrected project.",
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const normalizeRuntimeError = ({
  message,
  code,
}: NormalizeRuntimeErrorInput): RuntimeErrorState => {
  const cleanMessage = message.trim() || "Unknown runtime error";
  const metadata = extractFileMetadata(cleanMessage, code);

  return {
    source: detectSource(cleanMessage),
    message: cleanMessage,
    code,
    filePath: metadata.filePath,
    line: metadata.line,
    column: metadata.column,
    prompt: buildPrompt({
      message: cleanMessage,
      code,
      filePath: metadata.filePath,
      line: metadata.line,
      column: metadata.column,
    }),
    timestamp: Date.now(),
  };
};
