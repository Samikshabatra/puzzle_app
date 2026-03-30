# Bluestock — Neural Puzzle Platform

> A daily science-themed word puzzle app with cryptograms, leaderboards, streaks, and offline support. One puzzle a day, shared by everyone.

**Live:** https://puzzle-app-inky.vercel.app/

---

## What is Bluestock?

Bluestock is a daily puzzle platform inspired by Wordle — but with a science and knowledge twist. Every day, all players get the same puzzle generated deterministically from the date. No server needed to generate puzzles — they're computed client-side using SHA-256.

There are two puzzle modes:

- **Word Master** — Unscramble letters to find a science-related word, guided by three clues. Topics range from neuroscience and quantum physics to palaeontology and topology.
- **Cryptogram** — Decode a famous quote using a Caesar-style cipher. Quotes from Einstein, Sagan, Socrates, and more.

Difficulty scales from Easy → Medium → Hard, and your score is based on time taken and hints used.

---

## Features

- 🧩 **Daily puzzles** — deterministic, seed-based, same puzzle for every player worldwide
- 🔐 **Two puzzle types** — Word Master (anagram) and Cryptogram (cipher)
- 🏆 **Global leaderboard** — Today / This Week / All Time tabs
- 🔥 **Streak tracking** — consecutive daily solve streaks
- 📅 **Archives / Heatmap** — browse and replay past puzzles
- 🏅 **Achievements** — speed runs, no hints, hard mode completions
- 📶 **Offline support** — full PWA with service worker caching
- 🔄 **Background sync** — scores queued locally and synced when online
- 👤 **Guest or named accounts** — no signup required to play
- 📱 **Installable** — works as a mobile/desktop PWA

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Local storage | IndexedDB (via `idb`) |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | PostgreSQL (Supabase) |
| PWA | Service Worker, Web App Manifest |
| Deployment | Vercel |

---

## Project Structure

```
bluestock/
├── api/
│   └── index.ts          # Vercel serverless API (leaderboard, sync, health)
├── components/
│   ├── PuzzleBoard.tsx   # Word Master puzzle UI
│   ├── SequenceBoard.tsx # Cryptogram puzzle UI
│   ├── Leaderboard.tsx   # Global rankings
│   ├── Heatmap.tsx       # Calendar archive view
│   ├── ProfileView.tsx   # User stats and achievements
│   └── LoginScreen.tsx   # Guest / named login
├── hooks/
│   └── usePuzzle.ts      # Core game state machine
├── services/
│   ├── deterministicPuzzle.ts  # SHA-256 daily puzzle generation
│   ├── syncService.ts          # Score sync queue
│   └── streakService.ts        # Streak calculation
├── db/
│   └── idb.ts            # IndexedDB wrapper
├── public/
│   ├── manifest.json     # PWA manifest
│   └── icons/            # App icons (192px, 512px)
├── server.mjs            # Local dev API server
├── sw.js                 # Service worker
├── App.tsx               # Root component, routing, nav
├── types.ts              # Shared TypeScript types
└── vercel.json           # Vercel routing config
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Local Development

**Frontend only** (puzzle works, leaderboard shows empty):

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Full stack** (leaderboard + score sync enabled):

```bash
npm install
```

Terminal 1 — API server:
```bash
node server.mjs
```

Terminal 2 — Frontend:
```bash
npm run dev
```

Or run both together:
```bash
npm run dev:full
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# For local dev — points frontend to the local API server
VITE_BACKEND_URL=http://localhost:4000

# Your PostgreSQL connection string (Supabase or Vercel Postgres)
POSTGRES_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

> The `server.mjs` dev server auto-loads `.env.local` — no need to set env vars manually.

---

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Set **Root Directory** to blank (files are at the repo root)
4. Add these **Environment Variables** in Vercel dashboard:

| Variable | Value |
|---|---|
| `POSTGRES_URL` | Your Supabase/Vercel Postgres URI |
| `PUZZLE_SECRET` | Any secret string (used for score proof verification) |

5. Deploy — the database schema is created automatically on first API call

### Getting a free database (Supabase)

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings → Database → Connection string → URI**
4. Copy the URI and paste it as `POSTGRES_URL` in Vercel

---

## How Puzzles Work

Puzzles are generated entirely client-side — no API call needed:

```
SHA-256(date string) → numeric seed → select word/quote from bank → scramble letters / build cipher
```

This guarantees every player worldwide gets the identical puzzle each day, with no backend involvement. Scores are verified server-side using a SHA-256 proof (`userId + date + score + secret`) to prevent tampering.

---

## API Endpoints

All endpoints are handled by `api/index.ts` and routed via `vercel.json`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | DB connection check |
| `GET` | `/leaderboard?tab=today\|week\|alltime` | Fetch ranked scores |
| `POST` | `/sync` | Submit a completed puzzle score |
| `GET` | `/user/:userId/stats` | Fetch a user's all-time stats |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run dev:api` | Start local API server on port 4000 |
| `npm run dev:full` | Start both frontend and API together |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |

---

## License

MIT

---

Built with ☕ by [Samiksha Batra](https://github.com/Samikshabatra)
