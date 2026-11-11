# LaunchOps

**Event-driven mission console for upcoming rocket launches.**

[Live demo](https://launch-ops-live.vercel.app) · Data by [The Space Devs](https://thespacedevs.com/)

![LaunchOps console showing the launch queue, day-and-night Earth, and overview stats](docs/console.jpg)

Most launch boards either poll forever or treat every NET as exact. LaunchOps does neither. A dual-cron worker ingests [Launch Library 2.3](https://thespacedevs.com/), maps into a lean stored model, caches in Redis with MongoDB as durable store, diffs each refresh into console events, and pushes board + event batches over Redis Pub/Sub → Socket.IO. The React client hydrates once over REST, then stays live without client-side polling.

## What you get

- **Active board** — year/quarter catalog stubs stay out; month-precision rows only when NET falls in the current UTC month
- **Honest time** — T− / T+ only when NET precision is hour-or-finer; TBD/TBC never fake a relative ETA
- **Live mission card** — vehicle, provider, customer, orbit, site, status, and webcast (YouTube embed; X and others as outbound links)
- **Day/night Earth** — fly to pads, inspect the site catalog, drag-to-yaw with inertia; phone earth expands on hover/tap
- **Console overview** — board stats plus durable recent updates (new / NET slip / status / webcast / removed)
- **Mission-control UX** — sticky selection, keyboard navigation, shared 12/24-hour clock, shared [signal colors](docs/color-scheme.md)

## Architecture

```text
The Space Devs Launch Library
        |                    |
        | upcoming           | locations catalog
        | every 5 minutes    | every 12 hours
        v                    v
           Ingestion worker
            /           \
     MongoDB             Redis cache
                            |
                      Redis Pub/Sub
                            |
                            v
                   Express + Socket.IO
                  /                  \
     GET /launches              GET /locations
     GET /launches/updates
     live-launch-data           live-location-data
     live-launch-events
                  \                  /
                     React client
```

The API process boots the worker. Each launch tick: map → upsert MongoDB → **diff previous Redis board** → append a capped event list → overwrite cache → publish. Clients hydrate with `GET /launches`, `GET /locations`, and `GET /launches/updates`; later refreshes arrive as Socket.IO events. Locations paginate the full catalog on a slower cadence so the pad inspector stays complete without burning the free LL2 quota.

### Design choices that matter

| Choice | Why |
| --- | --- |
| REST hydrate + Socket.IO push | Fast first paint; no client polling loop |
| Redis cache + MongoDB | Hot path for reads; durable source when cache is cold |
| Board diff before overwrite | Console “updates” are real deltas, not guessed UI state |
| Active-board filter | “Upcoming” means near-term schedule, not Dec 31 TBD noise |
| NET precision gating | A day-only NET never becomes “T− 21 min” |
| `*/5` launches, no `next` follow | Stays under ~15 unauthenticated LL2 requests/hour (~12/hr for launches) |

**121 automated tests** (Vitest + Node’s test runner) run on every PR and push to `main` via GitHub Actions.

## Tech stack

| Layer | Choices |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion |
| Visualization | three.js, React Three Fiber |
| Backend | Node.js 22, Express 5, Socket.IO |
| Data | MongoDB, Redis, Launch Library 2.3 |
| Deploy | Vercel (frontend) · Render (backend) |

## Run locally

**Prerequisites:** Node.js 22+, MongoDB URI, Redis URL.

```bash
git clone https://github.com/brshin/launch-ops.git
cd launch-ops

cd backend && npm install
cd ../frontend && npm install
```

`backend/.env`:

```env
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_url
FRONTEND_URL=http://localhost:5173
PORT=3000
```

`frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

```bash
# terminal 1
cd backend && node server.js

# terminal 2
cd frontend && npm run dev -- --host
```

Open [http://localhost:5173](http://localhost:5173). `--host` also serves the preview on your LAN.

```bash
cd frontend && npm test && npm run lint && npm run build
cd backend && npm test
```

## Runtime contracts

### Environment

| Variable | Service | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Backend | MongoDB connection string |
| `REDIS_URL` | Backend | Redis cache and Pub/Sub |
| `FRONTEND_URL` | Backend | Allowed Socket.IO origin (default `*`) |
| `PORT` | Backend | HTTP port (default `3000`) |
| `VITE_API_URL` | Frontend | REST + Socket.IO base (default `http://localhost:3000`) |

Local `.env` files are gitignored — do not commit them.

### HTTP and Socket.IO

| Contract | Purpose |
| --- | --- |
| `GET /` | Health |
| `GET /launches` | Upcoming board (Redis → MongoDB fallback) |
| `GET /launches/updates` | Recent board-change events, newest first |
| `GET /locations` | Launch-site catalog (Redis → MongoDB fallback) |
| `live-launch-data` | Socket.IO: fresh launch board after ingestion |
| `live-launch-events` | Socket.IO: new board-change rows from that tick |
| `live-location-data` | Socket.IO: fresh locations after ingestion |

Upstream:

```text
GET https://ll.thespacedevs.com/2.3.0/launches/upcoming/?mode=detailed&limit=100
GET https://ll.thespacedevs.com/2.3.0/locations/?format=json&limit=100
```

Detailed mode is required for webcast URLs. Launches: one page of up to 100 every five minutes (no `next` follow). Locations: full catalog roughly every twelve hours.

## Repository layout

```text
launch-ops/
├── backend/                # Express API, ingestion worker, models, tests
├── frontend/
│   ├── public/             # Static assets and Earth textures
│   └── src/
│       ├── components/     # Console, launch card, location panel, queue, globe
│       ├── hooks/          # Feeds, clock, countdown, responsive state
│       ├── lib/            # Motion tokens and signal colors
│       ├── types/          # Domain types
│       └── utils/          # Time/precision, watch targets, overview, tests
├── docs/                   # Screenshot and signal-color notes
└── .github/workflows/      # CI
```

## Data source

Launch and location data come from [The Space Devs](https://thespacedevs.com/). LaunchOps stores only the fields the console uses and treats provisional times as provisional — never as false countdown precision.
