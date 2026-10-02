# type::race

A real-time multiplayer typing race. Create a room, share the 4-letter code,
and race friends with live WPM/accuracy tracking and a global leaderboard.

## Why this project is more than it looks like

The interesting engineering problem here isn't the typing UI — it's that
**the server, not the browser, is the source of truth for every race**.

If the client calculated its own WPM, anyone could open DevTools and set
`correctChars` to whatever they wanted before the "finished" event fired.
Instead:

- The server stamps `startTime` the moment a race actually begins.
- Clients only ever send *raw input state* (`correctChars`, `totalTyped`).
- The server computes WPM and accuracy itself, from its own clock and its
  own copy of the race text — never trusting a client-reported time or score.
- Finishes that are faster than a human could plausibly type (see
  `minPossibleMs` in `server/index.js`) are flagged and excluded from the
  global leaderboard, though still shown in that race's own results.

This is the same pattern real competitive-game backends use, just scoped
down to something buildable solo.

## Architecture

```
typing-race/
├── server/      Node + Express + Socket.io — rooms, race state, leaderboard
├── client/      React + Vite + socket.io-client
└── package.json root convenience script to run both at once
```

**Server** holds all room/race state in memory (a `Map` of room code →
room object). No database for the core game loop — rooms are ephemeral by
nature, so this is the right level of complexity, not a shortcut.

**Leaderboard** is a flat JSON file (`server/leaderboard.json`, gitignored,
created automatically). Deliberately the simplest possible persistence —
no native bindings, nothing to configure. The module (`server/leaderboard.js`)
only exposes `getTop()` / `addEntry()`, so swapping it for a real database
later (Postgres via Supabase, or SQLite via `better-sqlite3`) is a
one-file change, not a rewrite. Worth knowing before you deploy: on most
free hosting tiers the filesystem is ephemeral, so the leaderboard resets
on redeploy unless you add a real DB or a persistent disk.

**Client** is a single-page state machine (`App.jsx`) driven entirely by
socket events: `home → lobby → countdown → racing → results`. The typing
screen computes a *local, cosmetic* WPM for instant visual feedback while
you type, but the number that actually gets saved anywhere is the server's.

## Running locally

Needs two processes — the root `dev` script runs both with one command:

```bash
npm run install:all   # installs server/ and client/ separately
npm run dev           # runs both, labeled [server] and [client]
```

Or run them separately in two terminals if you'd rather see each log on
its own:

```bash
cd server && npm install && npm run dev   # http://localhost:4000
cd client && npm install && npm run dev   # http://localhost:5173
```

Open `http://localhost:5173` in two different browser windows (or one
normal + one incognito) to actually test the multiplayer part solo.

## Environment variables

Only the client needs one — copy `client/.env.example` to `client/.env`:

```
VITE_SERVER_URL=http://localhost:4000
```

Point this at your deployed server's URL in production.

## Deployment notes

The client (static Vite build) and server (long-running Socket.io process)
need **different kinds of hosting**:

- **Client** → Vercel, Netlify, or any static host. Standard Vite build.
- **Server** → needs a host that keeps a Node process alive and supports
  WebSockets — Render, Railway, or Fly.io all work on free/cheap tiers.
  **Vercel's serverless functions do not work for this** — they're
  request/response only and can't hold a persistent Socket.io connection.

After deploying the server, set the client's `VITE_SERVER_URL` env var
(on Vercel/Netlify) to the server's public URL, and make sure the server's
CORS origin (`server/index.js`, currently `*` for simplicity) is narrowed
to your actual client domain before calling this "production-ready."

## Possible next steps (good interview talking points, not yet built)

- Swap the JSON leaderboard for Postgres/SQLite
- Private rooms with a password
- Difficulty levels / custom text length
- Reconnection handling (currently a refresh mid-race drops you)
- Rate-limiting `typing_progress` events per socket
