import { NextRequest, NextResponse } from "next/server";
import {
  isDockerAvailable,
  startDockerPreview,
  stopDockerPreview,
  touchDockerPreviewActivity,
} from "@/lib/podman-preview";
import type { GeneratedProject } from "@/lib/types";

export const runtime = "nodejs";

const isGeneratedProject = (value: unknown): value is GeneratedProject => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.title === "string" &&
    typeof record.entry === "string" &&
    record.files != null &&
    typeof record.files === "object" &&
    !Array.isArray(record.files)
  );
};

export async function GET() {
  const available = await isDockerAvailable();
  return NextResponse.json({
    available,
    image:
      process.env.WEBMAKER_PREVIEW_IMAGE?.trim() ||
      process.env.WEBMAKER_DOCKER_IMAGE?.trim() ||
      "node:20-alpine",
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isDockerAvailable())) {
      return NextResponse.json(
        {
          error:
            "Podman is not available. Install Podman and ensure `podman info` succeeds.",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      project?: GeneratedProject;
      workspaceId?: string;
      force?: boolean;
    };

    const workspaceId =
      typeof body.workspaceId === "string" && body.workspaceId.trim()
        ? body.workspaceId.trim()
        : "default";

    const session = await startDockerPreview(workspaceId, {
      force: body.force === true,
      project: isGeneratedProject(body.project) ? body.project : undefined,
    });

    touchDockerPreviewActivity(workspaceId);
    return NextResponse.json(session);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start Podman preview.";
    console.error("[preview/docker:POST]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      workspaceId?: string;
    };
    const workspaceId =
      typeof body.workspaceId === "string" && body.workspaceId.trim()
        ? body.workspaceId.trim()
        : "default";

    await stopDockerPreview(workspaceId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to stop Podman preview.";
    console.error("[preview/docker:DELETE]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
