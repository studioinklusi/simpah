import { getDB } from './schema.js';
import { supabase } from '../lib/supabase.js';
import { setState, getState } from '../utils/helpers.js';

let wasteChannel = null;
let complaintsChannel = null;

export function initRealtime() {
  const user = getState('user') || JSON.parse(sessionStorage.getItem('simpah_user'));
  if (!user) return; // Only subscribe when authenticated

  // Clean up existing subscriptions before setting up new ones
  cleanupRealtime();

  console.log('[Realtime] Initializing database subscription channels for user:', user.email);

  // Subscribe to waste_records Postgres changes
  wasteChannel = supabase
    .channel('waste-records-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'waste_records' },
      async (payload) => {
        console.log('[Realtime] waste_records change received:', payload);
        await handleDbChange('waste_records', payload, 'waste_records_updated');
      }
    )
    .subscribe();

  // Subscribe to complaints Postgres changes
  complaintsChannel = supabase
    .channel('complaints-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'complaints' },
      async (payload) => {
        console.log('[Realtime] complaints change received:', payload);
        await handleDbChange('complaints', payload, 'complaints_updated');
      }
    )
    .subscribe();
}

export function cleanupRealtime() {
  if (wasteChannel) {
    console.log('[Realtime] Cleaning up waste_records channel');
    supabase.removeChannel(wasteChannel);
    wasteChannel = null;
  }
  if (complaintsChannel) {
    console.log('[Realtime] Cleaning up complaints channel');
    supabase.removeChannel(complaintsChannel);
    complaintsChannel = null;
  }
}

async function handleDbChange(table, payload, stateKey) {
  try {
    const db = await getDB();
    const eventType = payload.eventType;

    if (eventType === 'DELETE') {
      const id = payload.old.id;
      if (id) {
        await db.delete(table, id);
        console.log(`[Realtime] Deleted ${table} record ${id} from IndexedDB cache`);
      }
    } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const newRecord = payload.new;
      if (newRecord && newRecord.id) {
        // Conflict resolution: only overwrite if local record is not unsynced
        const localItem = await db.get(table, newRecord.id);
        if (localItem && localItem.synced === false) {
          console.log(`[Realtime] Record ${newRecord.id} in ${table} has unsynced local edits. Skipping overwrite.`);
          return;
        }
        // Save to cache as synced
        newRecord.synced = true;
        await db.put(table, newRecord);
        console.log(`[Realtime] Synced ${table} record ${newRecord.id} to IndexedDB cache`);
      }
    }

    // Trigger state change to notify active views
    setState(stateKey, Date.now());
  } catch (e) {
    console.error(`[Realtime] Failed to handle database change for ${table}:`, e);
  }
}
