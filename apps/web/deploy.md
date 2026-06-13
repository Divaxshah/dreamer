# Deploy Dreamer on EC2 (Podman + Caddy)

Dreamer runs the Next.js app directly with PM2. Hermes runs through the
sandboxed `dreamer-hermes:local` Podman image. Live previews run as rootless
Podman containers and are exposed through wildcard workspace subdomains via the
root `preview-router`.

## Architecture

```text
Cloudflare -> Caddy :80
  app.kreativespace.com        -> Next.js :3000
  *.kreativespace.com          -> preview-router :4999 -> Podman Vite port

Next.js /api/generate       -> Podman Hermes bridge image
Next.js /api/preview/docker -> podman run -p 127.0.0.1::5173 node:20-alpine
```

Use one wildcard level for previews: `https://ws-abc123.kreativespace.com`.
Cloudflare Universal SSL covers `*.kreativespace.com`, but it usually does not
cover nested wildcard hosts like `*.preview.kreativespace.com`.

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

`npm run build` copies `.next/static` and `public` into `.next/standalone` after
`next build`. This is required because the production PM2 process runs
`.next/standalone/server.js`.

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
WEBMAKER_PREVIEW_DOMAIN=kreativespace.com
WEBMAKER_PREVIEW_PROTOCOL=https
WEBMAKER_PREVIEW_PUBLIC_PORT=
PREVIEW_ROUTER_IPC_URL=http://127.0.0.1:4998
```

`ecosystem.config.js` reads `apps/web/.env.local` and passes
`WEBMAKER_PREVIEW_DOMAIN` to `preview-router`, so do not duplicate the domain in
PM2 config. Keep it in `.env.local`.

The example above is the recommended public mode: the browser uses HTTPS,
Cloudflare handles TLS, and Caddy receives plain HTTP on the EC2 origin.

For a temporary HTTP-only deployment without Cloudflare TLS, use HTTP for both
the studio and previews:

```bash
NEXT_PUBLIC_APP_URL=http://app.kreativespace.com
WEBMAKER_PREVIEW_PROTOCOL=http
WEBMAKER_PREVIEW_PUBLIC_PORT=
```

Do not serve the studio over HTTPS while previews use HTTP. Browsers block HTTP
iframes inside HTTPS pages as mixed content.

## Cloudflare DNS

Create proxied DNS records:

```text
Type  Name  Content       Proxy
A     app   <EC2 IPv4>    Proxied
A     *     <EC2 IPv4>    Proxied
```

In Cloudflare, enable WebSockets and set SSL/TLS mode to **Flexible** for the
simplest setup because Caddy is serving HTTP on the EC2 origin in this config.
For stricter origin TLS, install a Cloudflare Origin Certificate covering
`app.kreativespace.com` and `*.kreativespace.com`, then configure Caddy with
that certificate.

## GoDaddy DNS

If GoDaddy manages DNS directly, create:

```text
Type  Name  Value       TTL
A     app   <EC2 IPv4>  600
A     *     <EC2 IPv4>  600
```

GoDaddy DNS does not provide Cloudflare's proxy TLS. HTTP-only previews work
with plain GoDaddy DNS, but the browser URL will be `http://...`. For HTTPS
previews on wildcard subdomains, either move DNS to Cloudflare or configure
Caddy public HTTPS with DNS-01 wildcard certificates. Cloudflare is the
recommended route for Dreamer previews because Vite HMR WebSockets work cleanly
through the proxy.

## Caddy

Install Caddy:

```bash
sudo apt-get update
sudo apt-get install -y caddy
```

This Caddyfile is HTTP-only. It works for Cloudflare Flexible mode and for a
temporary direct HTTP deployment:

```text
Cloudflare HTTPS -> Caddy HTTP origin   Recommended public setup
Browser HTTP     -> Caddy HTTP          Temporary direct setup
```

Write the production Caddyfile:

```bash
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

The production Caddyfile intentionally uses HTTP-only origins:

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

This pairs with Cloudflare SSL/TLS mode **Flexible**. Cloudflare should point
both `app.kreativespace.com` and `*.kreativespace.com` to the EC2 instance, with
WebSockets enabled.

The repo `Caddyfile` is a reusable template. systemd Caddy does not automatically
read `apps/web/.env.local`, so write literal production domains into
`/etc/caddy/Caddyfile` unless you also configure systemd environment variables
for Caddy.

If you want Cloudflare Full/Strict instead, install a Cloudflare Origin
Certificate for `app.kreativespace.com` and `*.kreativespace.com`, remove the
HTTP-only Caddy mode, and configure Caddy to serve that origin certificate.

## PM2

Install PM2 once if it is not already available:

```bash
sudo npm install -g pm2
pm2 --version
```

Start Dreamer:

```bash
cd /home/ubuntu/dreamer
pm2 delete all
pm2 start ecosystem.config.js --update-env
pm2 save
pm2 status
```

`ecosystem.config.js` starts two processes:

```text
dreamer-web      node .next/standalone/server.js on port 3000
preview-router   preview subdomain proxy on port 4999, IPC on 4998
```

Enable PM2 resurrect on server reboot:

```bash
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

PM2 prints a `sudo env ... pm2 startup ...` command. Run the exact command it
prints, then run:

```bash
pm2 save
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs dreamer-web --lines 80
pm2 logs preview-router --lines 80
pm2 restart dreamer-web --update-env
pm2 restart preview-router --update-env
pm2 restart ecosystem.config.js --update-env
pm2 flush
```

After changing `.env.local`, restart with `--update-env`. After pulling code or
changing frontend code, rebuild first:

```bash
cd /home/ubuntu/dreamer
npm run build
pm2 restart ecosystem.config.js --update-env
pm2 save
```

## Verify

```bash
curl -s http://127.0.0.1:3000/api/health | python3 -m json.tool
curl -s http://127.0.0.1:3000/api/preview/docker
curl -s http://127.0.0.1:4998/ports | python3 -m json.tool
curl -I https://app.kreativespace.com
curl -I https://ws-test.kreativespace.com
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
