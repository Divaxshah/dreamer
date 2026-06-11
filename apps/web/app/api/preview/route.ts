import { NextRequest, NextResponse } from "next/server";
import { generatePreviewId, storePreview } from "@/lib/preview-store";
import type { GeneratedProject } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { project: GeneratedProject };
    if (!body.project || typeof body.project !== "object") {
      return NextResponse.json({ error: "Invalid project payload" }, { status: 400 });
    }
    const id = generatePreviewId();
    await storePreview(id, body.project);
    const origin = request.nextUrl.origin;
    return NextResponse.json({ id, url: `${origin}/preview/${id}` });
  } catch (err) {
    console.error("[preview/POST]", err);
    return NextResponse.json({ error: "Failed to save preview" }, { status: 500 });
  }
}
