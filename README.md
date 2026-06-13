# Dreamer

AI-powered web app builder. Describe what you want, get a live editable app, and preview it in isolated Podman containers.

Dreamer is built from three pieces:

```text
apps/web          Next.js 16 studio UI + API routes
agent/            Hermes agent bridge used for generation
preview-router/   Reverse proxy for production preview subdomains
```

## Architecture

Local development:

```text
Browser -> Next.js dev server :3000
Next.js /api/generate       -> Hermes bridge, usually via Podman
Next.js /api/preview/docker -> rootless Podman preview container
Preview iframe              -> direct 127.0.0.1:<mapped-port>
```

Production:

```text
Cloudflare -> Caddy :80
  app.kreativespace.com -> Next.js standalone server :3000
  *.kreativespace.com   -> preview-router :4999 -> Podman preview port

Next.js /api/generate       -> sandboxed Hermes Podman image
Next.js /api/preview/docker -> rootless Podman Vite containers
```

Generated project files are stored on disk and mounted into containers:

```text
Host:      apps/web/.webmaker/workspaces/<workspace-id>
Preview:   /app
Hermes:    /workspaces/<workspace-id>
```

That gives the app a durable workspace you can export while keeping generation commands and preview runtime inside containers.

## Prerequisites

- Node.js 20+
- Python 3.11-3.13
- Podman
- Linux/macOS/WSL2 shell for local development

Install Podman on Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y podman
loginctl enable-linger "$USER"
podman info
```

On macOS:

```bash
brew install podman
podman machine init
podman machine start
podman info
```

## Local Setup

Install everything:

```bash
git clone https://github.com/Divaxshah/dreamer.git
cd dreamer

npm run web:install
npm run router:install
npm run agent:install
npm run hermes:image
podman pull node:20-alpine
```

Create local env:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Minimum local `.env.local`:

```bash
WEBMAKER_HERMES_PATH=../../agent
WEBMAKER_HERMES_PYTHON=../../agent/.venv/bin/python
WEBMAKER_HERMES_RUNNER=podman
WEBMAKER_HERMES_IMAGE=dreamer-hermes:local

WEBMAKER_WORKSPACE_ROOT=.webmaker/workspaces
WEBMAKER_PREVIEW_IMAGE=node:20-alpine

WEBMAKER_APP_DOMAIN=app.localhost
WEBMAKER_PREVIEW_DOMAIN=preview.localhost
WEBMAKER_PREVIEW_PROTOCOL=http
WEBMAKER_PREVIEW_ROUTER_PORT=4999
WEBMAKER_PREVIEW_PUBLIC_PORT=4999
PREVIEW_ROUTER_IPC_URL=http://127.0.0.1:4998

OPENROUTER_API_KEY=sk-or-...
```

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

For local development, previews use direct Podman mapped ports in the browser, so Caddy and wildcard DNS are not required.

## Production Deploy On EC2

These examples use `kreativespace.com`. Replace with your own domain.

### 1. Server Setup

On Ubuntu EC2:

```bash
cd /home/ubuntu/dreamer
./deploy/setup-ec2.sh

npm run web:install
npm run router:install
npm run agent:install
npm run hermes:image
npm run build
```

The build script copies `.next/static` and `public` into `.next/standalone`, which is required because PM2 runs Next's standalone server.

### 2. Production Environment

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
WEBMAKER_PREVIEW_DOMAIN=kreativespace.com
WEBMAKER_PREVIEW_PROTOCOL=https
WEBMAKER_PREVIEW_PUBLIC_PORT=
PREVIEW_ROUTER_IPC_URL=http://127.0.0.1:4998
```

`ecosystem.config.js` reads this file and passes `WEBMAKER_PREVIEW_DOMAIN` to `preview-router`, so keep domain config in `.env.local`.

The example above is the recommended public setup: browsers use HTTPS, Cloudflare handles TLS, and Caddy receives plain HTTP on the EC2 origin.

For a temporary HTTP-only deployment without Cloudflare TLS, use HTTP for both the studio and previews:

```bash
NEXT_PUBLIC_APP_URL=http://app.kreativespace.com
WEBMAKER_PREVIEW_PROTOCOL=http
WEBMAKER_PREVIEW_PUBLIC_PORT=
```

Do not mix an HTTPS studio with HTTP previews. Browsers block HTTP iframes inside an HTTPS page as mixed content.

### 3. DNS

Use one wildcard level for previews:

```text
https://ws-abc123.kreativespace.com
```

Do not use nested preview domains like:

```text
https://ws-abc123.preview.kreativespace.com
```

Cloudflare Universal SSL usually covers `*.kreativespace.com`, but not `*.preview.kreativespace.com`.

Cloudflare DNS records:

```text
Type  Name  Value       Proxy
A     app   <EC2 IPv4>  Proxied
A     *     <EC2 IPv4>  Proxied
```

Cloudflare settings:

```text
SSL/TLS mode: Flexible
Network -> WebSockets: On
```

GoDaddy DNS records if GoDaddy manages DNS directly:

```text
Type  Name  Value       TTL
A     app   <EC2 IPv4>  600
A     *     <EC2 IPv4>  600
```

GoDaddy DNS alone does not provide Cloudflare's proxy TLS. HTTP-only previews work with plain GoDaddy DNS, but the browser URL will be `http://...`. For HTTPS wildcard previews, either move DNS to Cloudflare or configure Caddy public HTTPS with DNS-01 wildcard certificates. Cloudflare is the recommended path for Dreamer.

### 4. Caddy

The included Caddy setup is an HTTP server. It works in two modes:

```text
Cloudflare HTTPS -> Caddy HTTP origin   Recommended public setup
Browser HTTP     -> Caddy HTTP          Temporary direct setup
```

Use this Caddyfile for either mode:

```caddy
{
  auto_https off
}

http://app.kreativespace.com {
  reverse_proxy localhost:3000
}

http://*.kreativespace.com {
  reverse_proxy localhost:4999
}
```

Install, write the production Caddyfile, and reload:

```bash
sudo apt-get update
sudo apt-get install -y caddy
sudo tee /etc/caddy/Caddyfile >/dev/null <<'CADDY'
{
  auto_https off
}

http://app.kreativespace.com {
  reverse_proxy localhost:3000
}

http://*.kreativespace.com {
  reverse_proxy localhost:4999
}
CADDY
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo ss -ltnp | grep -E ':80|:3000|:4999'
```

Expected: Caddy listens on `:80`. If it only listens on `:443`, Cloudflare Flexible will fail. The repo `Caddyfile` is a reusable template, but systemd Caddy does not automatically read `apps/web/.env.local`, so the production file above uses literal domains.

For Cloudflare Full/Strict, install a Cloudflare Origin Certificate covering `app.kreativespace.com` and `*.kreativespace.com`, remove the HTTP-only Caddy mode, and configure Caddy with that certificate.

### 5. Start PM2

Install PM2 once if it is not already available:

```bash
sudo npm install -g pm2
pm2 --version
```

Start the two production processes:

```bash
cd /home/ubuntu/dreamer
pm2 delete all
pm2 start ecosystem.config.js --update-env
pm2 save
pm2 status
```

Enable PM2 resurrect on server reboot:

```bash
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

PM2 prints a `sudo env ... pm2 startup ...` command. Run the exact command it prints, then run:

```bash
pm2 save
```

The PM2 config starts:

```text
dreamer-web      node .next/standalone/server.js on port 3000
preview-router   preview subdomain proxy on port 4999, IPC on 4998
```

After changing `.env.local`, rebuild if needed and restart with the fresh env:

```bash
npm run build
pm2 restart ecosystem.config.js --update-env
pm2 save
```

### 6. Verify

On EC2:

```bash
curl -s http://127.0.0.1:3000/api/health | python3 -m json.tool
curl -s http://127.0.0.1:3000/api/preview/docker
curl -s http://127.0.0.1:4998/ports | python3 -m json.tool
curl -i -H "Host: app.kreativespace.com" http://127.0.0.1
```

From your local machine:

```bash
curl -I https://app.kreativespace.com
curl -I https://ws-test.kreativespace.com
```

`ws-test` will likely return a preview-not-ready response until a workspace exists, but it should not fail TLS.

## Common Commands

```bash
npm run dev             # local Next dev server
npm run build           # production Next standalone build
npm run hermes:image    # build sandboxed Hermes image
npm run web:install     # install apps/web dependencies
npm run router:install  # install preview-router dependencies
npm run agent:install   # create agent venv and install agent
```

PM2:

```bash
pm2 status
pm2 logs dreamer-web --lines 80
pm2 logs preview-router --lines 80
pm2 restart dreamer-web --update-env
pm2 restart preview-router --update-env
pm2 restart ecosystem.config.js --update-env
pm2 save
pm2 flush
```

Podman previews:

```bash
podman ps --filter label=webmaker.preview=true
podman logs preview-<workspace-id>
curl -s http://127.0.0.1:4998/ports | python3 -m json.tool
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `WEBMAKER_HERMES_RUNNER` | `podman` | Runs Hermes through Podman or `local` for direct Python |
| `WEBMAKER_HERMES_IMAGE` | `dreamer-hermes:local` | Hermes bridge container image |
| `WEBMAKER_HERMES_PATH` | `../../agent` | Agent directory |
| `WEBMAKER_HERMES_PYTHON` | `../../agent/.venv/bin/python` | Local Python executable for `WEBMAKER_HERMES_RUNNER=local` |
| `WEBMAKER_HERMES_HOME` | `~/.hermes` | Hermes config home |
| `WEBMAKER_WORKSPACE_ROOT` | `.webmaker/workspaces` | Workspace storage path |
| `WEBMAKER_PREVIEW_IMAGE` | `node:20-alpine` | Generated-app preview image |
| `WEBMAKER_APP_DOMAIN` | `app.localhost` | Studio UI domain |
| `WEBMAKER_PREVIEW_DOMAIN` | `preview.localhost` | Preview wildcard base |
| `WEBMAKER_PREVIEW_PROTOCOL` | `http` locally, usually `https` in prod | Preview URL protocol. Use `http` for HTTP-only deployments |
| `WEBMAKER_PREVIEW_PUBLIC_PORT` | `4999` locally, empty in prod | Public preview port suffix. Keep empty when Caddy listens on default `80` or `443` |
| `PREVIEW_ROUTER_IPC_URL` | `http://127.0.0.1:4998` | Web app to preview-router IPC |
| `OPENROUTER_API_KEY` | empty | Recommended model provider key |
| `UPSTASH_REDIS_REST_URL` | empty | Optional dashboard/session persistence |
| `UPSTASH_REDIS_REST_TOKEN` | empty | Optional dashboard/session persistence |

## Troubleshooting

**Cloudflare 521**

Caddy is not reachable on port `80`, or EC2 security group blocks HTTP.

```bash
sudo ss -ltnp | grep -E ':80|:3000|:4999'
curl -i -H "Host: app.kreativespace.com" http://127.0.0.1
```

**Cloudflare 525**

Cloudflare is set to Full/Strict but Caddy is serving HTTP-only origin. Set Cloudflare SSL/TLS mode to Flexible, or configure a Cloudflare Origin Certificate.

**Preview TLS error for `ws-*.preview.domain.com`**

Use `ws-*.domain.com` instead. Cloudflare Universal SSL usually does not cover nested wildcards.

**No CSS in production**

The standalone server is missing static assets. Rebuild with the current script:

```bash
npm run build
pm2 restart dreamer-web --update-env
```

Emergency copy:

```bash
cd /home/ubuntu/dreamer/apps/web
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true
pm2 restart dreamer-web --update-env
```

**Preview router crashes with `MODULE_NOT_FOUND`**

```bash
npm run router:install
pm2 restart preview-router --update-env
```

**Next production server says `.next` build is missing**

```bash
npm run build
pm2 restart dreamer-web --update-env
```

`ecosystem.config.js` runs `.next/standalone/server.js`, not `next start`.

**SSH / EC2 Instance Connect stops working**

Dreamer deploy commands should not close SSH. Check the EC2 security group inbound rule for port `22`, your current public IP, and the SSH service:

```bash
sudo systemctl status ssh --no-pager
sudo ss -ltnp | grep ':22'
sudo ufw status
```

`deploy/setup-ec2.sh` blocks outbound metadata-service access with iptables, but that does not block inbound SSH.

## Project Structure

```text
dreamer/
├── apps/web/              Next.js studio UI and API routes
├── agent/                 Hermes agent bridge and tools
├── preview-router/        Workspace subdomain to Podman port proxy
├── Caddyfile              Production reverse proxy config
├── ecosystem.config.js    PM2 process config
└── package.json           Monorepo scripts
```

Detailed EC2 notes live in [`apps/web/deploy.md`](apps/web/deploy.md).

## Contributing

```bash
npm run web:test
cd apps/web && npm run lint
```
