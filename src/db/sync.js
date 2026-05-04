// SIMPAH - Offline Sync Simulation
import { getDB } from './schema.js';
import { setState, getState } from '../utils/helpers.js';

let syncInterval = null;

export function initSync() {
  // Monitor online/offline status
  window.addEventListener('online', () => {
    setState('online', true);
    triggerSync();
  });
  window.addEventListener('offline', () => {
    setState('online', false);
  });

  setState('online', navigator.onLine);
  setState('syncStatus', 'idle');
  setState('pendingSync', 0);

  // Periodic sync check every 30 seconds
  syncInterval = setInterval(() => {
    if (navigator.onLine) {
      triggerSync();
    }
    updatePendingCount();
  }, 30000);

  updatePendingCount();
}

export async function triggerSync() {
  if (getState('syncStatus') === 'syncing') return;

  setState('syncStatus', 'syncing');

  try {
    const db = await getDB();
    let unsynced;
    try {
      unsynced = await db.getAllFromIndex('waste_records', 'synced', false);
    } catch (e) {
      // Fallback: boolean keys may not work in all browsers
      const all = await db.getAll('waste_records');
      unsynced = all.filter(r => r.synced === false);
    }

    if (unsynced.length === 0) {
      setState('syncStatus', 'idle');
      setState('pendingSync', 0);
      return;
    }

    // Simulate server sync with delay
    for (const record of unsynced) {
      await simulateServerSync(record);
      record.synced = true;
      await db.put('waste_records', record);
    }

    setState('syncStatus', 'success');
    setState('pendingSync', 0);
    setState('lastSync', new Date().toISOString());

    setTimeout(() => {
      setState('syncStatus', 'idle');
    }, 3000);

  } catch (e) {
    console.error('Sync failed:', e);
    setState('syncStatus', 'error');
    setTimeout(() => {
      setState('syncStatus', 'idle');
    }, 5000);
  }
}

async function updatePendingCount() {
  try {
    const db = await getDB();
    let unsynced;
    try {
      unsynced = await db.getAllFromIndex('waste_records', 'synced', false);
    } catch (e) {
      const all = await db.getAll('waste_records');
      unsynced = all.filter(r => r.synced === false);
    }
    setState('pendingSync', unsynced.length);
  } catch (e) {
    // ignore
  }
}

function simulateServerSync(record) {
  return new Promise((resolve) => {
    // Simulate network delay (200-800ms)
    const delay = 200 + Math.random() * 600;
    setTimeout(resolve, delay);
  });
}

export function destroySync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
