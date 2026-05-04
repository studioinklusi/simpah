// SIMPAH - IndexedDB Schema & Database Setup
import { openDB } from 'idb';

const DB_NAME = 'simpah-db';
const DB_VERSION = 5;

export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction, event) {
      // Users
      if (!db.objectStoreNames.contains('users')) {
        const users = db.createObjectStore('users', { keyPath: 'id' });
        users.createIndex('role', 'role');
        users.createIndex('username', 'username', { unique: true });
      }

      // Waste Records
      if (!db.objectStoreNames.contains('waste_records')) {
        const waste = db.createObjectStore('waste_records', { keyPath: 'id' });
        waste.createIndex('type', 'type');
        waste.createIndex('category_sipsn', 'category_sipsn');
        waste.createIndex('location_id', 'location_id');
        waste.createIndex('user_id', 'user_id');
        waste.createIndex('created_at', 'created_at');
        waste.createIndex('synced', 'synced');
        waste.createIndex('date_str', 'date_str');
      }
      
      // Upgrade Path for v2: adding verification_status index to waste_records
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('waste_records')) return; // safety
        const wasteStore = event.target.transaction.objectStore('waste_records');
        if (!wasteStore.indexNames.contains('verification_status')) {
          wasteStore.createIndex('verification_status', 'verification_status');
        }
      }

      // Upgrade Path for v4: Clear old data to force fresh seed of RBAC and job_types
      if (oldVersion > 0 && oldVersion < 4) {
        const tx = event.target.transaction;
        if (db.objectStoreNames.contains('users')) tx.objectStore('users').clear();
        if (db.objectStoreNames.contains('complaints')) tx.objectStore('complaints').clear();
        if (db.objectStoreNames.contains('waste_records')) tx.objectStore('waste_records').clear();
      }

      // Sorted Waste (Pilah details)
      if (!db.objectStoreNames.contains('sorted_waste')) {
        const sorted = db.createObjectStore('sorted_waste', { keyPath: 'id' });
        sorted.createIndex('waste_record_id', 'waste_record_id');
        sorted.createIndex('category_sipsn', 'category_sipsn');
      }

      // Locations (TPS, TPS3R, Bank Sampah, TPA, Pengepul)
      if (!db.objectStoreNames.contains('locations')) {
        const locs = db.createObjectStore('locations', { keyPath: 'id' });
        locs.createIndex('type', 'type');
        locs.createIndex('wilayah', 'wilayah');
      }

      // Fleet / Armada
      if (!db.objectStoreNames.contains('fleet')) {
        const fleet = db.createObjectStore('fleet', { keyPath: 'id' });
        fleet.createIndex('plate_number', 'plate_number');
      }

      // MoU Records
      if (!db.objectStoreNames.contains('mou')) {
        const mou = db.createObjectStore('mou', { keyPath: 'id' });
        mou.createIndex('status', 'status');
        mou.createIndex('transporter_name', 'transporter_name');
      }

      // Public Complaints
      if (!db.objectStoreNames.contains('complaints')) {
        const comp = db.createObjectStore('complaints', { keyPath: 'id' });
        comp.createIndex('status', 'status');
        comp.createIndex('created_at', 'created_at');
        comp.createIndex('tracking_number', 'tracking_number', { unique: true });
      } else {
        const comp = upgradeTransaction.objectStore('complaints');
        if (!comp.indexNames.contains('tracking_number')) {
          comp.createIndex('tracking_number', 'tracking_number', { unique: true });
        }
      }

      // Audit Log
      if (!db.objectStoreNames.contains('audit_log')) {
        const audit = db.createObjectStore('audit_log', { keyPath: 'id', autoIncrement: true });
        audit.createIndex('entity_type', 'entity_type');
        audit.createIndex('entity_id', 'entity_id');
        audit.createIndex('user_id', 'user_id');
        audit.createIndex('timestamp', 'timestamp');
      }

      // Incidental Events
      if (!db.objectStoreNames.contains('incidental_events')) {
        const events = db.createObjectStore('incidental_events', { keyPath: 'id' });
        events.createIndex('type', 'type');
        events.createIndex('created_at', 'created_at');
      }
    }
  });
  return db;
}

let dbInstance = null;

export async function getDB() {
  if (!dbInstance) {
    dbInstance = await initDB();
  }
  return dbInstance;
}
