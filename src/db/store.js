// SIMPAH - Data Access Layer (CRUD)
import { getDB } from './schema.js';
import { createAuditEntry } from '../utils/audit.js';

// ========== Generic CRUD ==========
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
  return getAll('waste_records');
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
  return getAll('locations');
}

export async function getLocationsByType(type) {
  return getByIndex('locations', 'type', type);
}

export async function addLocation(location) {
  return put('locations', { ...location, id: location.id || generateId(), created_at: new Date().toISOString() });
}

export async function updateLocation(id, updates) {
  const loc = await getById('locations', id);
  if (!loc) throw new Error('Lokasi tidak ditemukan');
  const updated = { ...loc, ...updates, updated_at: new Date().toISOString() };
  await put('locations', updated);
  return updated;
}

export async function deleteLocation(id) {
  await deleteById('locations', id);
}

// ========== Fleet ==========
export async function getAllFleet() {
  return getAll('fleet');
}

export async function addFleet(fleet, userId) {
  const data = {
    ...fleet,
    id: fleet.id || generateId(),
    created_at: new Date().toISOString()
  };
  await put('fleet', data);
  await createAuditEntry('fleet', data.id, 'create', userId, data);
  return data;
}

export async function updateFleet(id, updates) {
  const fleet = await getById('fleet', id);
  if (!fleet) throw new Error('Kendaraan tidak ditemukan');
  const updated = { ...fleet, ...updates, updated_at: new Date().toISOString() };
  await put('fleet', updated);
  return updated;
}

export async function deleteFleet(id) {
  await deleteById('fleet', id);
}

// ========== MoU ==========
export async function getAllMou() {
  return getAll('mou');
}

export async function getMouByStatus(status) {
  return getByIndex('mou', 'status', status);
}

export async function addMou(mou) {
  return put('mou', { ...mou, id: mou.id || generateId() });
}

export async function updateMouStatus(id, status) {
  const mou = await getById('mou', id);
  if (mou) {
    mou.status = status;
    mou.updated_at = new Date().toISOString();
    await put('mou', mou);
  }
}

// ========== Complaints ==========
export async function getAllComplaints() {
  return getAll('complaints');
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
  return getAll('incidental_events');
}

export async function addEvent(event, userId) {
  const data = {
    ...event,
    id: event.id || generateId(),
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
  
  // Filter only approved/legacy records for stats
  const records = allRecords.filter(r => 
    !r.verification_status || r.verification_status === 'approved'
  );

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

// ========== Helpers ==========
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateTrackingNumber() {
  const prefix = 'ADU';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${date}-${rand}`;
}
