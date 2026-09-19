# LaunchOps

Global launch tracker dashboard for upcoming rocket launches.

Data is fetched from [The Space Devs Launch Library](https://thespacedevs.com/), stored in MongoDB, cached in Redis, and delivered to a React frontend over REST and Socket.IO.

---

## Features

- **Launch Queue** — upcoming launches with local NET (`DD MMM · HH:MM`), a relative chip (`T− 21 min`, `T+ 12 min`, `LIVE`, `HOLD`, `NET TBD`), provider abbreviation, dimmed past rows, and a `NEXT` marker on the in-flight or soonest upcoming launch (sidebar). Selection is by launch `apiId` (sticky across live cache refreshes) and defaults to in-flight or next NET
- **Mission detail panel** — provider, mission/rocket titles, Status chip, T− (cyan countdown) vs T+ (emerald elapsed) as `D:HH:MM:SS`, and provisional NET for TBD/TBC or coarse `net_precision` (day/month and coarser — no fake minute countdown)
- **T-Zero and coordinates** — local launch time with explicit `UTC±X` offset, launch window, pad name, and location
- **Mission Brief** — mission description with type/orbit chips (unknown metadata hidden)
- **Live Feed indicator** — Socket.IO connect/disconnect status in the queue header and card footer (event flash on link change)
- **Last Updated** — provider `last_updated` timestamp in Sys Time–style local formatting
- **Sys Time** — local clock with explicit timezone offset
- **HUD motion** — Framer Motion cold-load boot, launch-selection crossfade, ticking T− urgency vs calm T+, and calmer ambient chrome
- **Live UI updates** — when the worker refreshes the cache, Redis Pub/Sub notifies the server, which emits the new payload to connected Socket.IO clients
- **Cached API** — `GET /launches` reads Redis first, then MongoDB on a cache miss
- **Scheduled ingestion** — cron worker polls Launch Library every 5 minutes, upserts MongoDB, writes Redis, and publishes a cache-update message
- **Responsive UI** — locked `dvh` console with safe-area insets; horizontal queue + stacked detail below `lg`, sidebar layout at `lg+`

---

## Architecture

```
Launch Library API
        |
        |  cron every 5 min (+ fetch on worker load)
        v
  Worker (node-cron)
        |
        |-- upsert --> MongoDB
        |-- setEx ----> Redis key: upcoming-launches
        |-- publish --> Redis channel: launch-updates
                              |
                              v
                     Express + Socket.IO
                        |           |
              GET /launches    subscribe + emit
                        |           |
                        v           v
                   React (Vite) <-- live-launch-data
```

1. The **worker** fetches upcoming launches from The Space Devs API.
2. Results are written to Redis and **upserted into MongoDB**.
3. A Redis Pub/Sub message on `launch-updates` notifies the API server.
4. The server emits `live-launch-data` over Socket.IO to connected clients.
5. On load, `useLaunchFeed` hydrates via `GET /launches` (Redis, then MongoDB on miss) and opens a Socket.IO connection (created on mount, torn down on unmount).
6. The same hook tracks Socket.IO `connect` / `disconnect` to drive the Live Feed indicator (including a one-shot flash when the uplink state changes) and replaces the list on `live-launch-data`. Sticky `apiId` selection lives there too (`pickDefaultApiId` when none is set or the previous pick left the queue).

The worker is required by `server.js`, so it runs in the same Node process as the API.

On the frontend, `App.tsx` is the console **shell**: it calls `useLaunchFeed` and `useSysClock`, derives `selectedIndex`, and composes UI regions (`Starfield`, `ConsoleHeader`, `LaunchQueue`, `LaunchCard`). `LaunchCard` is the mission-panel **orchestrator** under `components/LaunchCard/`: density, `useCountdown` (the card's 1s T−/T+ tick — owned by LaunchCard, not App), derived copy, and Framer stagger. Presentational regions are `LaunchCardIdentity` (titles/status/countdown), `LaunchCardVisual` (HUD image), `LaunchCardMission` (T-Zero/pad/brief), and `LaunchCardFooter` (live feed + last updated). Density spacing/type tokens live in `lib/cardDensityChrome.ts`. Shared domain helpers live under `utils/` (titles, T−/T+ chips, default selection, local time) with contract tests.

---

## Tech Stack

| Layer           | Technology                                                        |
| --------------- | ----------------------------------------------------------------- |
| Frontend        | React 19, TypeScript (partial), Vite, Tailwind CSS v4, Framer Motion |
| Realtime        | Socket.IO (client + server)                                          |
| Backend         | Node.js, Express 5                                                   |
| Worker          | node-cron                                                            |
| Database        | MongoDB via Mongoose                                                 |
| Cache / Pub-Sub | Redis                                                                |
| External data   | [The Space Devs Launch Library 2.3](https://ll.thespacedevs.com/)    |
| Analytics       | Vercel Analytics                                                     |
| Hosting         | Frontend on **Vercel**; backend on **Render**                        |
| Tests           | Vitest (frontend), `node:test` (backend)                             |
| CI              | GitHub Actions on pull requests and pushes to `main`                 |
| Source control  | [GitHub](https://github.com/brshin/launch-ops)                       |

---

## Project Structure

```
launch-ops/
├── .github/
│   └── workflows/
│       └── test.yml           # CI: frontend + backend `npm test`
│
├── backend/
│   ├── models/
│   │   └── Launch.js          # Mongoose schema
│   ├── mapLaunch.js           # Launch Library payload → stored documents
│   ├── mapLaunch.test.js
│   ├── server.js              # Express API, Socket.IO, Redis subscriber
│   ├── worker.js              # Cron ingestion, Redis publish, Mongo upsert
│   └── package.json
│
├── frontend/
│   ├── public/                # favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Starfield.tsx         # Ambient space background
│   │   │   ├── ConsoleHeader.tsx     # Brand + Sys Time
│   │   │   ├── LaunchQueue.tsx       # Horizontal strip / sidebar queue
│   │   │   ├── LaunchCard/
│   │   │   │   ├── LaunchCard.tsx         # Mission panel orchestrator
│   │   │   │   ├── LaunchCardIdentity.tsx # Titles, status pills, countdown
│   │   │   │   ├── LaunchCardVisual.tsx   # HUD image + rest/focus chrome
│   │   │   │   ├── LaunchCardMission.tsx  # T-Zero, pad, brief grid
│   │   │   │   └── LaunchCardFooter.tsx   # Live feed + last updated
│   │   │   ├── CountdownReadout.tsx  # Ticking countdown + status labels
│   │   │   └── FeedStatus.tsx        # Live/offline feed indicator
│   │   ├── hooks/
│   │   │   ├── useLaunchFeed.ts               # REST hydrate, Socket.IO, sticky apiId
│   │   │   ├── useSysClock.ts                 # Local Sys Time tick
│   │   │   ├── useCountdown.ts                # LaunchCard 1s T−/T+ tick
│   │   │   ├── useConsoleBoot.ts              # Cold-load boot window
│   │   │   ├── useCompactMotion.ts            # Below-lg motion / star budget
│   │   │   ├── useShortViewportBand.ts        # Short/mid/roomy height bands
│   │   │   ├── useCardDensityBand.ts          # LaunchCard stacked density
│   │   │   └── useConsoleScrollbarActivity.ts # Show thumbs while scrolling
│   │   ├── lib/
│   │   │   ├── motionTokens.ts        # Shared Framer transition presets
│   │   │   ├── bootMotion.ts          # Boot-sequence motion variants
│   │   │   └── cardDensityChrome.ts   # LaunchCard spacing/type by density
│   │   ├── types/
│   │   │   └── launch.ts             # Frontend launch types
│   │   ├── utils/
│   │   │   ├── launchTitle.ts        # Mission/rocket title helpers
│   │   │   ├── launchTitle.test.ts
│   │   │   ├── launchTime.ts         # Relative T−/T+ chips and NET precision honesty
│   │   │   ├── launchTime.test.ts
│   │   │   ├── queueFocus.ts         # Default queue selection (live, else next NET)
│   │   │   ├── queueFocus.test.ts
│   │   │   └── localTime.ts          # Shared local date/time + UTC offset labels
│   │   ├── App.tsx                   # Shell: hooks, selection index, layout
│   │   ├── main.jsx                  # React root, MotionConfig, Analytics
│   │   └── index.css                 # Console insets, short bands, scrollbars
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js with native `fetch` support (used by the worker)
- MongoDB connection string
- Redis instance

### 1. Clone

```bash
git clone https://github.com/brshin/launch-ops.git
cd launch-ops
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_url
FRONTEND_URL=http://localhost:5173
PORT=3000
```

```bash
node server.js
```

Listens on port `PORT`, or `3000` if unset. `GET /` returns plain text that the process is listening.

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

Vite default local URL is `http://localhost:5173`.

For LAN / phone preview on the same network:

```bash
npm run dev -- --host
```

Then open `http://<your-computer-ip>:5173` on the device.

### 4. Production frontend build

```bash
cd frontend && npm run build && npm run preview
```

### 5. Tests

Contract tests for queue chips/phases, titles, default selection, and Launch Library → `apiId` mapping. No Redis or Mongo required.

```bash
cd frontend && npm test
cd backend && npm test
```

GitHub Actions runs the same commands on pull requests and pushes to `main`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`  | MongoDB connection string                                                                                                              |
| `REDIS_URL`    | Redis connection URL                                                                                                                   |
| `FRONTEND_URL` | Socket.IO CORS `origin` (falls back to `*` if unset). Express `cors()` is enabled with default options and does not use this variable. |
| `PORT`         | HTTP port (defaults to `3000`)                                                                                                         |

### Frontend (`frontend/.env`)

| Variable       | Description                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| `VITE_API_URL` | Backend base URL for REST and Socket.IO (falls back to `http://localhost:3000`) |

`.env` files are listed in the root `.gitignore` and should not be committed.

---

## API

| Method | Path        | Description                                                          |
| ------ | ----------- | -------------------------------------------------------------------- |
| `GET`  | `/`         | Returns plain text confirming the process is listening               |
| `GET`  | `/launches` | Upcoming launches from Redis, or MongoDB if the cache key is missing |

### Socket.IO

| Event                       | Direction       | Description                                                                 |
| --------------------------- | --------------- | --------------------------------------------------------------------------- |
| `connection` / `disconnect` | Client ↔ Server | Connection lifecycle (logged on the server; drives Live Feed in the client) |
| `live-launch-data`          | Server → Client | Parsed `upcoming-launches` Redis payload after a Pub/Sub notification       |

---

## Deployment

| Service  | Platform |
| -------- | -------- |
| Frontend | Vercel   |
| Backend  | Render   |

The repository is on GitHub and connected to those hosts. Configure platform env vars to match the tables above (`VITE_API_URL` on Vercel; `MONGODB_URI`, `REDIS_URL`, `FRONTEND_URL`, and `PORT` on Render as needed).

---

## Data Source

```
GET https://ll.thespacedevs.com/2.3.0/launches/upcoming/
```

- Cron schedule: every **5 minutes** (`*/5 * * * *`)
- An initial fetch also runs when the worker module loads
- Worker Redis write TTL: **86400 seconds** (24 hours)
- On `GET /launches` cache miss, the server may write MongoDB results to Redis with a **120 second** TTL

---

## License

`backend/package.json` lists `ISC`. The frontend package is marked `"private": true`. There is no project-level `LICENSE` file.
