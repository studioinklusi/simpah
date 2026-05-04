// SIMPAH - Audit Trail Helper
import { getDB } from '../db/schema.js';

export async function createAuditEntry(entityType, entityId, action, userId, data = null) {
  try {
    const db = await getDB();
    let lat = null, lng = null;
    
    // Try to get current GPS position
    try {
      const pos = await getCurrentPositionQuick();
      lat = pos.latitude;
      lng = pos.longitude;
    } catch (e) {
      // GPS not available, continue without it
    }

    const entry = {
      entity_type: entityType,
      entity_id: entityId,
      action,
      user_id: userId || 'system',
      timestamp: new Date().toISOString(),
      lat,
      lng,
      data_snapshot: data ? JSON.stringify(data).substring(0, 1000) : null
    };

    await db.add('audit_log', entry);
    return entry;
  } catch (e) {
    console.warn('Audit log failed:', e);
  }
}

export async function getAuditLog(filters = {}) {
  const db = await getDB();
  let logs = await db.getAll('audit_log');
  
  if (filters.entityType) {
    logs = logs.filter(l => l.entity_type === filters.entityType);
  }
  if (filters.userId) {
    logs = logs.filter(l => l.user_id === filters.userId);
  }
  
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getCurrentPositionQuick() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    const timeout = setTimeout(() => reject(new Error('GPS timeout')), 3000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      (err) => {
        clearTimeout(timeout);
        reject(err);
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
    );
  });
}
