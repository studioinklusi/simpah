// SIMPAH - Data Access Layer (CRUD)
import { getDB } from './schema.js';
import { createAuditEntry } from '../utils/audit.js';
import { supabase } from '../lib/supabase.js';

// ========== Generic CRUD ==========
// Normalize date_str across Supabase (record_date) and local (date_str) records
function normalizeDateStr(record) {
  return {
    ...record,
    date_str: record.date_str || (record.record_date ? String(record.record_date) : (record.created_at ? record.created_at.split('T')[0] : null))
  };
}

async function getAll(storeName) {
  const db = await getDB();
  return db.getAll(storeName);
}

async function getById(storeName, id) {
  const db = await getDB();
  return db.get(storeName, id);
}

async function put(storeName, data) {
  const db = await getDB();
  return db.put(storeName, data);
}

async function deleteById(storeName, id) {
  const db = await getDB();
  return db.delete(storeName, id);
}

async function getByIndex(storeName, indexName, value) {
  const db = await getDB();
  return db.getAllFromIndex(storeName, indexName, value);
}

async function countAll(storeName) {
  const db = await getDB();
  return db.count(storeName);
}

// ========== Waste Records ==========
export async function getAllWasteRecords() {
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase.from('waste_records').select('*').limit(10000).order('created_at', { ascending: false });
      if (!error && data) {
        const db = await getDB();
        
        // Ambil data lokal yang belum tersinkronisasi agar tidak tertimpa
        let unsynced = [];
        try {
          unsynced = await db.getAllFromIndex('waste_records', 'synced', false);
        } catch(e) {
          const allLocal = await db.getAll('waste_records');
          unsynced = allLocal.filter(r => r.synced === false);
        }
        
        // Simpan data server ke cache lokal
        const tx = db.transaction('waste_records', 'readwrite');
        for (const item of data) {
          item.synced = true;
          await tx.store.put(item);
        }
        await tx.done;
        
        // Gabungkan data server dengan data lokal yang belum sinkron
        const unsyncedMap = new Map(unsynced.map(r => [r.id, r]));
        const merged = data.map(r => unsyncedMap.has(r.id) ? unsyncedMap.get(r.id) : r);
        const serverIds = new Set(data.map(r => r.id));
        const purelyLocal = unsynced.filter(r => !serverIds.has(r.id));
        
        return [...purelyLocal, ...merged]
          .map(normalizeDateStr)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    } catch (e) {
      console.warn('Gagal mengambil waste_records dari Supabase, menggunakan data lokal', e);
    }
  }
  
  const all = await getAll('waste_records');
  return all.map(normalizeDateStr).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getWasteRecordsByType(type) {
  return getByIndex('waste_records', 'type', type);
}

export async function getWasteRecordsByDate(dateStr) {
  return getByIndex('waste_records', 'date_str', dateStr);
}

export async function addWasteRecord(record, userId) {
  const recordDate = record.override_date ? new Date(record.override_date) : new Date();
  const data = {
    ...record,
    id: record.id || generateId(),
    created_at: recordDate.toISOString(),
    created_by: userId || 'system',
    date_str: recordDate.toISOString().split('T')[0],
    synced: false,
    verification_status: 'pending' // Anti-fraud: new records require Dinas approval
  };
  delete data.override_date; // Clean up internal field
  await put('waste_records', data);
  await createAuditEntry('waste_records', data.id, 'create', userId, data);
  return data;
}

export async function updateWasteRecordStatus(id, status, notes = '', userId = 'system') {
  const record = await getWasteRecordById(id);
  if (!record) throw new Error('Record not found');
  
  const oldStatus = record.verification_status;
  record.verification_status = status;
  if (notes) record.verification_notes = notes;
  record.verified_at = new Date().toISOString();
  record.verified_by = userId;
  
  await put('waste_records', record);
  await createAuditEntry('waste_records', id, `status_${status}`, userId, { old: oldStatus, new: status, notes });
  return record;
}

export async function getWasteRecordById(id) {
  return getById('waste_records', id);
}

export async function getUnsyncedRecords() {
  return getByIndex('waste_records', 'synced', false);
}

export async function markAsSynced(id) {
  const record = await getById('waste_records', id);
  if (record) {
    record.synced = true;
    await put('waste_records', record);
  }
}

// ========== Sorted Waste ==========
export async function addSortedWaste(items, wasteRecordId, userId) {
  const db = await getDB();
  const tx = db.transaction('sorted_waste', 'readwrite');
  const results = [];
  for (const item of items) {
    const data = {
      ...item,
      id: item.id || generateId(),
      waste_record_id: wasteRecordId,
      created_at: new Date().toISOString()
    };
    await tx.store.put(data);
    results.push(data);
  }
  await tx.done;
  return results;
}

export async function getSortedWasteByRecord(wasteRecordId) {
  return getByIndex('sorted_waste', 'waste_record_id', wasteRecordId);
}

// ========== Locations ==========
export async function getAllLocations() {
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase.from('locations').select('*');
      if (!error && data) {
        // Cache to IDB
        const db = await getDB();
        const tx = db.transaction('locations', 'readwrite');
        data.forEach(item => tx.store.put(item));
        await tx.done;
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch locations from Supabase, falling back to IDB', e);
    }
  }
  return getAll('locations');
}

export async function getLocationsByType(type) {
  const all = await getAllLocations();
  return all.filter(l => l.type === type);
}

export async function addLocation(location) {
  if (!navigator.onLine) throw new Error('Penambahan lokasi harus dalam keadaan online');
  
  const id = location.id || crypto.randomUUID();
  const dataToInsert = { ...location, id, created_at: new Date().toISOString() };
  
  const { data, error } = await supabase.from('locations').insert(dataToInsert).select().single();
  if (error) throw new Error(error.message);
  
  await put('locations', data);
  return data;
}

export async function updateLocation(id, updates) {
  if (!navigator.onLine) throw new Error('Perubahan lokasi harus dalam keadaan online');
  
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  
  const { data, error } = await supabase.from('locations').update(updatedData).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  
  await put('locations', data);
  return data;
}

export async function deleteLocation(id) {
  if (!navigator.onLine) throw new Error('Penghapusan lokasi harus dalam keadaan online');
  
  const { error } = await supabase.from('locations').delete().eq('id', id);
  if (error) throw new Error(error.message);
  
  await deleteById('locations', id);
}

// ========== Fleet ==========
export async function getAllFleet() {
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase.from('fleet').select('*');
      if (!error && data) {
        const db = await getDB();
        const tx = db.transaction('fleet', 'readwrite');
        data.forEach(item => tx.store.put(item));
        await tx.done;
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch fleet from Supabase, falling back to IDB', e);
    }
  }
  return getAll('fleet');
}

export async function addFleet(fleet, userId) {
  if (!navigator.onLine) throw new Error('Penambahan armada harus dalam keadaan online');
  
  const id = fleet.id || crypto.randomUUID();
  const dataToInsert = { ...fleet, id, created_at: new Date().toISOString() };
  
  const { data, error } = await supabase.from('fleet').insert(dataToInsert).select().single();
  if (error) throw new Error(error.message);
  
  await put('fleet', data);
  await createAuditEntry('fleet', data.id, 'create', userId, data);
  return data;
}

export async function updateFleet(id, updates) {
  if (!navigator.onLine) throw new Error('Perubahan armada harus dalam keadaan online');
  
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  
  const { data, error } = await supabase.from('fleet').update(updatedData).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  
  await put('fleet', data);
  return data;
}

export async function deleteFleet(id) {
  if (!navigator.onLine) throw new Error('Penghapusan armada harus dalam keadaan online');
  
  const { error } = await supabase.from('fleet').delete().eq('id', id);
  if (error) throw new Error(error.message);
  
  await deleteById('fleet', id);
}

// ========== MoU ==========
export async function getAllMou() {
  let mous = [];
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase.from('mou').select('*');
      if (!error && data) {
        const db = await getDB();
        const tx = db.transaction('mou', 'readwrite');
        data.forEach(item => tx.store.put(item));
        await tx.done;
        mous = data;
      }
    } catch (e) {
      console.warn('Failed to fetch MoU from Supabase, falling back to IDB', e);
      mous = await getAll('mou');
    }
  } else {
    mous = await getAll('mou');
  }

  // Auto-expiry: update MoU status based on end_date
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringDate = thirtyDaysFromNow.toISOString().split('T')[0];

  for (const m of mous) {
    const oldStatus = m.status;
    if (m.end_date && m.end_date < today && m.status !== 'expired' && m.status !== 'terminated') {
      m.status = 'expired';
    } else if (m.end_date && m.end_date >= today && m.end_date <= expiringDate && m.status === 'active') {
      m.status = 'expiring';
    }
    // Sync changed status to Supabase
    if (oldStatus !== m.status && navigator.onLine) {
      try {
        await supabase.from('mou').update({ status: m.status, updated_at: new Date().toISOString() }).eq('id', m.id);
        await put('mou', m);
      } catch (e) {
        console.warn('Failed to auto-update MoU status:', m.id, e);
      }
    }
  }

  return mous;
}

export async function getMouByStatus(status) {
  const all = await getAllMou();
  return all.filter(m => m.status === status);
}

export async function addMou(mou) {
  if (!navigator.onLine) throw new Error('Penambahan MoU harus dalam keadaan online');
  
  const id = mou.id || crypto.randomUUID();
  const dataToInsert = { ...mou, id };
  
  const { data, error } = await supabase.from('mou').insert(dataToInsert).select().single();
  if (error) throw new Error(error.message);
  
  await put('mou', data);
  return data;
}

export async function updateMouStatus(id, status) {
  if (!navigator.onLine) throw new Error('Perubahan MoU harus dalam keadaan online');
  
  const { data, error } = await supabase.from('mou').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  
  await put('mou', data);
}

export async function updateMou(id, updates) {
  if (!navigator.onLine) throw new Error('Perubahan MoU harus dalam keadaan online');
  
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  
  const { data, error } = await supabase.from('mou').update(updatedData).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  
  await put('mou', data);
  return data;
}

export async function deleteMou(id) {
  if (!navigator.onLine) throw new Error('Penghapusan MoU harus dalam keadaan online');
  
  const { error } = await supabase.from('mou').delete().eq('id', id);
  if (error) throw new Error(error.message);
  
  await deleteById('mou', id);
}

// ========== Complaints ==========
export async function getAllComplaints() {
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const db = await getDB();
        let unsynced = [];
        try {
          unsynced = await db.getAllFromIndex('complaints', 'synced', false);
        } catch(e) {
          const allLocal = await db.getAll('complaints');
          unsynced = allLocal.filter(r => r.synced === false);
        }
        
        const tx = db.transaction('complaints', 'readwrite');
        for (const item of data) {
          item.synced = true;
          await tx.store.put(item);
        }
        await tx.done;
        
        const unsyncedMap = new Map(unsynced.map(r => [r.id, r]));
        const merged = data.map(r => unsyncedMap.has(r.id) ? unsyncedMap.get(r.id) : r);
        const serverIds = new Set(data.map(r => r.id));
        const purelyLocal = unsynced.filter(r => !serverIds.has(r.id));
        
        return [...purelyLocal, ...merged].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    } catch (e) {
      console.warn('Gagal fetch complaints dari Supabase', e);
    }
  }
  const all = await getAll('complaints');
  return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getComplaintsByUser(userId) {
  const all = await getAll('complaints');
  return all.filter(c => c.reporter_user_id === userId);
}

export async function getComplaintByTracking(trackingNumber) {
  const all = await getAll('complaints');
  return all.find(c => c.tracking_number === trackingNumber) || null;
}

export async function addComplaint(complaint, userId = null) {
  const data = {
    ...complaint,
    id: complaint.id || generateId(),
    tracking_number: generateTrackingNumber(),
    reporter_user_id: userId,
    is_anonymous: complaint.is_anonymous || false,
    status: 'baru',
    synced: false,
    created_at: new Date().toISOString()
  };
  await put('complaints', data);
  if (userId) {
    await createAuditEntry('complaints', data.id, 'create', userId, { tracking: data.tracking_number, category: data.category });
  }
  return data;
}

export async function updateComplaint(id, updates) {
  const complaint = await getById('complaints', id);
  if (!complaint) throw new Error('Aduan tidak ditemukan');
  const updated = { ...complaint, ...updates, updated_at: new Date().toISOString() };
  await put('complaints', updated);
  return updated;
}

// ========== Incidental Events ==========
export async function getAllEvents() {
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase.from('incidental_events').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const db = await getDB();
        let unsynced = [];
        try {
          unsynced = await db.getAllFromIndex('incidental_events', 'synced', false);
        } catch(e) {
          const allLocal = await db.getAll('incidental_events');
          unsynced = allLocal.filter(r => r.synced === false);
        }
        
        const tx = db.transaction('incidental_events', 'readwrite');
        for (const item of data) {
          item.synced = true;
          await tx.store.put(item);
        }
        await tx.done;
        
        const unsyncedMap = new Map(unsynced.map(r => [r.id, r]));
        const merged = data.map(r => unsyncedMap.has(r.id) ? unsyncedMap.get(r.id) : r);
        const serverIds = new Set(data.map(r => r.id));
        const purelyLocal = unsynced.filter(r => !serverIds.has(r.id));
        
        return [...purelyLocal, ...merged].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    } catch (e) {
      console.warn('Gagal fetch incidental_events dari Supabase', e);
    }
  }
  const all = await getAll('incidental_events');
  return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function addEvent(event, userId) {
  const data = {
    ...event,
    id: event.id || generateId(),
    synced: false,
    created_at: new Date().toISOString()
  };
  await put('incidental_events', data);
  await createAuditEntry('incidental_events', data.id, 'create', userId, data);
  return data;
}

// ========== Users ==========
export async function getAllUsers() {
  return getAll('users');
}

export async function getUserByUsername(username) {
  const users = await getByIndex('users', 'username', username);
  return users[0] || null;
}

export async function addUser(user) {
  return put('users', { ...user, id: user.id || generateId(), created_at: new Date().toISOString() });
}

export async function updateUser(id, updates) {
  const user = await getById('users', id);
  if (!user) throw new Error('Pengguna tidak ditemukan');
  const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
  await put('users', updated);
  return updated;
}

export async function deleteUser(id) {
  await deleteById('users', id);
}

export async function getWasteStats() {
  const allRecords = await getAllWasteRecords();
  
  // Filter only approved/legacy records for stats and ensure date_str exists
  const records = allRecords
    .filter(r => !r.verification_status || r.verification_status === 'approved')
    .map(r => ({ ...r, date_str: r.date_str || r.record_date }));

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);

  const todayRecords = records.filter(r => r.date_str === today);
  const monthRecords = records.filter(r => r.date_str?.startsWith(thisMonth));

  const totalWeight = records.reduce((sum, r) => sum + (r.weight_kg || 0), 0);
  const todayWeight = todayRecords.reduce((sum, r) => sum + (r.weight_kg || 0), 0);
  const monthWeight = monthRecords.reduce((sum, r) => sum + (r.weight_kg || 0), 0);

  const masukWeight = records.filter(r => r.type === 'masuk').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const campurWeight = records.filter(r => r.type === 'campur').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const pilahWeight = records.filter(r => r.type === 'pilah').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const olahWeight = records.filter(r => r.type === 'olah').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const residuWeight = records.filter(r => r.type === 'residu').reduce((s, r) => s + (r.weight_kg || 0), 0);
  const insidentalWeight = records.filter(r => r.is_incidental).reduce((s, r) => s + (r.weight_kg || 0), 0);

  // Waste Reduction Rate = (Pilah + Olah) / (Masuk + Campur) × 100
  const reductionTotal = pilahWeight + olahWeight;
  const totalIncoming = masukWeight + campurWeight;
  const recycleRate = totalIncoming > 0 ? ((reductionTotal / totalIncoming) * 100).toFixed(1) : 0;

  const byCategory = {};
  records.forEach(r => {
    if (r.category_sipsn) {
      byCategory[r.category_sipsn] = (byCategory[r.category_sipsn] || 0) + (r.weight_kg || 0);
    }
  });

  // Aggregate treatment methods
  const byTreatment = {};
  records.filter(r => r.type === 'olah' && r.treatment_method).forEach(r => {
    byTreatment[r.treatment_method] = (byTreatment[r.treatment_method] || 0) + (r.weight_kg || 0);
  });

  return {
    totalRecords: records.length,
    totalWeight,
    todayWeight,
    monthWeight,
    todayRecords: todayRecords.length,
    masukWeight,
    campurWeight,
    pilahWeight,
    olahWeight,
    residuWeight,
    insidentalWeight,
    recycleRate: parseFloat(recycleRate),
    byCategory,
    byTreatment,
    records
  };
}

// ========== Village Population (Supabase only) ==========
export async function getAllVillagePopulation() {
  try {
    const { data, error } = await supabase.from('village_population').select('*').order('kecamatan');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('Gagal mengambil data kependudukan:', e);
    return [];
  }
}

export async function addVillagePopulation(popData) {
  if (!navigator.onLine) throw new Error('Penambahan data kependudukan harus dalam keadaan online');
  
  const dataToInsert = {
    ...popData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase.from('village_population').insert(dataToInsert).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateVillagePopulation(id, updates) {
  if (!navigator.onLine) throw new Error('Perubahan data kependudukan harus dalam keadaan online');
  
  const updatedData = { ...updates, updated_at: new Date().toISOString() };
  
  const { data, error } = await supabase.from('village_population').update(updatedData).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteVillagePopulation(id) {
  if (!navigator.onLine) throw new Error('Penghapusan data kependudukan harus dalam keadaan online');
  
  const { error } = await supabase.from('village_population').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ========== Helpers ==========
function generateId() {
  return crypto.randomUUID();
}

function generateTrackingNumber() {
  const prefix = 'ADU';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${date}-${rand}`;
}
