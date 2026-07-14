# Pulse — URL Uptime Monitor

A lightweight uptime monitor. Add any URL, check its status on demand or automatically every 60 seconds, and watch response time and availability from a live dashboard.

## Features

- Add / remove URLs to monitor
- Manual "Check now" per monitor, plus automatic background checks every 60s
- Live dashboard with online / pending / offline counts
- Response time tracking per check
- Relative "last checked" timestamps
- Dark, status-driven UI (teal = online, amber = pending, coral = offline)

## Tech stack

- **Backend:** Node.js, Express, `cors`
- **Frontend:** React (Vite/CRA-style functional component), [`lucide-react`](https://lucide.dev/) for icons
- **Storage:** in-memory array (no database — data resets on server restart)

## Project structure

```
.
├── server.js       # Express API + background check loop
└── App.jsx         # React dashboard
```

## Getting started

### 1. Backend

```bash
npm install express cors
node server.js
```

Runs at `http://localhost:8080`.

### 2. Frontend

Drop `App.jsx` into your React project's `src/` folder, then:

```bash
npm install lucide-react
npm run dev
```

`App.jsx` points at `BASE_URL = "http://localhost:8080"` — update this if your backend runs elsewhere.

## API reference

| Method | Endpoint              | Description                          |
|--------|------------------------|--------------------------------------|
| GET    | `/monitors`            | List all monitors                    |
| POST   | `/monitors`             | Add a monitor — body: `{ name, url }` |
| GET    | `/monitors/:id`         | Get a single monitor                 |
| DELETE | `/monitors/:id`         | Remove a monitor                     |
| GET    | `/monitors/:id/check`   | Run a check now, updates and returns the monitor |

### Monitor object

```json
{
  "id": 1731600000000,
  "name": "GitHub",
  "url": "https://github.com",
  "status": "online | offline | pending",
  "responseTime": 214,
  "lastChecked": "2026-07-14T10:32:00.000Z",
  "createdAt": "2026-07-14T10:00:00.000Z"
}
```

## Known limitation: "offline" doesn't always mean down

A check is marked `offline` if the request throws **or** the response status isn't in the 2xx range. Some sites (LinkedIn, Pinterest, and other bot-sensitive platforms) return non-2xx responses to plain server-side requests — not because they're down, but because they're blocking traffic that doesn't look like a real browser (missing `User-Agent`, no session/cookies, no JS execution). This is especially true for auth-walled pages like LinkedIn profiles.

Two improvements that help:

- **Send a realistic `User-Agent` header** to reduce false positives from basic bot filters.
- **Store and display the actual HTTP status code**, not just online/offline, so a `403`/`999` (blocked) is visibly different from a timeout or connection failure (actually down).

Sites that actively fingerprint and block scripted requests (e.g. LinkedIn) may never check reliably from a server-side monitor, regardless of headers — that's expected behavior, not a bug.

## Possible next steps

- Persist monitors to a database instead of memory
- Configurable check interval per monitor
- Uptime history / percentage over time
- Email or webhook alerts on status change
- Response status code + response body size in the check result
