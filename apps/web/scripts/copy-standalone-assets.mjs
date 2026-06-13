import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.log("[standalone-assets] No standalone output found; skipping.");
  process.exit(0);
}

await mkdir(path.join(standalone, ".next"), { recursive: true });

const staticSource = path.join(root, ".next", "static");
if (existsSync(staticSource)) {
  await cp(staticSource, path.join(standalone, ".next", "static"), {
    recursive: true,
    force: true,
  });
}

const publicSource = path.join(root, "public");
if (existsSync(publicSource)) {
  await cp(publicSource, path.join(standalone, "public"), {
    recursive: true,
    force: true,
  });
}

console.log("[standalone-assets] Copied static assets for standalone server.");
