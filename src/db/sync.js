// SIMPAH - Offline Sync Simulation
import { getDB } from './schema.js';
import { setState, getState } from '../utils/helpers.js';
import { supabase } from '../lib/supabase.js';
import { uploadBase64Image } from '../lib/storage.js';

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
    const queues = ['waste_records', 'complaints', 'incidental_events'];
    let totalUnsynced = 0;
    
    for (const table of queues) {
      let unsynced = [];
      try {
        unsynced = await db.getAllFromIndex(table, 'synced', false);
      } catch (e) {
        const all = await db.getAll(table);
        unsynced = all.filter(r => r.synced === false);
      }
      totalUnsynced += unsynced.length;

      // Upload to Supabase per table
      for (const record of unsynced) {
        // Abaikan data demo (ditandai oleh seed dengan is_demo: true)
        if (record.is_demo) {
          record.synced = true;
          await db.put(table, record);
          continue;
        }

        const payload = { ...record };
        
        // Hapus properti lokal
        delete payload.synced;
        if (payload.date_str) {
           if (table === 'waste_records') payload.record_date = payload.date_str;
           delete payload.date_str;
        }
        delete payload.created_by;
        delete payload.photos; // Local helper
        delete payload.photo_count; // Local helper
        delete payload.destination; // Local helper
        delete payload.is_accumulation; // Local helper
        delete payload.accumulation_days; // Local helper
        delete payload.accumulation_total_kg; // Local helper
        delete payload.desa_id; // Local helper
        
        // Sesuaikan user_id
        if (!payload.user_id && record.created_by && table !== 'complaints') {
           payload.user_id = record.created_by;
        }
        
        // Unggah foto jika ada
        if (!payload.photo_url && record.photos && record.photos.length > 0 && record.photos[0].dataUrl) {
          const bucket = 'simpah_media';
          const ext = record.photos[0].dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
          const path = `${table}/${record.id}/${Date.now()}.${ext}`;
          const publicUrl = await uploadBase64Image(bucket, path, record.photos[0].dataUrl);
          if (publicUrl) {
            payload.photo_url = publicUrl;
          }
        }
        
        const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
        
        if (error) {
          console.error(`Gagal upload data ${table}`, record.id, error);
          throw error;
        }
        
        if (table === 'waste_records' && record.type === 'pilah') {
           const sortedItems = await db.getAllFromIndex('sorted_waste', 'waste_record_id', record.id);
           if (sortedItems && sortedItems.length > 0) {
              const { error: sortedError } = await supabase.from('sorted_waste').upsert(sortedItems, { onConflict: 'id' });
              if (sortedError) console.error('Gagal upload sorted_waste', sortedError);
           }
        }
        
        record.synced = true;
        await db.put(table, record);
      }
    } // End table loop

    if (totalUnsynced === 0) {
      setState('syncStatus', 'idle');
      setState('pendingSync', 0);
      return;
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
    const queues = ['waste_records', 'complaints', 'incidental_events'];
    let total = 0;
    
    for (const table of queues) {
      try {
        const unsynced = await db.getAllFromIndex(table, 'synced', false);
        total += unsynced.length;
      } catch (e) {
        const all = await db.getAll(table);
        total += all.filter(r => r.synced === false).length;
      }
    }
    setState('pendingSync', total);
  } catch (e) {
    // ignore
  }
}


export function destroySync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
