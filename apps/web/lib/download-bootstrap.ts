import type { GeneratedProject, ProjectFileMap } from "./types";

const BASE_DEPS: Record<string, string> = {
  react: "^18.2.0",
  "react-dom": "^18.2.0",
};

const DEV_DEPS: Record<string, string> = {
  "@types/react": "^19.0.8",
  "@types/react-dom": "^19.0.3",
  "@vitejs/plugin-react": "^4.3.4",
  autoprefixer: "10.4.20",
  postcss: "8.4.49",
  tailwindcss: "3.4.15",
  typescript: "^5.4.5",
  vite: "4.2.0",
};

const PINNED_DEPENDENCY_VERSIONS: Record<string, string> = {
  "framer-motion": "^11.0.0",
  "lucide-react": "^0.460.0",
  "react-router-dom": "^6.28.0",
  clsx: "^2.1.1",
  "tailwind-merge": "^2.5.4",
};

export const normalizeDependencyVersion = (name: string, version: string): string => {
  if (version === "latest") {
    return PINNED_DEPENDENCY_VERSIONS[name] ?? "^18.0.0";
  }
  return version;
};

/** Pin package.json for container preview (no `latest`, stable React + Vite). */
export const pinPackageJsonForPreview = (raw: string): string => {
  try {
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const pin = (deps?: Record<string, string>) => {
      if (!deps) return;
      for (const [name, version] of Object.entries(deps)) {
        deps[name] = normalizeDependencyVersion(name, version);
      }
      if (deps.react) deps.react = "^18.2.0";
      if (deps["react-dom"]) deps["react-dom"] = "^18.2.0";
    };

    pin(pkg.dependencies);
    pin(pkg.devDependencies);

    if (pkg.devDependencies?.vite) {
      pkg.devDependencies.vite = DEV_DEPS.vite;
    }
    if (pkg.devDependencies?.["@vitejs/plugin-react"]) {
      pkg.devDependencies["@vitejs/plugin-react"] = DEV_DEPS["@vitejs/plugin-react"];
    }
    if (pkg.devDependencies?.typescript) {
      pkg.devDependencies.typescript = DEV_DEPS.typescript;
    }

    return JSON.stringify(pkg, null, 2);
  } catch {
    return raw;
  }
};

/**
 * Returns the set of config/setup files required to run a downloaded project
 * locally (npm install && npm run dev) or build for deploy.
 */
export function getBootstrapFiles(project: GeneratedProject): Record<string, string> {
  const name = project.title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") || "webmaker-project";

  const dependencies = Object.fromEntries(
    Object.entries({
      ...BASE_DEPS,
      ...project.dependencies,
    }).map(([name, version]) => [name, normalizeDependencyVersion(name, version)])
  );

  const packageJson = JSON.stringify(
    {
      name,
      private: true,
      version: "0.0.1",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview",
      },
      dependencies: Object.fromEntries(
        Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b))
      ),
      devDependencies: DEV_DEPS,
    },
    null,
    2
  );

  const entryPath = project.entry.replace(/^\//, "");

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(project.title)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${entryPath}"></script>
  </body>
</html>
`;

  const viteConfigJs = `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: { host: true },
});
`;

  const tsconfigJson = JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
      },
      include: ["src"],
    },
    null,
    2
  );

  const tailwindConfigJs = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;

  const postcssConfigJs = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

  const gitignore = `# Dependencies
node_modules/

# Build
dist/
*.local

# Logs
*.log
npm-debug.log*

# Editor
.vscode/*
!.vscode/extensions.json

# OS
.DS_Store
Thumbs.db
`;

  const viteEnvDts = `/// <reference types="vite/client" />
`;

  const readme = `# ${escapeHtml(project.title)}

${project.summary || "A frontend application generated with Webmaker."}

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for production

\`\`\`bash
npm run build
npm run preview
\`\`\`

The built site is in \`dist/\`. Deploy that folder to any static host (Vercel, Netlify, GitHub Pages, etc.).
`;

  return {
    "package.json": packageJson,
    "index.html": indexHtml,
    "vite.config.js": viteConfigJs,
    "tsconfig.json": tsconfigJson,
    "tailwind.config.js": tailwindConfigJs,
    "postcss.config.js": postcssConfigJs,
    "src/vite-env.d.ts": viteEnvDts,
    ".gitignore": gitignore,
    "README.md": readme,
  };
}

const normalizeBootstrapPath = (path: string): string =>
  path.startsWith("/") ? path : `/${path}`;

/**
 * Merge Vite/Tailwind bootstrap files into a project file map.
 * Source files in `project.files` win over bootstrap defaults.
 */
export function mergeProjectWithBootstrap(project: GeneratedProject): ProjectFileMap {
  const bootstrap = getBootstrapFiles(project);
  const merged: ProjectFileMap = Object.fromEntries(
    Object.entries(bootstrap).map(([path, code]) => [
      normalizeBootstrapPath(path),
      { code },
    ])
  );

  for (const [path, file] of Object.entries(project.files)) {
    merged[normalizeBootstrapPath(path)] = file;
  }

  return merged;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
