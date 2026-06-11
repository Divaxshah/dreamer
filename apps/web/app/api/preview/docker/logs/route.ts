import { NextRequest } from "next/server";
import { streamDockerPreviewLogs } from "@/lib/podman-preview";

export const runtime = "nodejs";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId")?.trim();
  if (!workspaceId) {
    return new Response("Missing workspaceId", { status: 400 });
  }

  const encoder = new TextEncoder();
  let detach: (() => void) | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const attach = async (): Promise<boolean> => {
        try {
          detach?.();
          detach = await streamDockerPreviewLogs(workspaceId, (chunk) => {
            const lines = chunk.split(/\r?\n/).filter(Boolean);
            for (const line of lines) {
              send({ line });
            }
          });
          send({ ready: true });
          return true;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to stream logs.";
          if (
            message.includes("No active Docker preview") ||
            message.includes("No active Podman preview")
          ) {
            return false;
          }
          send({ error: message });
          return true;
        }
      };

      for (let attempt = 0; attempt < 90 && !closed; attempt++) {
        const attached = await attach();
        if (attached) return;
        await sleep(1_000);
      }

      if (!closed) {
        send({ error: "Preview container not ready yet. Open the Preview tab first." });
        controller.close();
      }
    },
    cancel() {
      closed = true;
      detach?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
