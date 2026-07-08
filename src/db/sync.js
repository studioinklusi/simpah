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

        // Gunakan pendekatan whitelist: hanya kirim field yang ada di tabel Supabase
        // untuk mencegah error karena kolom tidak dikenal
        const WASTE_RECORD_FIELDS = [
          'id', 'type', 'category_sipsn', 'source_type', 'weight_kg',
          'lat', 'lng', 'location_id', 'location_name',
          'fleet_id', 'fleet_plate', 'notes', 'photo_url',
          'user_id', 'user_name', 'record_date', 'created_at',
          'verification_status', 'verified_at', 'verified_by', 'verification_notes',
          'treatment_method', 'is_incidental',
          'is_batch', 'batch_id', 'batch_days', 'batch_start_date', 'batch_end_date',
          'desa_id'
        ];
        const COMPLAINT_FIELDS = [
          'id', 'tracking_number', 'reporter_user_id', 'reporter_name',
          'reporter_phone', 'reporter_email',
          'category', 'description', 'location_text', 'lat', 'lng',
          'photo_url', 'status', 'is_anonymous', 'created_at', 'updated_at',
          'response_text', 'responded_at', 'responded_by'
        ];
        const INCIDENTAL_FIELDS = [
          'id', 'type', 'description', 'location_text', 'lat', 'lng',
          'photo_url', 'weight_kg', 'user_id', 'user_name',
          'location_id', 'location_name', 'created_at',
          'category_sipsn', 'desa_id'
        ];
        
        const fieldMap = {
          waste_records: WASTE_RECORD_FIELDS,
          complaints: COMPLAINT_FIELDS,
          incidental_events: INCIDENTAL_FIELDS
        };
        
        const allowedFields = fieldMap[table];
        const payload = {};
        
        if (allowedFields) {
          for (const key of allowedFields) {
            if (key in record) {
              payload[key] = record[key];
            }
          }
        } else {
          // Fallback: salin semua kecuali field yang pasti lokal
          Object.assign(payload, record);
          delete payload.synced;
          delete payload.photos;
          delete payload.photo_count;
          delete payload.is_demo;
          delete payload.created_by;
        }
        
        // Konversi date_str → record_date untuk waste_records
        if (table === 'waste_records' && !payload.record_date && record.date_str) {
          payload.record_date = record.date_str;
        }
        
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
          // Jika error karena kolom tidak dikenal, coba hapus kolom bermasalah dan retry
          const colMatch = error.message?.match(/column "([^"]+)" of relation/);
          if (colMatch) {
            const badCol = colMatch[1];
            console.warn(`[Sync] Kolom "${badCol}" tidak ada di tabel ${table}, menghapus dan mencoba ulang...`);
            delete payload[badCol];
            const { error: retryError } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
            if (retryError) {
              console.error(`[Sync] Retry gagal untuk ${table}`, record.id, retryError);
              continue; // Lewati record ini, lanjut ke record berikutnya
            }
          } else {
            console.error(`[Sync] Gagal upload data ${table}`, record.id, error);
            continue; // Lewati record ini, lanjut ke record berikutnya
          }
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
