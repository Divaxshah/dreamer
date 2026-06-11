import type { Metadata } from "next";
import { StudioPage } from "@/components/studio/StudioPage";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Prompt, inspect, and preview full frontend projects inside the Webmaker studio.",
};

export default function StudioRoute() {
  return <StudioPage />;
}
