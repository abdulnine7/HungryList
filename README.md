# HungryList

HungryList is a production-ready, single-household grocery planner optimized for fast daily use on mobile and desktop.

## Stack

- Frontend: React + Vite + Tailwind + DaisyUI + React Query
- Backend: Node.js + Express + Zod + SQLite (WAL)
- Tests: Vitest + React Testing Library + Supertest + Playwright
- Deployment: Docker, Docker Compose (TrueNAS-friendly persistent volume)

## Project Structure

- `frontend/` React UI (tabs, filters, modals, theme, toasts)
- `backend/` Express API, auth, SQLite migrations, backup/restore
- `e2e/` Playwright critical flows
- `Dockerfile`, `Dockerfile.dev`, `docker-compose.yml` deployment and local container workflows

## Features

- 4-digit PIN authentication with trusted device sessions (1 year)
- IP lockout after 3 failed attempts for 6 hours
- Sections with icon/color, default seed data, duplicate protection
- Items with soft-delete restore-on-readd, duplicate prevention, and single global state
- Views: My List, Next Trip, Favorites, Running Low, Reminders, Settings
- Filtering: checked state, priority, sort, favorites-only, running-low-only, section chips, main search
- DaisyUI themes (`hungryLight` and `hungryDark`) with persisted toggle
- Toast feedback (2-second auto-hide)
- Manual backups + automatic monthly backup (1st day)
- Backup restore modal with "create current backup and restore" flow

## Local Development

Prerequisites:

- Node.js 22+
- npm 10+

1. Create env file:

```bash
cp .env.example .env
```

2. Set required values in `.env`:

- `HUNGRYLIST_PIN` must be exactly 4 digits
- `SESSION_SECRET` should be long and random

3. Install dependencies:

```bash
npm install
```

4. Start dev servers:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## Tests

```bash
npm run test
npm run e2e
```

## Production-like Local Run (Single Web Container)

```bash
docker compose up --build -d
```

App is available at `http://localhost:8080` with frontend and `/api` served from the same container.

## GitHub Releases

- Repository: `https://github.com/abdulnine7/HungryList`
- Releases: `https://github.com/abdulnine7/HungryList/releases`
- TrueNAS YAML asset: `truenas-custom-app.yaml`

## Environment Variables

See `.env.example`.

Important values:

- `APP_PORT` (default `8080`)
- `HUNGRYLIST_PIN`
- `SESSION_SECRET`
- `DATA_DIR` (default `/data`)
- `BACKUP_DIR` (default `/data/backups`)
- `TRUST_PROXY` (`true` behind reverse proxy)
- `COOKIE_SECURE` (`true` when HTTPS is enabled)
- `FRONTEND_DIST_DIR` (default set for container runtime)

## Backup & Restore

From Settings:

1. Click **Create Backup** to snapshot grocery-domain data (`sections`, `items`, `history_events`).
2. Use **Restore** on any backup to open confirmation modal.
3. Keep **Create current backup before restore** enabled for safety.
4. Restore forces session invalidation and app reload/login.

Automatic backups:

- Monthly backup runs on the 1st day at 03:00 server time.

## TrueNAS + cloudflared (Install via YAML)

1. Open the latest release and download `truenas-custom-app.yaml`.
2. Edit these values in the YAML:
- `HUNGRYLIST_PIN`
- `SESSION_SECRET`
- `/mnt/tank/apps/hungrylist/data` to your TrueNAS dataset path
- `REPLACE_WITH_CLOUDFLARE_TUNNEL_TOKEN`
3. (Optional) Change `image: ghcr.io/abdulnine7/hungrylist:v1.0.2` to a newer release tag.
4. In TrueNAS go to `Apps > Discover Apps > Custom App > Install via YAML`.
5. Paste the YAML content and deploy.
6. In Cloudflare Zero Trust, create a tunnel hostname pointing to `http://hungrylist:8080`.

Direct download URL (latest release asset):

```bash
curl -L -o truenas-custom-app.yaml \
  https://github.com/abdulnine7/HungryList/releases/latest/download/truenas-custom-app.yaml
```

Notes:

- Keep the `/data` volume on persistent storage. This holds SQLite DB + backups.
- If you do not want direct LAN access, remove the `ports` block from the YAML.
- If you plan to use only HTTPS through Cloudflare, keep `COOKIE_SECURE=true`.
- If you need HTTP login via LAN IP/port, set `COOKIE_SECURE=false`.
- The release YAML pulls the prebuilt GHCR image directly.

## Security Hardening Checklist

- Change default `HUNGRYLIST_PIN` before first launch.
- Set a high-entropy `SESSION_SECRET`.
- Set `COOKIE_SECURE=true` when using HTTPS.
- Set `TRUST_PROXY=true` when running behind reverse proxy.
- Restrict inbound access at network/firewall level.
- Keep Docker images and host patched.
- Rotate backups and validate restore periodically.

See `docs/REVERSE_PROXY.md` for Caddy/Nginx reverse proxy examples.

## API Error Contract

All non-2xx responses follow:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-friendly message",
  "details": {}
}
```
