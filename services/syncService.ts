import { dbInstance } from '../db/idb';

const BACKEND = ((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/$/, '');

export async function processSyncQueue(): Promise<void> {
  if (!navigator.onLine) return;

  const queue = await dbInstance.getSyncQueue();
  if (!queue.length) return;

  // Get session so we can attach user info to each entry
  const session = await dbInstance.getSession();

  const results = await Promise.all(
    queue.map(async entry => {
      try {
        const payload = {
          ...entry,
          // Attach user profile fields needed for bs_users upsert
          displayName:  session?.displayName || entry.userId,
          avatarColor:  session?.avatarColor  || '#2563EB',
          isGuest:      session?.isGuest      ?? true,
        };
        const res = await fetch(`${BACKEND}/sync`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
        return res.ok;
      } catch {
        return false;
      }
    })
  );

  // Only clear entries that synced successfully
  const allOk = results.every(Boolean);
  if (allOk) {
    await dbInstance.clearSyncQueue();
    window.dispatchEvent(new Event('bluestock-sync-complete'));
  }
}
