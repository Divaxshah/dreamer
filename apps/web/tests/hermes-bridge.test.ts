import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeProject } from "@/lib/project";
import { parseHermesBridgeLine } from "@/lib/hermes-bridge";

describe("Hermes workspace project scan", () => {
  it("normalizes generated file maps", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "webmaker-hermes-"));
    await writeFile(path.join(root, "example.txt"), "hello", "utf8");

    const project = normalizeProject({
      title: "Hermes",
      summary: "Bridge project",
      framework: "nextjs",
      entry: "/src/app/page.tsx",
      files: {
        "/src/app/page.tsx": "export default function Page() { return <main /> }",
      },
    });

    expect(project.files["/src/app/page.tsx"]?.code).toContain("Page");
    expect(project.entry).toBe("/src/app/page.tsx");
  });
});

describe("Hermes bridge NDJSON parser", () => {
  it("ignores Hermes stdout warnings that are not JSON", () => {
    expect(parseHermesBridgeLine("⚠️  API cache warning")).toBeNull();
    expect(parseHermesBridgeLine("{bad json")).toBeNull();
    expect(parseHermesBridgeLine('{"type":"delta","tail":"ok"}')).toEqual({
      type: "delta",
      tail: "ok",
    });
  });
});
