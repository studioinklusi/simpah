// SIMPAH - Offline Sync Simulation
import { getDB } from './schema.js';
import { setState, getState } from '../utils/helpers.js';
import { supabase } from '../lib/supabase.js';
import { uploadBase64Image } from '../lib/storage.js';
import { showToast } from '../components/toast.js';

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

  // Jangan jalankan sync jika perangkat sedang offline
  if (!navigator.onLine) {
    setState('syncStatus', 'idle');
    return;
  }

  setState('syncStatus', 'syncing');

  try {
    const db = await getDB();
    const queues = ['waste_records', 'complaints', 'incidental_events'];
    let totalUnsynced = 0;
    let actualSynced = 0;
    
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
          'category', 'description', 'address', 'lat', 'lng',
          'photo_url', 'status', 'is_anonymous', 'created_at', 'updated_at',
          'response_text', 'responded_at', 'responded_by'
        ];
        const INCIDENTAL_FIELDS = [
          'id', 'type', 'title', 'description', 'location_text', 'lat', 'lng',
          'photo_url', 'weight_kg', 'participants', 'user_id', 'user_name',
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
        
        // Map source_type to database check constraint values
        if (payload.source_type === 'sumber_langsung') {
          payload.source_type = 'langsung';
        } else if (payload.source_type === 'fasilitas') {
          payload.source_type = 'fasilitas_lain';
        }
        
        // Sesuaikan user_id
        if (!payload.user_id && record.created_by && table !== 'complaints') {
           payload.user_id = record.created_by;
        }

        // Normalisasi address & location_text untuk complaints
        if (table === 'complaints') {
          if (!payload.address && (record.location_text || record.address)) {
            payload.address = record.address || record.location_text;
          }
          if (!payload.location_text && (record.address || record.location_text)) {
            payload.location_text = record.location_text || record.address;
          }
        }
        
        // Unggah foto jika ada (dari record.photos array ATAU dari photo_url yang berisi base64 data URI)
        if (!payload.photo_url && record.photos && record.photos.length > 0 && record.photos[0].dataUrl) {
          // Path 1: foto disimpan di record.photos (waste_records / incidental_events)
          const bucket = 'simpah_media';
          const ext = record.photos[0].dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
          const path = `${table}/${record.id}/${Date.now()}.${ext}`;
          const publicUrl = await uploadBase64Image(bucket, path, record.photos[0].dataUrl);
          if (publicUrl) {
            payload.photo_url = publicUrl;
          }
        } else if (payload.photo_url && payload.photo_url.startsWith('data:')) {
          // Path 2: foto disimpan langsung di photo_url sebagai base64 data URI (complaints)
          // Upload ke Storage lalu ganti dengan public URL
          const bucket = 'simpah_media';
          const ext = payload.photo_url.startsWith('data:image/png') ? 'png' : 'jpg';
          const path = `${table}/${record.id}/${Date.now()}.${ext}`;
          try {
            const publicUrl = await uploadBase64Image(bucket, path, payload.photo_url);
            if (publicUrl) {
              payload.photo_url = publicUrl;
              console.log(`[Sync] Foto berhasil di-upload ke Storage: ${publicUrl}`);
            } else {
              console.warn(`[Sync] Upload foto gagal, menghapus photo_url dari payload`);
              delete payload.photo_url;
            }
          } catch (uploadErr) {
            console.error(`[Sync] Exception saat upload foto:`, uploadErr);
            delete payload.photo_url;
          }
        }
        
        // Sanitasi final: pastikan photo_url hanya berisi URL valid (http/https)
        // Hapus jika berisi blob:, data:, atau URL halaman yang bukan gambar
        if (payload.photo_url && !payload.photo_url.startsWith('http')) {
          console.warn(`[Sync] photo_url tidak valid (bukan http URL), dihapus:`, payload.photo_url.substring(0, 80));
          delete payload.photo_url;
        }
        
        // Log payload yang akan dikirim (tanpa konten besar)
        const debugPayload = { ...payload };
        if (debugPayload.photo_url && debugPayload.photo_url.length > 100) {
          debugPayload.photo_url = debugPayload.photo_url.substring(0, 100) + '...[truncated]';
        }
        console.log(`[Sync] Mengirim ${table} id=${record.id}`, JSON.stringify(debugPayload, null, 2));

        // Gunakan UPDATE jika record ditandai sync_action='update' (misal: validasi oleh koordinator)
        // Ini diperlukan karena upsert memerlukan INSERT policy, sedangkan koordinator hanya punya UPDATE policy
        let syncError;
        if (record.sync_action === 'update') {
          const { error: updateErr } = await supabase.from(table).update(payload).eq('id', payload.id);
          syncError = updateErr;
          if (updateErr) console.error(`[Sync] UPDATE error:`, JSON.stringify(updateErr));
        } else {
          // Coba insert terlebih dahulu (karena upsert memerlukan UPDATE policy di Supabase RLS, sedangkan user non-admin hanya punya INSERT policy)
          const { error: insertErr } = await supabase.from(table).insert(payload);
          if (insertErr) console.error(`[Sync] INSERT error (code=${insertErr.code}, status=${insertErr.status}):`, JSON.stringify(insertErr));
          if (insertErr && (insertErr.code === '23505' || insertErr.message?.includes('duplicate key') || insertErr.message?.includes('already exists'))) {
            console.log(`[Sync] Duplikat ditemukan, mencoba upsert...`);
            const { error: upsertErr } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
            syncError = upsertErr;
          } else {
            syncError = insertErr;
          }
        }
        
        if (syncError) {
          // Jika error karena kolom tidak dikenal, coba hapus kolom bermasalah dan retry
          const colMatch = syncError.message?.match(/Could not find the '([^']+)' column/) || syncError.message?.match(/column "([^"]+)" of relation/);
          if (colMatch) {
            const badCol = colMatch[1];
            console.warn(`[Sync] Kolom "${badCol}" tidak ada di tabel ${table}, menghapus dan mencoba ulang...`);
            delete payload[badCol];
            let retryError;
            if (record.sync_action === 'update') {
              const { error: re } = await supabase.from(table).update(payload).eq('id', payload.id);
              retryError = re;
            } else {
              const { error: reInsert } = await supabase.from(table).insert(payload);
              if (reInsert && (reInsert.code === '23505' || reInsert.message?.includes('duplicate key') || reInsert.message?.includes('already exists'))) {
                const { error: reUpsert } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
                retryError = reUpsert;
              } else {
                retryError = reInsert;
              }
            }
            if (retryError) {
              console.error(`[Sync] Retry gagal untuk ${table}`, record.id, retryError);
              record.sync_error = retryError.message;
              await db.put(table, record);
              continue; // Lewati record ini, lanjut ke record berikutnya
            }
          } else {
            console.error(`[Sync] Gagal upload data ${table}`, record.id, syncError);
            record.sync_error = syncError.message;
            await db.put(table, record);
            continue; // Lewati record ini, lanjut ke record berikutnya
          }
        }
        
        // Hapus error jika sebelumnya ada
        if (record.sync_error) {
          delete record.sync_error;
        }
        
        if (table === 'waste_records' && record.type === 'pilah') {
           const sortedItems = await db.getAllFromIndex('sorted_waste', 'waste_record_id', record.id);
           if (sortedItems && sortedItems.length > 0) {
              const { error: sortedError } = await supabase.from('sorted_waste').upsert(sortedItems, { onConflict: 'id' });
              if (sortedError) console.error('Gagal upload sorted_waste', sortedError);
           }
        }
        
        record.synced = true;
        delete record.sync_action;
        await db.put(table, record);
        actualSynced++;
      }
    } // End table loop

    setState('pendingSync', 0);

    if (actualSynced === 0) {
      // Tidak ada data real yang disinkronkan (hanya data demo atau memang kosong)
      setState('syncStatus', 'idle');
      return;
    }

    setState('syncStatus', 'success');
    setState('lastSync', new Date().toISOString());

    showToast(`Sinkronisasi ${actualSynced} data berhasil!`, 'success', 'Sinkronisasi Selesai');

    setTimeout(() => {
      setState('syncStatus', 'idle');
    }, 3000);

  } catch (e) {
    console.error('Sync failed:', e);
    setState('syncStatus', 'error');
    showToast('Gagal sinkronisasi data. Akan dicoba ulang secara otomatis.', 'error', 'Sync Gagal');
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
