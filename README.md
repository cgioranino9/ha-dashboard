# Home Assistant Wall Dashboard

A custom, touch-friendly wall dashboard for Home Assistant, built with Next.js instead of
Lovelace YAML. Entities are grouped by HA area automatically; the app polls Home Assistant
every few seconds and lets you tap lights/switches/locks/covers/climate/media players
directly from the grid.

## Setup

1. Create a long-lived access token in Home Assistant: click your profile (bottom left) →
   **Security** → **Long-Lived Access Tokens** → **Create Token**.
2. Copy `.env.local.example` to `.env.local` and fill in:
   - `HA_URL` — your Home Assistant instance's local network address, e.g.
     `http://homeassistant.local:8123` or `http://192.168.1.50:8123`
   - `HA_TOKEN` — the token from step 1
3. Install dependencies and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The `HA_URL`/`HA_TOKEN` are only ever used server-side (in `src/lib/ha-server.ts` and the
`/api/*` routes) — they are never sent to the browser.

## Running it on the wall

This app is meant to be reached over your home network, not deployed publicly — that keeps
your HA token off the public internet.

Point the wall tablet's kiosk browser (e.g. Fully Kiosk Browser on Android, "keep screen on"
enabled) at `http://<mini-pc-ip>:3000`.

### Deploying to Home Assistant OS (Docker, no polling)

This repo is deployed on a HAOS mini PC as a plain Docker container built from this repo,
using the [`Dockerfile`](Dockerfile). There's no background auto-update process — updates are
a one-shot script you run whenever you want the latest commit deployed.

**One-time setup** on the mini PC (needs a way in — e.g. the "Advanced SSH & Web Terminal"
add-on's web terminal):

```bash
# A named volume holds the git clone + .env.local, independent of any add-on's
# own (ephemeral) filesystem.
docker volume create ha-dashboard-repo

# Seed the env file into it (edit the values first).
docker run --rm -v ha-dashboard-repo:/repo alpine sh -c \
  "printf 'HA_URL=http://<mini-pc-ip>:8123\nHA_TOKEN=<your token>\n' > /repo/.env.local"

# Clone the repo into the same volume.
docker run --rm --entrypoint sh -v ha-dashboard-repo:/repo alpine/git -c \
  'cd /repo && git init -q && git remote add origin https://github.com/cgioranino9/ha-dashboard.git && git fetch -q origin main && git checkout -q -B main origin/main'
```

**Every time you want to deploy the latest commit**, run [`scripts/deploy-on-mini-pc.sh`](scripts/deploy-on-mini-pc.sh)
on the mini PC. It pulls `main`, rebuilds the image, and swaps the running container — no
background service, nothing left running afterward. The container itself still runs with
`--restart unless-stopped`, so it survives reboots; only the *update check* is manual.

## Project structure

- `src/lib/ha-server.ts` — server-only Home Assistant WebSocket connection, entity/area
  registry lookup, and service-call helper.
- `src/app/api/dashboard/route.ts` — returns entities grouped by area as JSON.
- `src/app/api/service/route.ts` — proxies service calls (toggle a light, set a temperature…).
- `src/lib/useDashboard.ts` — client-side polling hook (SWR).
- `src/components/EntityCard.tsx` — per-domain card UI (light, switch, lock, cover, climate,
  media player, sensors).
- `src/app/page.tsx` — the dashboard page: area tabs + entity grid.

## Adding more domains / customizing cards

Add a `case` in the `EntityCard` switch in [`src/components/EntityCard.tsx`](src/components/EntityCard.tsx)
for any domain you want styled differently — everything else falls back to a generic
read-only sensor card.
