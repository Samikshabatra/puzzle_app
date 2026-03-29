import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import * as crypto from 'crypto';

// ─── DB pool (works with Supabase or Vercel Postgres — both inject POSTGRES_URL)
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// ─── Auto-migrate on first cold start ────────────────────────────────────────
let migrated = false;
async function ensureSchema() {
  if (migrated) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS bs_users (
        user_id      TEXT PRIMARY KEY,
        display_name TEXT    NOT NULL DEFAULT 'Anonymous',
        is_guest     BOOLEAN NOT NULL DEFAULT true,
        avatar_color TEXT    NOT NULL DEFAULT '#2563EB',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bs_scores (
        id           SERIAL PRIMARY KEY,
        user_id      TEXT    NOT NULL REFERENCES bs_users(user_id) ON DELETE CASCADE,
        date         DATE    NOT NULL,
        score        INTEGER NOT NULL CHECK (score >= 0 AND score <= 3000),
        time_taken   INTEGER NOT NULL CHECK (time_taken >= 0 AND time_taken <= 7200),
        difficulty   INTEGER NOT NULL DEFAULT 1,
        puzzle_type  TEXT    NOT NULL DEFAULT 'word_master',
        proof        TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, date)
      );

      CREATE INDEX IF NOT EXISTS idx_bs_scores_date  ON bs_scores(date);
      CREATE INDEX IF NOT EXISTS idx_bs_scores_score ON bs_scores(score DESC);
    `);
    migrated = true;
  } finally {
    client.release();
  }
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ─── Proof verification ───────────────────────────────────────────────────────
function verifyProof(userId: string, date: string, score: number, proof: string): boolean {
  const secret   = process.env.PUZZLE_SECRET || 'bluestock_secret_2024';
  const expected = crypto.createHash('sha256')
    .update(`${userId}:${date}:${score}:${secret}`)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(proof, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
async function health(res: VercelResponse) {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ status: 'error', message: e.message });
  }
}

async function leaderboard(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
  } catch (e: any) {
    console.error('[Bluestock] DB schema error:', e.message);
    res.status(503).json({ error: 'Database unavailable', leaderboard: [] });
    return;
  }

  const tab = (req.query.tab as string) || 'today';

  const dateClause =
    tab === 'today' ? `AND s.date = CURRENT_DATE` :
    tab === 'week'  ? `AND s.date >= CURRENT_DATE - INTERVAL '7 days'` :
    '';

  try {
    const { rows } = await pool.query(`
      SELECT
        u.user_id,
        u.display_name,
        u.is_guest,
        u.avatar_color,
        MAX(s.score)       AS score,
        MIN(s.time_taken)  AS time_taken,
        MAX(s.difficulty)  AS difficulty,
        MAX(s.puzzle_type) AS puzzle_type,
        COUNT(*)::int      AS games_played
      FROM bs_scores s
      JOIN bs_users u ON u.user_id = s.user_id
      WHERE 1=1 ${dateClause}
      GROUP BY u.user_id, u.display_name, u.is_guest, u.avatar_color
      ORDER BY score DESC, time_taken ASC
      LIMIT 100
    `);

    res.json({
      leaderboard: rows.map((r, i) => ({
        rank:        i + 1,
        userId:      r.user_id,
        displayName: r.display_name,
        isGuest:     r.is_guest,
        avatarColor: r.avatar_color,
        score:       Number(r.score),
        timeTaken:   Number(r.time_taken),
        difficulty:  Number(r.difficulty),
        puzzleType:  r.puzzle_type,
        gamesPlayed: Number(r.games_played),
      })),
      tab,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[Bluestock] Leaderboard query error:', e.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard', leaderboard: [] });
  }
}

async function syncScore(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' }); return;
  }
  await ensureSchema();

  const { userId, displayName, isGuest, avatarColor,
          date, score, timeTaken, difficulty, puzzleType, proof } = req.body || {};

  // Validation
  if (!userId || !date || score == null || timeTaken == null) {
    res.status(400).json({ error: 'Missing: userId, date, score, timeTaken' }); return;
  }
  if (score < 0 || score > 3000) {
    res.status(400).json({ error: 'Score out of range' }); return;
  }
  if (timeTaken < 1 || timeTaken > 7200) {
    res.status(400).json({ error: 'timeTaken out of range' }); return;
  }
  const today = new Date().toISOString().slice(0, 10);
  if (date > today) {
    res.status(400).json({ error: 'Future dates rejected' }); return;
  }
  if (proof && !isGuest && !verifyProof(userId, date, score, proof)) {
    res.status(403).json({ error: 'Invalid proof' }); return;
  }

  // Upsert user
  await pool.query(`
    INSERT INTO bs_users (user_id, display_name, is_guest, avatar_color)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id) DO UPDATE
      SET display_name = EXCLUDED.display_name,
          avatar_color = EXCLUDED.avatar_color
  `, [userId, displayName || 'Anonymous', isGuest ?? true, avatarColor || '#2563EB']);

  // Upsert score — keep the best
  const { rows } = await pool.query(`
    INSERT INTO bs_scores (user_id, date, score, time_taken, difficulty, puzzle_type, proof)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id, date) DO UPDATE
      SET score      = GREATEST(bs_scores.score, EXCLUDED.score),
          time_taken = CASE
            WHEN EXCLUDED.score >= bs_scores.score THEN EXCLUDED.time_taken
            ELSE bs_scores.time_taken END,
          difficulty  = EXCLUDED.difficulty,
          puzzle_type = EXCLUDED.puzzle_type,
          proof       = EXCLUDED.proof
    RETURNING *
  `, [userId, date, score, timeTaken, difficulty || 1, puzzleType || 'word_master', proof || null]);

  res.json({ success: true, record: rows[0] });
}

async function userStats(req: VercelRequest, res: VercelResponse) {
  await ensureSchema();
  // Extract userId from URL: /user/:userId/stats
  const parts  = (req.url || '').split('/').filter(Boolean);
  const userId = parts[1];
  if (!userId) { res.status(400).json({ error: 'userId required' }); return; }

  const { rows } = await pool.query(`
    SELECT
      COUNT(*)::int        AS total_games,
      COALESCE(MAX(score), 0)         AS best_score,
      COALESCE(AVG(score)::int, 0)    AS avg_score,
      COALESCE(MIN(time_taken), 0)    AS best_time,
      SUM(CASE WHEN difficulty = 3 THEN 1 ELSE 0 END)::int AS hard_solved
    FROM bs_scores
    WHERE user_id = $1
  `, [userId]);

  res.json({ stats: rows[0] || {} });
}

// ─── Main router ──────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const url = req.url || '';

  try {
    if (url.includes('/health'))      { await health(res);             return; }
    if (url.includes('/leaderboard')) { await leaderboard(req, res);   return; }
    if (url.includes('/sync'))        { await syncScore(req, res);     return; }
    if (url.includes('/user'))        { await userStats(req, res);     return; }
    res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[Bluestock API]', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
}
