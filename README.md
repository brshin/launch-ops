# LaunchOps

Global launch tracker dashboard for upcoming rocket launches.

Data is fetched from [The Space Devs Launch Library](https://thespacedevs.com/), stored in MongoDB, cached in Redis, and delivered to a React frontend over REST and Socket.IO.

---

## Features

- **Launch Queue** — upcoming launches with local NET (`DD MMM · HH:MM`), provider abbreviation, and selection state
- **Mission detail panel** — provider, mission/rocket titles, Status chip, T-Minus / T-Plus countdown (`D:HH:MM:SS`), and provisional NET for TBD/TBC
- **T-Zero and coordinates** — local launch time with explicit `UTC±X` offset, launch window, pad name, and location
- **Mission Brief** — mission description with type/orbit chips (unknown metadata hidden)
- **Live Feed indicator** — Socket.IO connect/disconnect status in the queue header and card footer (event flash on link change)
- **Last Updated** — provider `last_updated` timestamp in Sys Time–style local formatting
- **Sys Time** — local clock with explicit timezone offset
- **HUD motion** — Framer Motion cold-load boot, launch-selection crossfade, ticking countdown with urgency, and calmer ambient chrome
- **Live UI updates** — when the worker refreshes the cache, Redis Pub/Sub notifies the server, which emits the new payload to connected Socket.IO clients
- **Cached API** — `GET /launches` reads Redis first, then MongoDB on a cache miss
- **Scheduled ingestion** — cron worker polls Launch Library every 5 minutes, upserts MongoDB, writes Redis, and publishes a cache-update message
- **Responsive UI** — status-based color coding and layout that adapts across viewports

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
5. On load, the frontend hydrates via `GET /launches` (Redis, then MongoDB on miss).
6. The client tracks Socket.IO `connect` / `disconnect` to drive the Live Feed indicator (including a one-shot flash when the uplink state changes).

The worker is required by `server.js`, so it runs in the same Node process as the API.

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
| Source control  | [GitHub](https://github.com/brshin/launch-ops)                       |

---

## Project Structure

```
launch-ops/
├── backend/
│   ├── models/
│   │   └── Launch.js          # Mongoose schema
│   ├── server.js              # Express API, Socket.IO, Redis subscriber
│   ├── worker.js              # Cron ingestion, Redis publish, Mongo upsert
│   └── package.json
│
├── frontend/
│   ├── public/                # favicon.svg, icons.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── LaunchCard.tsx        # Mission detail panel
│   │   │   ├── CountdownReadout.tsx  # Ticking countdown + status labels
│   │   │   └── FeedStatus.tsx        # Live/offline feed indicator
│   │   ├── hooks/
│   │   │   └── useConsoleBoot.ts     # Cold-load boot timing gate
│   │   ├── lib/
│   │   │   ├── motionTokens.ts       # Shared Framer transition presets
│   │   │   └── bootMotion.ts         # Boot-sequence motion variants
│   │   ├── types/
│   │   │   └── launch.ts             # Frontend launch types
│   │   ├── utils/
│   │   │   ├── launchTitle.ts        # Mission/rocket title helpers
│   │   │   └── localTime.ts          # Shared local date/time + UTC offset labels
│   │   ├── App.tsx                   # Queue, Socket.IO client, boot + layout
│   │   ├── main.jsx                  # React root, MotionConfig, Analytics
│   │   └── index.css
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

### 4. Production frontend build

```bash
cd frontend && npm run build && npm run preview
```

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
