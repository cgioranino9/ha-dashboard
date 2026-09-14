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
your HA token off the public internet. Two easy options:

- **Run it on the same mini PC as Home Assistant** (or any always-on machine on your LAN):
  `npm run build && npm run start`, then point the tablet's browser at
  `http://<that machine's IP>:3000`.
- **Run it locally and use a kiosk browser app** on the wall tablet (e.g. Fully Kiosk Browser
  on Android) pointed at the same URL, with "keep screen on" enabled.

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
