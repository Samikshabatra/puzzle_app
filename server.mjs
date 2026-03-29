// Local dev API server — mirrors the Vercel function for local testing
// Run with: node server.mjs
// Auto-loads .env.local for POSTGRES_URL and other variables

import http from 'http';
import fs from 'fs';
import path from 'path';

// ─── Load .env.local automatically ───────────────────────────────────────────
const envFile = path.resolve('.env.local');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key) process.env[key] = val;
  }
  console.log('\u{1F4C4} Loaded .env.local');
  console.log('   POSTGRES_URL:', process.env.POSTGRES_URL ? '\u2705 found' : '\u274C not found');
}
import { createHash, timingSafeEqual } from 'crypto';

let pool = null;

async function getPool() {
  if (pool) return pool;
  const url = process.env.POSTGRES_URL;
  if (!url) return null;
  try {
    const { default: pg } = await import('pg');
    const Pool = pg.Pool || pg.default?.Pool;
    // Supabase uses self-signed certs — disable strict SSL verification for local dev
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 3 });
    return pool;
  } catch {
    return null;
  }
}

async function ensureSchema(p) {
  await p.query(`
    CREATE TABLE IF NOT EXISTS bs_users (
      user_id TEXT PRIMARY KEY, display_name TEXT NOT NULL DEFAULT 'Anonymous',
      is_guest BOOLEAN NOT NULL DEFAULT true, avatar_color TEXT NOT NULL DEFAULT '#2563EB',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS bs_scores (
      id SERIAL PRIMARY KEY, user_id TEXT NOT NULL REFERENCES bs_users(user_id) ON DELETE CASCADE,
      date DATE NOT NULL, score INTEGER NOT NULL CHECK (score >= 0 AND score <= 3000),
      time_taken INTEGER NOT NULL CHECK (time_taken >= 0 AND time_taken <= 7200),
      difficulty INTEGER NOT NULL DEFAULT 1, puzzle_type TEXT NOT NULL DEFAULT 'word_master',
      proof TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (user_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_bs_scores_date  ON bs_scores(date);
    CREATE INDEX IF NOT EXISTS idx_bs_scores_score ON bs_scores(score DESC);
  `);
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(200).end(); return; }

  const url = new URL(req.url, 'http://localhost');
  const p = await getPool();

  try {
    // Health
    if (url.pathname === '/health') {
      if (!p) return json(res, 200, { status: 'ok', db: 'no POSTGRES_URL set' });
      await p.query('SELECT 1');
      return json(res, 200, { status: 'ok', db: 'connected' });
    }

    // Leaderboard
    if (url.pathname === '/leaderboard') {
      if (!p) return json(res, 200, { leaderboard: [], tab: url.searchParams.get('tab') || 'today', fetchedAt: new Date().toISOString() });
      await ensureSchema(p);
      const tab = url.searchParams.get('tab') || 'today';
      const dateClause = tab === 'today' ? `AND s.date = CURRENT_DATE` : tab === 'week' ? `AND s.date >= CURRENT_DATE - INTERVAL '7 days'` : '';
      const { rows } = await p.query(`
        SELECT u.user_id, u.display_name, u.is_guest, u.avatar_color,
          MAX(s.score) AS score, MIN(s.time_taken) AS time_taken,
          MAX(s.difficulty) AS difficulty, MAX(s.puzzle_type) AS puzzle_type, COUNT(*)::int AS games_played
        FROM bs_scores s JOIN bs_users u ON u.user_id = s.user_id
        WHERE 1=1 ${dateClause}
        GROUP BY u.user_id, u.display_name, u.is_guest, u.avatar_color
        ORDER BY score DESC, time_taken ASC LIMIT 100
      `);
      return json(res, 200, {
        leaderboard: rows.map((r, i) => ({
          rank: i + 1, userId: r.user_id, displayName: r.display_name,
          isGuest: r.is_guest, avatarColor: r.avatar_color,
          score: Number(r.score), timeTaken: Number(r.time_taken),
          difficulty: Number(r.difficulty), puzzleType: r.puzzle_type, gamesPlayed: Number(r.games_played),
        })),
        tab, fetchedAt: new Date().toISOString(),
      });
    }

    // Sync score
    if (url.pathname === '/sync' || url.pathname === '/sync/daily-scores' || url.pathname.startsWith('/sync')) {
      if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
      const body = await readBody(req);
      const { userId, displayName, isGuest, avatarColor, date, score, timeTaken, difficulty, puzzleType, proof } = body;
      console.log('[Dev API] Sync received:', { userId, date, score, timeTaken, displayName });
      if (!userId || !date || score == null || timeTaken == null) {
        console.error('[Dev API] Missing fields:', { userId, date, score, timeTaken });
        return json(res, 400, { error: 'Missing fields' });
      }
      if (!p) return json(res, 200, { success: true, note: 'No DB configured, score not persisted' });
      await ensureSchema(p);
      await p.query(`INSERT INTO bs_users (user_id, display_name, is_guest, avatar_color) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id) DO UPDATE SET display_name=EXCLUDED.display_name, avatar_color=EXCLUDED.avatar_color`,
        [userId, displayName || 'Anonymous', isGuest ?? true, avatarColor || '#2563EB']);
      const { rows } = await p.query(`
        INSERT INTO bs_scores (user_id, date, score, time_taken, difficulty, puzzle_type, proof)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (user_id, date) DO UPDATE
          SET score=GREATEST(bs_scores.score, EXCLUDED.score),
              time_taken=CASE WHEN EXCLUDED.score >= bs_scores.score THEN EXCLUDED.time_taken ELSE bs_scores.time_taken END,
              difficulty=EXCLUDED.difficulty, puzzle_type=EXCLUDED.puzzle_type, proof=EXCLUDED.proof
        RETURNING *
      `, [userId, date, score, timeTaken, difficulty || 1, puzzleType || 'word_master', proof || null]);
      return json(res, 200, { success: true, record: rows[0] });
    }

    json(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('[Dev API]', err.message);
    json(res, 500, { error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚀 Bluestock dev API running at http://localhost:${PORT}`);
  if (!process.env.POSTGRES_URL) {
    console.log('⚠️  No POSTGRES_URL set — leaderboard returns empty (not an error)');
    console.log('   Set POSTGRES_URL=your_connection_string to enable the database\n');
  } else {
    console.log('✅  POSTGRES_URL found — database enabled\n');
  }
});
