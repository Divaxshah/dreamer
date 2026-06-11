# Dreamer Web

AI-assisted frontend studio (Next.js): chat, Podman preview, ZIP export, and shareable preview links.

Generation is handled by the in-repo Hermes agent at `../../agent`; this package is the Studio UI and preview runtime.

## Quick start (local)

```bash
cp .env.example .env.local
# Defaults point at ../../agent when run from apps/web.

npm install
npm run dev
```

Open [http://localhost:3000/studio](http://localhost:3000/studio).

Requirements:

- **Hermes** — model/provider credentials configured in Hermes itself
- **Podman** - for Studio preview (`podman info` must succeed)

## Verify configuration

```bash
curl -s http://localhost:3000/api/health | jq
curl -s http://localhost:3000/api/preview/docker
```

## Deploy on EC2

See **[deploy.md](./deploy.md)** for Podman + Caddy deployment on AWS EC2.
