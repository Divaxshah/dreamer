# Deploy Dreamer on EC2 (Podman + Caddy)

Dreamer runs the Next.js app directly with PM2. Hermes runs through the
sandboxed `dreamer-hermes:local` Podman image. Live previews run as rootless
Podman containers and are exposed through `*.preview.<domain>` via the root
`preview-router`.

## Architecture

```text
Cloudflare -> Caddy :80
  app.kreativespace.com        -> Next.js :3000
  *.preview.kreativespace.com  -> preview-router :4999 -> Podman Vite port

Next.js /api/generate       -> Podman Hermes bridge image
Next.js /api/preview/docker -> podman run -p 127.0.0.1::5173 node:20-alpine
```

## Setup

```bash
cd /home/ubuntu/dreamer
./deploy/setup-ec2.sh

cd agent
python3 -m venv .venv
.venv/bin/python -m pip install -e .

cd ../apps/web
npm install
npm run build

cd ../../preview-router
npm install

cd ..
npm run hermes:image
```

## Environment

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

Set the same `WEBMAKER_PREVIEW_DOMAIN` value for the `preview-router` PM2 process
in the root `ecosystem.config.js`.

```js
WEBMAKER_PREVIEW_DOMAIN: "preview.kreativespace.com"
```

## Cloudflare DNS

Create proxied DNS records:

```text
Type  Name       Content       Proxy
A     app        <EC2 IPv4>    Proxied
A     *.preview  <EC2 IPv4>    Proxied
```

In Cloudflare, enable WebSockets and set SSL/TLS mode to **Flexible** for the
simplest setup because Caddy is serving HTTP on the EC2 origin in this config.
For stricter origin TLS, install a Cloudflare Origin Certificate covering
`app.kreativespace.com` and `*.preview.kreativespace.com`, then configure Caddy
with that certificate.

## Caddy

Install Caddy:

```bash
sudo apt-get update
sudo apt-get install -y caddy
```

Install the root `Caddyfile`:

```bash
sudo cp /home/ubuntu/dreamer/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Cloudflare should point both `app.kreativespace.com` and
`*.preview.kreativespace.com` to the EC2 instance, with WebSockets enabled.

## Start

```bash
cd /home/ubuntu/dreamer
pm2 start ecosystem.config.js
pm2 save
```

## Verify

```bash
curl -s http://127.0.0.1:3000/api/health | python3 -m json.tool
curl -s http://127.0.0.1:3000/api/preview/docker
curl -s http://127.0.0.1:4998/ports | python3 -m json.tool
curl -I https://app.kreativespace.com
```

Expected:

- `checks.hermesBridge.ok: true`
- `checks.dockerPreview.ok: true` means Podman is available
- `/api/preview/docker` returns `{"available":true,"image":"node:20-alpine"}`

## Local Subdomain Test

Use the same stack locally without Cloudflare:

```bash
WEBMAKER_PREVIEW_DOMAIN=preview.localhost
WEBMAKER_APP_DOMAIN=app.localhost
WEBMAKER_PREVIEW_PROTOCOL=http
WEBMAKER_PREVIEW_PUBLIC_PORT=4999
```

Add host entries for specific workspaces as needed:

```text
127.0.0.1 app.localhost
127.0.0.1 ws-abc123.preview.localhost
127.0.0.1 ws-def456.preview.localhost
```

Run Caddy on port 80, Next.js on 3000, and `preview-router` on 4999.
