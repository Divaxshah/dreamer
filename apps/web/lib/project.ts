import { extractProjectEnvelope } from "@/lib/generation-stream";
import { mergeProjectWithBootstrap } from "@/lib/download-bootstrap";
import type { GeneratedProject, ProjectFileMap, Session } from "@/lib/types";

const DEFAULT_DEPENDENCIES: Record<string, string> = {
  "framer-motion": "latest",
  "lucide-react": "latest",
  "react-router-dom": "latest",
};

const STARTER_FILES: ProjectFileMap = {
  "/src/main.tsx": {
    code: `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);`,
  },
  "/src/App.tsx": {
    code: `import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { LandingPage } from "./pages/LandingPage";
import { PricingPage } from "./pages/PricingPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { WorkspacePage } from "./pages/WorkspacePage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<LandingPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="app" element={<WorkspacePage />} />
      </Route>
    </Routes>
  );
}`,
    active: true,
  },
  "/src/components/layout/AppShell.tsx": {
    code: `import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(218,164,92,0.16),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(84,122,110,0.18),_transparent_34%)]" />
      <Header />
      <main className="relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}`,
  },
  "/src/components/layout/Header.tsx": {
    code: `import { Link, NavLink } from "react-router-dom";

const links = [
  { label: "Pricing", href: "/pricing" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Studio", href: "/app" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(16,15,13,0.84)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--line-strong)] bg-[var(--panel)] shadow-[0_12px_35px_rgba(0,0,0,0.28)]">
            <span className="h-3.5 w-3.5 rounded-full bg-[var(--accent)]" />
          </span>
          <div>
            <p className="font-display text-xl tracking-[0.18em] text-[var(--text)]">WEBMAKER</p>
            <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--muted)]">Frontend foundry</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
          {links.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                isActive ? "text-[var(--text)]" : "transition hover:text-[var(--text)]"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}`,
  },
  "/src/components/layout/Footer.tsx": {
    code: `import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 px-5 py-8 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between">
        <p>Webmaker generates polished frontend projects with full file structures.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/pricing" className="transition hover:text-[var(--text)]">Pricing</Link>
          <Link to="/privacy" className="transition hover:text-[var(--text)]">Privacy</Link>
          <Link to="/terms" className="transition hover:text-[var(--text)]">Terms</Link>
        </div>
      </div>
    </footer>
  );
}`,
  },
  "/src/pages/LandingPage.tsx": {
    code: `import { ArrowRight, Layers3, Orbit, PanelsTopLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Full project output",
    detail: "Generate pages, routes, components, styles, and utility files in one pass.",
    icon: Layers3,
  },
  {
    title: "Frontend only",
    detail: "Focused on polished interfaces without backend scaffolding or API boilerplate.",
    icon: ShieldCheck,
  },
  {
    title: "Studio workflow",
    detail: "Prompt, inspect files, preview changes, and refine like a modern design IDE.",
    icon: PanelsTopLeft,
  },
];

export function LandingPage() {
  return (
    <div className="px-5 pb-16 pt-10 lg:px-8 lg:pt-16">
      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--chip)] px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-[var(--muted)]">
            <Orbit className="h-3.5 w-3.5 text-[var(--accent)]" />
            Prompt-to-product frontend studio
          </p>
          <div className="space-y-4">
            <h1 className="font-display max-w-4xl text-5xl leading-[0.96] text-[var(--text)] md:text-7xl">
              Build the whole frontend, not a single demo file.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--muted-soft)]">
              Webmaker turns one prompt into a complete React application with a landing page, app surface, policy pages, components, and styling already split into files.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/app" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--accent-strong)] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-ink)] transition hover:translate-y-[-1px]">
              Open Studio
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line-strong)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]">
              View Pricing
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--line-strong)] bg-[linear-gradient(180deg,rgba(37,33,28,0.96),rgba(20,18,15,0.98))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
          <div className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(217,173,99,0.9),transparent)]" />
          <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Conversation</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-3 text-[var(--muted-soft)]">
                  Create a luxury interior design brand site with a client portal, pricing, privacy, and terms pages.
                </div>
                <div className="rounded-2xl border border-[var(--line-strong)] bg-[var(--panel)] p-3 text-[var(--text)]">
                  Creating 14 files: routes, layout, portal dashboard, policy pages, and a design token stylesheet.
                </div>
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
                <span>Project tree</span>
                <span className="rounded-full border border-[var(--line)] bg-[var(--chip)] px-2.5 py-1 text-[10px] tracking-wider text-[var(--muted)]">Preview ready</span>
              </div>
              <div className="mt-4 space-y-2 font-mono text-xs text-[var(--muted-soft)]">
                {[
                  "src/main.tsx",
                  "src/App.tsx",
                  "src/pages/LandingPage.tsx",
                  "src/pages/AppPage.tsx",
                  "src/pages/PrivacyPage.tsx",
                  "src/components/Nav.tsx",
                  "src/styles.css",
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
              <Icon className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="mt-4 text-xl font-semibold text-[var(--text)]">{feature.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-soft)]">{feature.detail}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}`,
  },
  "/src/pages/PricingPage.tsx": {
    code: `const plans = [
  {
    name: "Starter",
    price: "$24",
    detail: "For quick landing pages and lightweight product sites.",
    features: ["10 generations", "Multi-file export", "Basic studio history"],
  },
  {
    name: "Studio",
    price: "$79",
    detail: "For agencies and founders building full frontend products.",
    features: ["Unlimited generations", "Reusable design systems", "Priority model access"],
  },
];

export function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <div className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Pricing</p>
        <h1 className="font-display mt-4 text-5xl leading-none text-[var(--text)] md:text-6xl">Pick the studio rhythm that fits your team.</h1>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <article key={plan.name} className="rounded-[2rem] border border-[var(--line-strong)] bg-[var(--panel)] p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">{plan.name}</p>
            <p className="mt-4 text-5xl font-semibold text-[var(--text)]">{plan.price}<span className="ml-2 text-base font-normal text-[var(--muted)]">/ month</span></p>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-soft)]">{plan.detail}</p>
            <ul className="mt-6 space-y-3 text-sm text-[var(--text)]">
              {plan.features.map((feature) => (
                <li key={feature} className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2">{feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}`,
  },
  "/src/pages/PrivacyPage.tsx": {
    code: `const sections = [
  {
    title: "What we store",
    body: "Prompts, generated frontend files, and session metadata are stored to keep your project history available inside the studio.",
  },
  {
    title: "What we do not do",
    body: "Webmaker is frontend-focused and does not create or host backend services for generated projects.",
  },
  {
    title: "Retention",
    body: "You can delete sessions at any time. Deleted projects are removed from your dashboard history after processing.",
  },
];

export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-14 lg:px-8 lg:py-20">
      <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Privacy policy</p>
      <h1 className="font-display mt-4 text-5xl text-[var(--text)] md:text-6xl">Your prompts stay product-focused and transparent.</h1>
      <div className="mt-10 space-y-5">
        {sections.map((section) => (
          <section key={section.title} className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
            <h2 className="text-2xl font-semibold text-[var(--text)]">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-soft)]">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}`,
  },
  "/src/pages/TermsPage.tsx": {
    code: `const terms = [
  "Generated projects are provided as editable starting points and should be reviewed before production use.",
  "You retain ownership of prompts and generated frontend code you create in the studio.",
  "Webmaker does not guarantee compliance, accessibility, or legal sufficiency without human review.",
];

export function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-14 lg:px-8 lg:py-20">
      <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Terms</p>
      <h1 className="font-display mt-4 text-5xl text-[var(--text)] md:text-6xl">Clear rules for generating frontend products.</h1>
      <div className="mt-10 space-y-3">
        {terms.map((term) => (
          <div key={term} className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-4 text-sm leading-7 text-[var(--muted-soft)]">
            {term}
          </div>
        ))}
      </div>
    </div>
  );
}`,
  },
  "/src/pages/WorkspacePage.tsx": {
    code: `import { FolderTree, Wand2 } from "lucide-react";

const files = ["src/pages/LandingPage.tsx", "src/pages/AppPage.tsx", "src/components/Nav.tsx", "src/styles.css"];

export function WorkspacePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="rounded-[2rem] border border-[var(--line-strong)] bg-[var(--panel)] p-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--chip)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
            <FolderTree className="h-3.5 w-3.5 text-[var(--accent)]" />
            Studio
          </p>
          <h1 className="mt-5 text-3xl font-semibold text-[var(--text)]">Prompt-driven workspace</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-soft)]">Inspect the files your AI build produced, preview the result, and keep refining without touching backend code.</p>
          <div className="mt-6 space-y-2">
            {files.map((file) => (
              <div key={file} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 font-mono text-xs text-[var(--muted-soft)]">
                <FolderTree className="h-3.5 w-3.5 text-[var(--accent)]" />
                {file}
              </div>
            ))}
          </div>
        </aside>
        <section className="rounded-[2rem] border border-[var(--line-strong)] bg-[linear-gradient(180deg,rgba(39,34,28,0.96),rgba(16,14,12,0.98))] p-4">
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Project brief</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">Editorial wealth app with public site and client dashboard</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--chip)] px-3 py-1.5 text-xs text-[var(--text)]">
                <Wand2 className="h-3.5 w-3.5 text-[var(--accent)]" />
                12 files generated
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.2rem] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                <p className="text-sm font-medium text-[var(--text)]">Preview panel</p>
                <div className="mt-4 rounded-[1rem] border border-white/8 bg-[linear-gradient(180deg,#f6efe5,#d8c4a8)] p-4 text-[#221d17]">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#7e6645]">Dashboard hero</p>
                  <p className="mt-3 text-2xl font-semibold">Client reporting suite</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/70 p-3">
                      <p className="text-xs text-[#7e6645]">AUM</p>
                      <p className="mt-2 text-xl font-semibold">$184M</p>
                    </div>
                    <div className="rounded-xl bg-[#231d17] p-3 text-[#f6efe5]">
                      <p className="text-xs text-[#c6ab83]">Meetings</p>
                      <p className="mt-2 text-xl font-semibold">18 this week</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--line)] bg-[var(--panel-soft)] p-4">
                <p className="text-sm font-medium text-[var(--text)]">Architecture</p>
                <ul className="mt-4 space-y-3 text-sm text-[var(--muted-soft)]">
                  <li>React Router for page-level navigation</li>
                  <li>Shared shell for public marketing and product surfaces</li>
                  <li>Single design token file for theme consistency</li>
                  <li>Frontend-only project output ready for export</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}`,
  },
  "/src/styles.css": {
    code: `:root {
  color-scheme: dark;
  --bg: #100f0d;
  --panel: rgba(30, 27, 23, 0.92);
  --panel-soft: rgba(42, 37, 31, 0.9);
  --chip: rgba(255, 255, 255, 0.06);
  --line: rgba(255, 255, 255, 0.12);
  --line-strong: rgba(208, 173, 114, 0.32);
  --text: #f5eee2;
  --muted: #c4b8a4;
  --muted-soft: #e2d9c9;
  --accent: #d9ad63;
  --accent-strong: #b27c31;
  --accent-ink: #22190f;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
  font-family: "Inter", sans-serif;
  background: var(--bg);
}

.font-display {
  font-family: "Georgia", serif;
}`,
  },
};

const DEFAULT_ENTRY = "/src/main.tsx";

interface RawProjectShape {
  title?: unknown;
  summary?: unknown;
  framework?: unknown;
  entry?: unknown;
  dependencies?: unknown;
  files?: unknown;
}

const PLACEHOLDER_FILES: ProjectFileMap = {
  "/src/main.tsx": {
    code: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  },
  "/src/App.tsx": {
    code: `export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8 text-zinc-50">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Ready to build</h1>
        <p className="max-w-sm text-zinc-400">
          Enter a prompt in the chat to generate a new multi-file application.
        </p>
      </div>
    </div>
  );
}`,
    active: true,
  },
  "/src/styles.css": {
    code: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  margin: 0;
  font-family: "Manrope", sans-serif;
}`,
  },
};

/** Full Vite/React/Tailwind shell seeded before Hermes runs (like create-vite --yes). */
export const createPlaceholderProject = (): GeneratedProject => {
  const base: GeneratedProject = {
    title: "New Workspace",
    summary: "Start prompting to generate a frontend project.",
    framework: "react-ts",
    entry: DEFAULT_ENTRY,
    dependencies: {
      react: "^18.0.0",
      "react-dom": "^18.0.0",
      "lucide-react": "latest",
      clsx: "latest",
      "tailwind-merge": "latest",
    },
    files: PLACEHOLDER_FILES,
  };

  return {
    ...base,
    files: mergeProjectWithBootstrap(base),
  };
};

export const createStarterProject = (): GeneratedProject => ({
  title: "Webmaker Starter",
  summary:
    "A multi-page frontend product with a landing page, app surface, pricing, privacy, and terms pages.",
  framework: "react-ts",
  entry: DEFAULT_ENTRY,
  dependencies: { ...DEFAULT_DEPENDENCIES },
  files: STARTER_FILES,
});

const PLACEHOLDER_APP_MARKER = "Ready to build";

export const hasScaffoldedPackageJson = (project: GeneratedProject): boolean =>
  Boolean(project.files["/package.json"]?.code?.trim());

/** Ensure Vite bootstrap files exist (upgrades legacy 3-file sessions). */
export const ensureScaffoldedProject = (project: GeneratedProject): GeneratedProject => {
  if (hasScaffoldedPackageJson(project)) {
    return project;
  }
  return {
    ...project,
    files: mergeProjectWithBootstrap(project),
  };
};

/** True when the project is still the empty shell shown before the first generation. */
export const isPlaceholderProject = (project: GeneratedProject): boolean => {
  const filePaths = Object.keys(project.files);
  if (filePaths.length === 0) {
    return true;
  }

  const appCode = project.files["/src/App.tsx"]?.code ?? "";
  return appCode.includes(PLACEHOLDER_APP_MARKER);
};

export const isProjectReadyForPreview = (project: GeneratedProject): boolean =>
  !isPlaceholderProject(project);

const ENTRY_CANDIDATES = [
  "/app/page.tsx",
  "/src/app/page.tsx",
  "/pages/index.tsx",
  "/src/App.tsx",
  "/src/main.tsx",
  "/index.html",
];

/** Pick the best editor/preview entry from scanned workspace files. */
export const resolveProjectEntry = (
  files: Record<string, { code: string }>,
  preferred?: string
): string => {
  if (preferred && files[preferred]) {
    return preferred;
  }
  for (const candidate of ENTRY_CANDIDATES) {
    if (files[candidate]) {
      return candidate;
    }
  }
  return Object.keys(files).sort()[0] || "/app/page.tsx";
};

export const normalizeProjectPath = (value: string): string => {
  const cleaned = value.replace(/\\/g, "/").trim();
  if (!cleaned) {
    return "/src/App.tsx";
  }

  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
};

/**
 * User- or model-supplied paths must never be empty (empty strings previously mapped to `/src/App.tsx`).
 */
export const requireProjectPath = (value: unknown, fieldLabel: string): string => {
  if (typeof value !== "string") {
    throw new Error(`${fieldLabel} must be a string path.`);
  }
  const cleaned = value.replace(/\\/g, "/").trim();
  if (!cleaned) {
    throw new Error(
      `${fieldLabel} must be a non-empty absolute project path (e.g. /src/App.tsx).`
    );
  }
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
};

const normalizeFileMap = (value: unknown): ProjectFileMap => {
  if (!value || typeof value !== "object") {
    return createPlaceholderProject().files;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([path, fileValue]) => {
      const normalizedPath = normalizeProjectPath(path);

      if (typeof fileValue === "string") {
        return [normalizedPath, { code: fileValue }] as const;
      }

      if (fileValue && typeof fileValue === "object" && "code" in fileValue) {
        const file = fileValue as { code?: unknown; hidden?: unknown; active?: unknown };
        return [
          normalizedPath,
          {
            code: typeof file.code === "string" ? file.code : "",
            hidden: file.hidden === true,
            active: file.active === true,
          },
        ] as const;
      }

      return null;
    })
    .filter((entry): entry is readonly [string, { code: string; hidden?: boolean; active?: boolean }] => Boolean(entry));

  if (entries.length === 0) {
    return createPlaceholderProject().files;
  }

  return Object.fromEntries(entries);
};

export const normalizeProject = (value: RawProjectShape): GeneratedProject => {
  const files = normalizeFileMap(value.files);
  const dependencies =
    value.dependencies && typeof value.dependencies === "object"
      ? Object.fromEntries(
          Object.entries(value.dependencies as Record<string, unknown>).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string"
          )
        )
      : {};

  return {
    title:
      typeof value.title === "string" && value.title.trim().length > 0
        ? value.title.trim()
        : "Untitled Webmaker Project",
    summary:
      typeof value.summary === "string" && value.summary.trim().length > 0
        ? value.summary.trim()
        : "A generated frontend application.",
    framework: "react-ts",
    entry:
      typeof value.entry === "string" && value.entry.trim().length > 0
        ? normalizeProjectPath(value.entry)
        : DEFAULT_ENTRY,
    dependencies: {
      ...DEFAULT_DEPENDENCIES,
      ...dependencies,
    },
    files,
  };
};

const stripCodeFence = (value: string): string =>
  value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

const extractJsonBlock = (value: string): string => {
  const trimmed = stripCodeFence(value);
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not contain project JSON.");
  }

  return trimmed.slice(start, end + 1);
};

export const createFallbackProject = (code: string): GeneratedProject => ({
  title: "Recovered Project",
  summary: "Fallback project recovered from a raw model response.",
  framework: "react-ts",
  entry: DEFAULT_ENTRY,
  dependencies: { ...DEFAULT_DEPENDENCIES },
  files: {
    "/src/main.tsx": {
      code: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    },
    "/src/App.tsx": {
      code,
      active: true,
    },
    "/src/styles.css": {
      code: `:root {
  color-scheme: dark;
  font-family: Inter, sans-serif;
}

body {
  margin: 0;
}`,
    },
  },
});

export const extractProjectFromResponse = (response: string): GeneratedProject => {
  const projectText = extractProjectEnvelope(response).trim();

  if (!projectText) {
    return createStarterProject();
  }

  try {
    const parsed = JSON.parse(extractJsonBlock(projectText)) as RawProjectShape;
    return normalizeProject(parsed);
  } catch {
    return createFallbackProject(projectText);
  }
};

export const serializeProjectForModel = (project: GeneratedProject): string => {
  const files = Object.fromEntries(
    Object.entries(project.files).map(([path, file]) => [path, file.code])
  );

  return JSON.stringify(
    {
      title: project.title,
      summary: project.summary,
      framework: project.framework,
      entry: project.entry,
      dependencies: project.dependencies,
      files,
    },
    null,
    2
  );
};

export const serializeProjectForDownload = (project: GeneratedProject): string =>
  JSON.stringify(
    {
      title: project.title,
      summary: project.summary,
      framework: project.framework,
      entry: project.entry,
      dependencies: project.dependencies,
      files: Object.fromEntries(
        Object.entries(project.files).map(([path, file]) => [path, file.code])
      ),
    },
    null,
    2
  );

export const getProjectFilePaths = (project: GeneratedProject): string[] =>
  Object.keys(project.files).sort((left, right) => left.localeCompare(right));

export const getProjectPrimaryFile = (project: GeneratedProject): string => {
  const active = Object.entries(project.files).find(([, file]) => file.active);
  if (active) {
    return active[0];
  }

  return resolveProjectEntry(project.files, project.entry);
};

export const projectToSandpackFiles = (
  project: GeneratedProject
): Record<string, { code: string; hidden?: boolean; active?: boolean }> =>
  Object.fromEntries(
    Object.entries(project.files).map(([path, file]) => [
      path,
      {
        code: file.code,
        hidden: file.hidden,
        active: file.active,
      },
    ])
  );

/**
 * Sandpack uses a CDN Play build of Tailwind which:
 *   ✓ auto-scans DOM for utility classes and injects them
 *   ✓ supports @layer blocks
 *   ✗ does NOT support @apply  (PostCSS-only)
 *   ✗ does NOT support @tailwind / @import "tailwindcss" / @plugin
 *
 * Strategy:
 *   1. Strip PostCSS directives that the CDN can't run.
 *   2. Resolve @apply lines into their Tailwind base classes so that rules
 *      defined via @apply don't become empty selectors.  Since we can't run
 *      PostCSS in the browser we do a best-effort class→CSS expansion using
 *      a small hard-coded map of the most common patterns.
 *   3. Unwrap @layer blocks so the rules inside are still emitted (CDN already
 *      injects its own base/components/utilities layers, so the wrappers are
 *      redundant anyway).
 */

/** Resolves a space-separated list of Tailwind class tokens to raw CSS property strings */
function applyToRawCss(classes: string): string {
  const map: Record<string, string> = {
    // colors
    "bg-white": "background-color:#fff",
    "bg-black": "background-color:#000",
    "bg-transparent": "background-color:transparent",
    // text
    "text-white": "color:#fff",
    "text-black": "color:#000",
    "text-center": "text-align:center",
    "text-left": "text-align:left",
    "text-right": "text-align:right",
    // display
    flex: "display:flex",
    "inline-flex": "display:inline-flex",
    block: "display:block",
    "inline-block": "display:inline-block",
    hidden: "display:none",
    // flex helpers
    "items-center": "align-items:center",
    "items-start": "align-items:flex-start",
    "items-end": "align-items:flex-end",
    "justify-center": "justify-content:center",
    "justify-between": "justify-content:space-between",
    "justify-end": "justify-content:flex-end",
    "flex-col": "flex-direction:column",
    "flex-row": "flex-direction:row",
    "flex-1": "flex:1 1 0%",
    "flex-wrap": "flex-wrap:wrap",
    // sizing
    "w-full": "width:100%",
    "h-full": "height:100%",
    "w-screen": "width:100vw",
    "h-screen": "height:100vh",
    "min-h-screen": "min-height:100vh",
    // font
    "font-bold": "font-weight:700",
    "font-semibold": "font-weight:600",
    "font-medium": "font-weight:500",
    "font-normal": "font-weight:400",
    // cursor
    "cursor-pointer": "cursor:pointer",
    // position
    relative: "position:relative",
    absolute: "position:absolute",
    fixed: "position:fixed",
    sticky: "position:sticky",
    // overflow
    "overflow-hidden": "overflow:hidden",
    "overflow-auto": "overflow:auto",
    // border radius
    rounded: "border-radius:0.25rem",
    "rounded-sm": "border-radius:0.125rem",
    "rounded-md": "border-radius:0.375rem",
    "rounded-lg": "border-radius:0.5rem",
    "rounded-xl": "border-radius:0.75rem",
    "rounded-2xl": "border-radius:1rem",
    "rounded-full": "border-radius:9999px",
    // transition
    transition: "transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:150ms",
  };
  return classes
    .trim()
    .split(/\s+/)
    .map((cls) => map[cls] ?? "")
    .filter(Boolean)
    .join(";");
}

function sanitizeCssForSandpack(css: string): string {
  // Unwrap @layer blocks: remove the `@layer name {` opener and matching `}`
  // while preserving the content inside.  We track brace depth per @layer line.
  const lines = css.split("\n");
  const output: string[] = [];
  let layerDepth = 0;
  let braceBalance = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // ── PostCSS-only at-rule directives ──────────────────────────────────────
    if (
      /^@tailwind\b/.test(trimmed) ||
      /^@import\s+["']tailwindcss["']/.test(trimmed) ||
      /^@plugin\b/.test(trimmed) ||
      /^@config\b/.test(trimmed)
    ) {
      output.push("");
      continue;
    }

    // ── @apply: expand to raw CSS so the rule isn't silently empty ──────────
    if (/^@apply\b/.test(trimmed)) {
      const classes = trimmed.replace(/^@apply\s+/, "").replace(/;$/, "");
      const raw = applyToRawCss(classes);
      output.push(raw ? `  ${raw};` : "");
      continue;
    }

    // ── @layer opener: track depth, emit blank so CSS stays valid ───────────
    if (/^@layer\s+\w/.test(trimmed)) {
      layerDepth++;
      braceBalance = 0;
      // Count opening braces on this line
      braceBalance += (line.match(/\{/g) ?? []).length;
      braceBalance -= (line.match(/\}/g) ?? []).length;
      output.push(""); // consume the @layer header line itself
      continue;
    }

    if (layerDepth > 0) {
      const opens = (line.match(/\{/g) ?? []).length;
      const closes = (line.match(/\}/g) ?? []).length;
      braceBalance += opens - closes;

      if (braceBalance < 0) {
        // This is the closing `}` of the @layer block
        layerDepth--;
        braceBalance = 0;
        output.push(""); // consume the closing brace
        continue;
      }
      // Emit the content inside the @layer block without the wrapper
      output.push(line);
      continue;
    }

    output.push(line);
  }

  return output.join("\n").replace(/^\n+/, "");
}

/** The /public/index.html that Sandpack injects into the preview iframe.
 *  Loads Tailwind CDN synchronously so classes are available before React mounts. */
function buildPreviewIndexHtml(title: string): string {
  const safe = title.replace(/[<>&"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] ?? c
  );
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safe}</title>
    <script>
      /* Tailwind CDN config must be set BEFORE the script loads */
      window.tailwind = { config: { darkMode: "class" } };
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>html { color-scheme: light; }</style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
}

/** Files that are for Vite/local dev only — they confuse the Sandpack bundler. */
const VITE_ONLY_PATHS = new Set([
  "/index.html",
  "/vite.config.ts",
  "/vite.config.js",
  "/tsconfig.node.json",
  "/tailwind.config.js",
  "/tailwind.config.ts",
  "/postcss.config.js",
  "/postcss.config.ts",
  "/.gitignore",
  "/README.md",
]);

/**
 * Same as projectToSandpackFiles but:
 *   - filters out Vite-only config files that break Sandpack's bundler
 *   - sanitizes every CSS file (strips unsupported PostCSS, expands @apply)
 *   - injects a /public/index.html with Tailwind CDN pre-loaded
 */
export function projectToSandpackFilesWithPreviewReset(
  project: GeneratedProject
): Record<string, { code: string; hidden?: boolean; active?: boolean }> {
  const files = projectToSandpackFiles(project);
  const result: typeof files = {};

  for (const [path, file] of Object.entries(files)) {
    if (VITE_ONLY_PATHS.has(path)) continue;

    if (path.endsWith(".css")) {
      result[path] = {
        ...file,
        code: sanitizeCssForSandpack(file.code),
      };
    } else {
      result[path] = file;
    }
  }

  // Always provide a /public/index.html so CDN loads before React
  const htmlCode = buildPreviewIndexHtml(project.title);
  result["/public/index.html"] = {
    code: htmlCode,
    hidden: true,
  };
  result["/index.html"] = {
    code: htmlCode,
    hidden: true,
  };

  return result;
}

export const migrateLegacySession = (session: Partial<Session> & { currentCode?: unknown }): Session => {
  const messages = Array.isArray(session.messages)
    ? session.messages.map((message) => ({
        ...message,
        activities: Array.isArray(message.activities) ? message.activities : [],
      }))
    : [];

  if (session.currentProject) {
    return {
      id: session.id ?? crypto.randomUUID(),
      messages,
      currentProject: ensureScaffoldedProject(
        normalizeProject(session.currentProject as RawProjectShape)
      ),
      createdAt: session.createdAt ?? new Date().toISOString(),
    };
  }

  if (typeof session.currentCode === "string") {
    return {
      id: session.id ?? crypto.randomUUID(),
      messages,
      currentProject: createFallbackProject(session.currentCode),
      createdAt: session.createdAt ?? new Date().toISOString(),
    };
  }

  return {
    id: session.id ?? crypto.randomUUID(),
    messages,
    currentProject: createPlaceholderProject(),
    createdAt: session.createdAt ?? new Date().toISOString(),
  };
};
