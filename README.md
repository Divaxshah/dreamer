# Dreamer

Thin monorepo for the Dreamer product:

- `apps/web` - Next.js Studio UI, preview API routes, and Podman preview control.
- `agent` - Hermes Python agent used by the web bridge.
- `preview-router` - local reverse proxy for `*.preview.<domain>` preview subdomains.

## Local setup

```bash
npm run web:install
npm run agent:install
cd preview-router && npm install && cd ..
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

The web app defaults to `../../agent` and `../../agent/.venv/bin/python` when run from `apps/web`.
Preview containers use Podman and return subdomain URLs like `https://ws-abc123.preview.localhost`.
