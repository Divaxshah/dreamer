import { NextRequest, NextResponse } from "next/server";
import { retrievePreview } from "@/lib/preview-store";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^[a-z0-9-]+$/i.test(id)) {
    return NextResponse.json({ error: "Invalid preview ID" }, { status: 400 });
  }
  const project = await retrievePreview(id);
  if (!project) {
    return NextResponse.json({ error: "Preview not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}
