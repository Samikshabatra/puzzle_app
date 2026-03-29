import { openDB, IDBPDatabase } from 'idb';
import { DailyActivity, UserSession, Achievement, PuzzleProgress, SyncQueueEntry } from '../types';

interface BluestockSchema {
  dailyActivity:  { key: string; value: DailyActivity };
  puzzleProgress: { key: string; value: PuzzleProgress };
  achievements:   { key: string; value: Achievement };
  syncQueue:      { key: number; value: SyncQueueEntry; autoIncrement: true };
  session:        { key: string; value: UserSession };
  settings:       { key: string; value: unknown };
}

let _db: IDBPDatabase<BluestockSchema> | null = null;

async function getDB(): Promise<IDBPDatabase<BluestockSchema>> {
  if (_db) return _db;
  _db = await openDB<BluestockSchema>('bluestock-db', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('dailyActivity'))
        db.createObjectStore('dailyActivity', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('puzzleProgress'))
        db.createObjectStore('puzzleProgress', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('achievements'))
        db.createObjectStore('achievements', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('syncQueue'))
        db.createObjectStore('syncQueue', { autoIncrement: true });
      if (!db.objectStoreNames.contains('session'))
        db.createObjectStore('session');
      if (!db.objectStoreNames.contains('settings'))
        db.createObjectStore('settings');
    },
  });
  return _db;
}

class BluestockDB {
  // ─── Daily Activity ──────────────────────────────────────────────────────
  async getDailyActivity(date: string): Promise<DailyActivity | undefined> {
    return (await getDB()).get('dailyActivity', date);
  }
  async saveDailyActivity(activity: DailyActivity): Promise<void> {
    await (await getDB()).put('dailyActivity', activity);
  }
  async getAllDailyActivity(): Promise<DailyActivity[]> {
    return (await getDB()).getAll('dailyActivity');
  }

  // ─── Puzzle Progress ─────────────────────────────────────────────────────
  async getPuzzleProgress(date: string): Promise<PuzzleProgress | undefined> {
    return (await getDB()).get('puzzleProgress', date);
  }
  async savePuzzleProgress(progress: PuzzleProgress): Promise<void> {
    await (await getDB()).put('puzzleProgress', progress);
  }

  // ─── Achievements ────────────────────────────────────────────────────────
  async getAchievements(): Promise<Achievement[]> {
    return (await getDB()).getAll('achievements');
  }
  async saveAchievement(achievement: Achievement): Promise<void> {
    await (await getDB()).put('achievements', achievement);
  }

  // ─── Sync Queue ──────────────────────────────────────────────────────────
  async addToSyncQueue(entry: SyncQueueEntry): Promise<void> {
    await (await getDB()).add('syncQueue', entry as any);
  }
  async getSyncQueue(): Promise<SyncQueueEntry[]> {
    return (await getDB()).getAll('syncQueue') as Promise<SyncQueueEntry[]>;
  }
  async clearSyncQueue(): Promise<void> {
    await (await getDB()).clear('syncQueue');
  }

  // ─── Session ─────────────────────────────────────────────────────────────
  async getSession(): Promise<UserSession | null> {
    const s = await (await getDB()).get('session', 'current');
    return (s as UserSession) ?? null;
  }
  async saveSession(session: UserSession): Promise<void> {
    await (await getDB()).put('session', session, 'current');
  }
  async clearSession(): Promise<void> {
    await (await getDB()).delete('session', 'current');
  }
}

export const dbInstance = new BluestockDB();

// Flush protection on tab close (no-op needed since IDB writes are immediate)
if (typeof window !== 'undefined') {
  const noop = () => {};
  window.addEventListener('beforeunload', noop);
  document.addEventListener('visibilitychange', noop);
}
