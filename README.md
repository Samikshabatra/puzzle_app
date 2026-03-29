# Bluestock — Neural Puzzle Platform

## Local Development

### Option 1 — Frontend only (no leaderboard)
```bash
npm install
npm run dev
```
Open http://localhost:3000
The puzzle game works fully. Leaderboard will show "No scores yet" (no backend needed).

### Option 2 — Full stack with leaderboard
```bash
npm install
# In terminal 1:
POSTGRES_URL=your_connection_string node server.mjs
# In terminal 2:
npm run dev
```

### Option 3 — One command (requires concurrently)
```bash
npm install
POSTGRES_URL=your_connection_string npm run dev:full
```

## Deploying to Vercel

1. Push your code to GitHub
2. Import the repo on vercel.com
3. Set these environment variables in Vercel dashboard:
   - `POSTGRES_URL` — your Supabase or Vercel Postgres connection string
   - `PUZZLE_SECRET` — any secret string (e.g. a random UUID)
4. Deploy — the `vercel.json` handles all routing automatically

## Getting a free PostgreSQL database (Supabase)

1. Go to supabase.com → New project
2. Settings → Database → Connection string → URI
3. Copy the URI and set it as `POSTGRES_URL` in Vercel
4. Tables are created automatically on first API call (auto-migrate)

