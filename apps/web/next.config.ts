import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** Absolute path to this package (`apps/web/`), not the monorepo root. */
const webmakerRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@upstash/redis"],
  turbopack: {
    root: webmakerRoot,
    resolveAlias: {
      tailwindcss: path.join(webmakerRoot, "node_modules/tailwindcss"),
      "@tailwindcss/postcss": path.join(
        webmakerRoot,
        "node_modules/@tailwindcss/postcss"
      ),
    },
  },
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.29.74"],
};

export default nextConfig;
