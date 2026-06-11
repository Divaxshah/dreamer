import type { Metadata } from "next";
import { retrievePreview } from "@/lib/preview-store";
import type { GeneratedProject } from "@/lib/types";
import { PreviewEmbed } from "@/components/preview/PreviewEmbed";
import { ClientPreviewFallback } from "@/components/preview/ClientPreviewFallback";

interface Props {
  params: Promise<{ id: string }>;
}

function isValidProject(v: unknown): v is GeneratedProject {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.title === "string" &&
    typeof o.entry === "string" &&
    o.files != null &&
    typeof o.files === "object" &&
    !Array.isArray(o.files)
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const project = (await retrievePreview(id)) as GeneratedProject | null;
    const title = project?.title ?? "Webmaker Preview";
    return {
      title,
      description: project?.summary ?? "A shared Webmaker project preview.",
    };
  } catch {
    return { title: "Webmaker Preview", description: "A shared Webmaker project preview." };
  }
}

export default async function PreviewPage({ params }: Props) {
  let id = "";
  let project: GeneratedProject | null = null;

  try {
    const resolved = await params;
    id = typeof resolved?.id === "string" ? resolved.id : "";
    const raw = await retrievePreview(id);
    project = isValidProject(raw) ? raw : null;
  } catch {
    return <ClientPreviewFallback id={id || ""} />;
  }

  if (!project) {
    return <ClientPreviewFallback id={id} />;
  }

  try {
    return <PreviewEmbed project={project} />;
  } catch {
    return <ClientPreviewFallback id={id} />;
  }
}
