# LaunchOps

A real-time dashboard for tracking upcoming rocket launches.

![LaunchOps console showing the launch queue, day-and-night Earth, and selected mission](docs/console.jpg)

LaunchOps combines launch schedules, mission details, local countdowns, webcasts, and a launch-site catalog in a responsive mission-control interface. Data comes from [The Space Devs Launch Library](https://thespacedevs.com/), is cached through Redis and MongoDB, and reaches the browser through REST and Socket.IO.

## Highlights

- Live launch queue with sticky selection, keyboard navigation, local NET times, and honest TBD/TBC precision
- Mission, vehicle, provider, customer, orbit, launch site, and status details
- T− and T+ countdowns with launch-state-aware labels such as `LIVE`, `HOLD`, and `STREAM`
- Embedded YouTube webcasts, with outbound links for X and other providers
- Interactive Earth: flies to the selected pad, marks the upcoming pad constellation, and shows quieter catalog sites
- Drag-to-yaw globe with fling inertia; click a pad or site to inspect it
- Location inspector for catalog sites — imagery, lifetime metrics, and still-upcoming launches at that site
- Launch Site tile on the mission card opens the matching location panel when the catalog joins
- Real-time launch and location cache updates over Socket.IO
- Solar-time Earth visualization with a day/night terminator
- Shared 12/24-hour clock preference and responsive layouts from phone to desktop

## How it works

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
     live-launch-data           live-location-data
                  \                  /
                     React client
```

The backend starts the ingestion worker with the API server. The worker fetches upcoming launches on a five-minute cadence and the locations catalog about every twelve hours, maps each external payload to LaunchOps' stored model, upserts MongoDB, refreshes Redis, and publishes an update. Clients hydrate through `GET /launches` and `GET /locations`; subsequent refreshes arrive over Socket.IO without reloading the page.

On the globe, queue pads are drawn from still-upcoming launches (NET in the future). Active Earth sites from the locations catalog fill in as quieter markers where the queue does not already mark the coast. Selecting a pad or site opens the mission card or location inspector; Upcoming site counts ignore past-NET rows even when Launch Library status lags (for example a sticky `In Flight`).

Webcast ranking stays in the frontend because availability can change with each feed refresh. LaunchOps prefers YouTube for in-app playback, then X, then other providers, while favoring live and official sources.

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, Framer Motion
- **Visualization:** three.js and React Three Fiber
- **Backend:** Node.js, Express 5, Socket.IO
- **Data:** MongoDB, Redis, The Space Devs Launch Library 2.3
- **Testing:** Vitest and Node's built-in test runner
- **Deployment:** Vercel frontend and Render backend

## Run locally

### Prerequisites

- Node.js 22+
- A MongoDB connection string
- A Redis connection URL

### 1. Clone and install

```bash
git clone https://github.com/brshin/launch-ops.git
cd launch-ops

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the backend

Create `backend/.env`:

```env
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_url
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### 3. Configure the frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

### 4. Start both services

In one terminal:

```bash
cd backend
node server.js
```

In another:

```bash
cd frontend
npm run dev -- --host
```

Open [http://localhost:5173](http://localhost:5173). The `--host` flag also makes the Vite preview available to devices on the same network.

## Development commands

Run tests:

```bash
cd frontend && npm test
cd backend && npm test
```

Lint or build the frontend:

```bash
cd frontend
npm run lint
npm run build
```

GitHub Actions runs both test suites for pull requests and pushes to `main`.

## Runtime contracts

### Environment variables

| Variable | Service | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Backend | MongoDB connection string |
| `REDIS_URL` | Backend | Redis cache and Pub/Sub connection |
| `FRONTEND_URL` | Backend | Allowed Socket.IO frontend origin; defaults to `*` |
| `PORT` | Backend | HTTP port; defaults to `3000` |
| `VITE_API_URL` | Frontend | REST and Socket.IO base URL; defaults to `http://localhost:3000` |

Local `.env` files are ignored by Git and should not be committed.

### HTTP and Socket.IO

| Contract | Purpose |
| --- | --- |
| `GET /` | Backend health response |
| `GET /launches` | Upcoming launches from Redis, falling back to MongoDB |
| `GET /locations` | Launch-site catalog from Redis, falling back to MongoDB |
| `live-launch-data` | Server-to-client Socket.IO event after a launch ingestion refresh |
| `live-location-data` | Server-to-client Socket.IO event after a locations ingestion refresh |

The worker requests:

```text
GET https://ll.thespacedevs.com/2.3.0/launches/upcoming/?mode=detailed
GET https://ll.thespacedevs.com/2.3.0/locations/?format=json&limit=100
```

Detailed launch mode is required for webcast URLs. Launches refresh once at startup and every five minutes thereafter. Locations paginate the full catalog, refresh once at startup, and again about every twelve hours.

## Repository layout

```text
launch-ops/
├── backend/                # Express API, ingestion worker, models, and tests
├── frontend/
│   ├── public/             # Static assets and Earth textures
│   └── src/
│       ├── components/     # Console, launch card, location panel, queue, and globe UI
│       ├── hooks/          # Launch/location feeds, clock, countdown, and responsive state
│       ├── types/          # Frontend domain types
│       └── utils/          # Launch/location helpers, globe focus, and contract tests
├── docs/                   # README imagery
└── .github/workflows/      # Continuous integration
```

## Data source

Launch and location data are provided by [The Space Devs](https://thespacedevs.com/). LaunchOps stores only the fields used by the application and treats provisional launch times as provisional rather than displaying false countdown precision.
