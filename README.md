# Dreamer

AI-powered web app builder. Describe what you want, get a live, editable app — instantly.

Built on [Hermes](https://github.com/Divaxshah/hermes-agent) for AI generation and Podman for isolated live previews.

```
apps/web          Next.js 16 studio UI + preview API
agent/            Hermes Python agent (AI generation backend)
preview-router/   Reverse proxy for *.preview.<domain> subdomains
```

---

## Prerequisites

You need four things before the monorepo scripts will work:

- **Node.js** 20+
- **Python** 3.11–3.13
- **uv** (Python package manager)
- **Podman** (container runtime for live previews)

### Install Node.js

Use [nvm](https://github.com/nvm-sh/nvm) or download from [nodejs.org](https://nodejs.org).

```bash
# Verify
node --version   # should print v20.x or higher
```

### Install uv

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Verify
uv --version
```

### Install Podman

Podman replaces Docker — no daemon, no root, same container images.

<details>
<summary><strong>macOS</strong></summary>

```bash
# Install via Homebrew
brew install podman

# Initialize and start the Podman VM (required on macOS — containers run in a Linux VM)
podman machine init
podman machine start

# Verify
podman info
```

To start the VM automatically on login:
```bash
podman machine set --rootful=false
# The machine auto-starts on next login once initialized
```

</details>

<details>
<summary><strong>Linux (Ubuntu / Debian)</strong></summary>

```bash
sudo apt-get update
sudo apt-get install -y podman

# Enable rootless Podman for your user (allows containers without sudo)
# This is required — Dreamer runs containers as your normal user
loginctl enable-linger $USER

# Verify
podman info
```

On Ubuntu 22.04+ Podman is in the default repos. For older versions add the Kubic repo:
```bash
# Ubuntu 20.04 only
. /etc/os-release
echo "deb https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_${VERSION_ID}/ /" \
  | sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list
curl -L "https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_${VERSION_ID}/Release.key" \
  | sudo apt-key add -
sudo apt-get update && sudo apt-get install -y podman
```

</details>

<details>
<summary><strong>Linux (Fedora / RHEL / CentOS)</strong></summary>

```bash
# Podman is installed by default on Fedora 31+
# If not present:
sudo dnf install -y podman

loginctl enable-linger $USER

podman info
```

</details>

<details>
<summary><strong>Windows</strong></summary>

**Option A — Podman Desktop (recommended, includes GUI)**

1. Download the installer from [podman-desktop.io](https://podman-desktop.io/downloads)
2. Run the `.exe` and follow the wizard
3. Podman Desktop installs Podman CLI + a WSL2-backed Linux VM automatically
4. Open a new terminal and verify:

```powershell
podman info
```

**Option B — Podman CLI only (via winget)**

```powershell
winget install RedHat.Podman

# After install, initialize the Podman machine
podman machine init
podman machine start

podman info
```

> **Note:** On Windows, Dreamer's preview containers run inside a WSL2 VM. WSL2 must be enabled (`wsl --install` in an admin PowerShell if it isn't). The `npm run dev` command works from either PowerShell or WSL2 terminal.

</details>

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/Divaxshah/dreamer.git
cd dreamer

# Install all dependencies (web + preview-router)
npm run web:install

# Install Python agent dependencies
npm run agent:install

# Build the sandboxed Hermes bridge image used by Webmaker
npm run hermes:image
```

### 2. Configure environment

```bash
cp apps/web/.env.example apps/web/.env.local
```

Open `apps/web/.env.local` and fill in:

```bash
# ── Agent ──────────────────────────────────────────────────────────
# Leave as-is if you cloned the monorepo — defaults point to ../../agent
WEBMAKER_HERMES_PATH=../../agent
WEBMAKER_HERMES_PYTHON=../../agent/.venv/bin/python

# ── LLM Provider ───────────────────────────────────────────────────
# Pick one. OpenRouter gives you access to all models with one key.
# Get a key at https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-...

# Or use a direct provider:
# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...
# GOOGLE_API_KEY=...

# ── Preview ────────────────────────────────────────────────────────
# Domain for live previews. Leave as-is for local dev with dnsmasq (see below).
WEBMAKER_PREVIEW_DOMAIN=preview.localhost
WEBMAKER_APP_DOMAIN=app.localhost

# ── Optional: Upstash Redis ────────────────────────────────────────
# Only needed for shared preview links and cross-restart session sync.
# Leave blank to skip.
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
```

### 3. Pull the preview container image

Dreamer runs generated apps in a `node:20-alpine` container. Pull it once so the first preview doesn't have to download it:

```bash
podman pull node:20-alpine
```

### 4. Set up wildcard DNS for local previews

Each live preview gets a subdomain like `ws-abc123.preview.localhost`. Your machine needs to resolve `*.preview.localhost` to `127.0.0.1`.

**Option A — dnsmasq (recommended, zero maintenance)**

<details>
<summary>macOS</summary>

```bash
brew install dnsmasq

# Add wildcard rule
echo "address=/.preview.localhost/127.0.0.1" >> $(brew --prefix)/etc/dnsmasq.conf
echo "address=/.app.localhost/127.0.0.1"     >> $(brew --prefix)/etc/dnsmasq.conf

# Start dnsmasq
sudo brew services start dnsmasq

# Tell macOS to use dnsmasq for .localhost domains
sudo mkdir -p /etc/resolver
echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/localhost

# Verify
ping -c1 ws-anything.preview.localhost   # should resolve to 127.0.0.1
```

</details>

<details>
<summary>Linux (Ubuntu / Debian)</summary>

```bash
sudo apt-get install -y dnsmasq

# Add wildcard rules
echo "address=/.preview.localhost/127.0.0.1" | sudo tee -a /etc/dnsmasq.conf
echo "address=/.app.localhost/127.0.0.1"     | sudo tee -a /etc/dnsmasq.conf

# If systemd-resolved is running (Ubuntu 18.04+), configure it to use dnsmasq
# for .localhost:
sudo mkdir -p /etc/systemd/resolved.conf.d
cat <<EOF | sudo tee /etc/systemd/resolved.conf.d/dnsmasq.conf
[Resolve]
DNS=127.0.0.1
Domains=~preview.localhost ~app.localhost
EOF

sudo systemctl restart dnsmasq
sudo systemctl restart systemd-resolved

# Verify
ping -c1 ws-anything.preview.localhost
```

</details>

<details>
<summary>Windows</summary>

Windows doesn't have dnsmasq. Add specific entries to `C:\Windows\System32\drivers\etc\hosts` as you create new sessions — or use the `/etc/hosts` approach in WSL2:

```
127.0.0.1   app.localhost
127.0.0.1   ws-abc123.preview.localhost
```

You only need one entry per active session, and sessions reuse IDs across restarts. For a smoother experience, consider using [Acrylic DNS Proxy](https://mayakron.altervista.org/support/acrylic/) which supports wildcards on Windows.

</details>

**Option B — `/etc/hosts` per session (quick and dirty)**

No install needed. Just add entries as you test:

```
127.0.0.1   app.localhost
127.0.0.1   ws-abc123.preview.localhost
127.0.0.1   ws-def456.preview.localhost
```

The workspace ID is shown in the UI when a preview starts.

### 5. Run

```bash
npm run dev
```

This starts three processes in parallel:
- `apps/web` — Next.js on `http://localhost:3000` (or `http://app.localhost` with dnsmasq)
- `preview-router` — subdomain proxy on port `4999`
- Caddy is not needed locally — the preview router handles routing directly

Open [http://localhost:3000](http://localhost:3000) and start building.

---

## How previews work

When you generate an app, Dreamer:

1. Writes the generated files to `apps/web/.webmaker/workspaces/<session-id>/`
2. Spins up a rootless Podman container mounting that directory
3. Runs `npm install && npm run dev` inside the container (Vite on port 5173)
4. Registers the container's host port with the preview router
5. Returns `https://ws-<id>.preview.localhost` as the preview URL
6. Iframes that URL in the studio panel

When you edit, Hermes writes updated files to the same workspace directory. Vite's HMR picks up the changes through the volume mount — no container restart needed.

Containers are stopped automatically after 30 minutes of inactivity and respawned on demand (with `node_modules` cached so restarts take ~3 seconds instead of ~20).

---

## Project structure

```
dreamer/
├── apps/
│   └── web/                    Next.js studio UI
│       ├── app/                App router pages and API routes
│       │   └── api/
│       │       ├── generate/   Streaming generation endpoint
│       │       └── preview/    Podman container lifecycle
│       ├── components/         React components
│       │   └── preview/        Preview panel, code viewer, console
│       ├── lib/
│       │   ├── hermes-bridge.ts  Spawns the Python agent subprocess
│       │   ├── podman-preview.ts Container lifecycle (start/stop/logs)
│       │   └── store.ts          Zustand state
│       └── .env.example
│
├── agent/                      Hermes Python agent
│   ├── webmaker_bridge.py      Entry point — reads JSON from stdin, streams NDJSON to stdout
│   ├── run_agent.py            AIAgent runner
│   ├── agent/                  Core agent modules
│   ├── skills/
│   │   └── software-development/
│   │       └── frontend-design/  Preloaded for every generation
│   └── pyproject.toml
│
├── preview-router/             Subdomain → container port proxy
│   └── index.js                Node.js HTTP + WebSocket proxy (port 4999)
│
├── Caddyfile                   Reverse proxy config (used in production)
├── ecosystem.config.js         PM2 process config (used in production)
└── package.json                Monorepo scripts
```

---

## Environment variables reference

All variables live in `apps/web/.env.local`. None are required to just run — sensible defaults are used where possible.

| Variable | Default | Description |
|---|---|---|
| `WEBMAKER_HERMES_PATH` | `../../agent` | Path to the agent directory |
| `WEBMAKER_HERMES_PYTHON` | `../../agent/.venv/bin/python` | Python executable inside the agent venv |
| `WEBMAKER_HERMES_HOME` | _(Hermes default)_ | Hermes config home (`~/.hermes` if unset) |
| `WEBMAKER_PREVIEW_DOMAIN` | `preview.localhost` | Subdomain base for live previews |
| `WEBMAKER_APP_DOMAIN` | `app.localhost` | Domain for the studio UI |
| `WEBMAKER_WORKSPACE_ROOT` | `.webmaker/workspaces` | Where workspace files are stored |
| `WEBMAKER_DOCKER_IMAGE` | `node:20-alpine` | Container image for previews |
| `PREVIEW_ROUTER_IPC_URL` | `http://127.0.0.1:4998` | Internal IPC between web app and preview router |
| `OPENROUTER_API_KEY` | — | OpenRouter API key (recommended) |
| `UPSTASH_REDIS_REST_URL` | — | Optional: Upstash Redis for session persistence |
| `UPSTASH_REDIS_REST_TOKEN` | — | Optional: Upstash Redis token |

---

## Production Deployment

Dreamer production uses Caddy in front of the Next.js app and preview router:

```text
Cloudflare -> Caddy :80
  app.kreativespace.com        -> Next.js :3000
  *.preview.kreativespace.com  -> preview-router :4999 -> Podman preview port

Next.js /api/generate       -> sandboxed Hermes Podman image
Next.js /api/preview/docker -> rootless Podman Vite containers
```

On EC2:

```bash
cd /home/ubuntu/dreamer
./deploy/setup-ec2.sh

npm run web:install
npm run router:install
npm run agent:install
npm run hermes:image
npm run build
```

The production build script copies `.next/static` and `public` into
`.next/standalone` so the standalone server can serve CSS, JS, fonts, and
favicon assets.

Create `/home/ubuntu/dreamer/apps/web/.env.local`:

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.kreativespace.com

WEBMAKER_HERMES_RUNNER=podman
WEBMAKER_HERMES_IMAGE=dreamer-hermes:local
WEBMAKER_HERMES_PATH=/home/ubuntu/dreamer/agent
WEBMAKER_HERMES_PYTHON=/home/ubuntu/dreamer/agent/.venv/bin/python
WEBMAKER_HERMES_HOME=/home/ubuntu/.hermes

WEBMAKER_WORKSPACE_ROOT=/home/ubuntu/.webmaker/workspaces
WEBMAKER_PREVIEW_IMAGE=node:20-alpine

WEBMAKER_APP_DOMAIN=app.kreativespace.com
WEBMAKER_PREVIEW_DOMAIN=preview.kreativespace.com
WEBMAKER_PREVIEW_PROTOCOL=https
WEBMAKER_PREVIEW_PUBLIC_PORT=
PREVIEW_ROUTER_IPC_URL=http://127.0.0.1:4998
```

Set the preview-router domain in `ecosystem.config.js`:

```js
WEBMAKER_PREVIEW_DOMAIN: "preview.kreativespace.com"
```

Add proxied Cloudflare DNS records:

```text
A  app        <EC2 IPv4>
A  *.preview  <EC2 IPv4>
```

Enable **WebSockets** in Cloudflare. For the simplest setup, set Cloudflare
SSL/TLS mode to **Flexible**, because the included Caddy config serves HTTP on
the EC2 origin. For stricter origin TLS, install a Cloudflare Origin Certificate
covering `app.kreativespace.com` and `*.preview.kreativespace.com`, then
configure Caddy with that certificate.

Install/reload Caddy and start PM2:

```bash
sudo cp /home/ubuntu/dreamer/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy

pm2 start ecosystem.config.js
pm2 save
```

Verify:

```bash
curl -s http://127.0.0.1:3000/api/health | python3 -m json.tool
curl -s http://127.0.0.1:3000/api/preview/docker
curl -s http://127.0.0.1:4998/ports | python3 -m json.tool
```

Detailed EC2 notes live in [`apps/web/deploy.md`](apps/web/deploy.md).

---

## Troubleshooting

**`podman: command not found`**
Podman isn't installed or isn't on your PATH. Follow the install steps above for your platform. On macOS make sure the Podman machine is running (`podman machine start`).

**Preview iframe shows "Session not found"**
The preview router doesn't know about this workspace yet. This usually means the container failed to start. Check logs:
```bash
# In apps/web directory
podman ps --filter label=webmaker.preview=true
podman logs preview-<workspace-id>
```

**`*.preview.localhost` doesn't resolve**
The wildcard DNS isn't set up. Either install dnsmasq (see above) or add the specific workspace ID to `/etc/hosts` manually.

**`npm run agent:install` fails with Python version error**
The agent requires Python 3.11–3.13. Check your version with `python3 --version`. Use `uv python install 3.11` to install a compatible version.

**Vite HMR doesn't update the preview after file changes**
WebSocket proxying may not be enabled. On Cloudflare, go to Network → WebSockets → On. Locally, make sure the preview-router process is running (`npm run dev` starts it automatically).

**Container keeps restarting / OOM killed**
You're likely low on RAM. Each container needs ~300MB. On a machine with less than 2GB free, reduce `MAX_CONCURRENT_CONTAINERS` in `apps/web/lib/podman-preview.ts` (default: 10) and add swap:
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
```

---

## Contributing

PRs welcome. Open an issue first for anything beyond a small bugfix.

```bash
# Run tests
npm run web:test

# Lint
cd apps/web && npm run lint
```
