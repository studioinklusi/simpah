// SIMPAH - Centralized Permission System (RBAC)
// All role-based access control checks should use this module

/**
 * Permission matrix for the 4-role system:
 * WARGA, PETUGAS, EKSEKUTIF, ADMIN
 */
export const PERMISSIONS = {
  // === Public / Common ===
  VIEW_PUBLIC_STATS:       ['warga', 'petugas', 'eksekutif', 'admin'],
  VIEW_GIS_MAP:            ['warga', 'petugas', 'eksekutif', 'admin'],

  // === Aduan (Complaints) ===
  CREATE_COMPLAINT:        ['warga', 'petugas', 'eksekutif', 'admin'],
  VIEW_OWN_COMPLAINTS:     ['warga', 'petugas', 'eksekutif', 'admin'],
  VIEW_ALL_COMPLAINTS:     ['admin'],
  MANAGE_COMPLAINT_STATUS: ['admin'],

  // === Input Lapangan ===
  INPUT_WASTE_MASUK:       ['petugas', 'admin'],
  INPUT_WASTE_PILAH:       ['petugas', 'admin'],
  INPUT_WASTE_OLAH:        ['petugas', 'admin'],
  INPUT_WASTE_RESIDU:      ['petugas', 'admin'],
  INPUT_INSIDENTAL:        ['petugas', 'admin'],

  // === Validasi ===
  VALIDATE_DATA:           ['admin'],

  // === Dashboard ===
  VIEW_EXECUTIVE_DASHBOARD:['eksekutif', 'admin'],

  // === Pengelolaan (Admin) ===
  MANAGE_MASTER_DATA:      ['admin'],
  MANAGE_FLEET:            ['petugas', 'admin'],
  MANAGE_MOU:              ['admin'],
  MANAGE_INTERVENTION:     ['admin'],
  EXPORT_REPORTS:          ['admin'],
  VIEW_AUDIT_LOG:          ['admin'],
};

/**
 * Check if a user has a specific permission
 * @param {object} user - User object with at least a `role` property
 * @param {string} permission - Permission key from PERMISSIONS
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    console.warn(`Unknown permission: ${permission}`);
    return false;
  }
  return allowedRoles.includes(user.role);
}

/**
 * Check if user can input waste data (any type)
 */
export function canInputWaste(user) {
  return hasPermission(user, 'INPUT_WASTE_MASUK');
}

/**
 * Check if user can validate data
 */
export function canValidate(user) {
  return hasPermission(user, 'VALIDATE_DATA') || (user?.role === 'petugas' && user?.job_type === 'koordinator');
}

/**
 * Check if user can view executive dashboard
 */
export function canViewExecutive(user) {
  return hasPermission(user, 'VIEW_EXECUTIVE_DASHBOARD');
}

/**
 * Check if user is admin
 */
export function isAdmin(user) {
  return user?.role === 'admin';
}

/**
 * Get all permissions for a user's role
 * @returns {string[]} Array of permission keys
 */
export function getUserPermissions(user) {
  if (!user || !user.role) return [];
  return Object.entries(PERMISSIONS)
    .filter(([, roles]) => roles.includes(user.role))
    .map(([perm]) => perm);
}

/**
 * Petugas Job Types - Determines which sub-features are available
 */
export const JOB_TYPES = [
  { id: 'koordinator',  label: 'Koordinator Lapangan',    desc: 'Pengawas dan verifikator data lapangan' },
  { id: 'angkut',       label: 'Petugas Angkut',          desc: 'Sopir/petugas pengangkutan sampah' },
  { id: 'operator_tps', label: 'Operator TPS3R/Bank Sampah', desc: 'Petugas pengelola fasilitas TPS/Bank Sampah' },
  { id: 'kader',        label: 'Kader Lingkungan',         desc: 'Penggerak lingkungan tingkat RT/RW' },
];

/**
 * Get allowed waste input types based on user's job_type
 * If no job_type specified, allow all types the role permits
 */
export function getAllowedInputTypes(user) {
  if (!user) return [];

  // Admin or no specific job_type → all types
  if (user.role === 'admin' || (!user.job_type && user.role !== 'warga')) {
    return ['masuk', 'pilah', 'olah', 'residu', 'armada', 'insidental'];
  }

  switch (user.job_type) {
    case 'koordinator':
      return []; // Coordinator only needs validation, no direct waste inputs
    case 'angkut':
      return ['masuk', 'residu', 'armada'];        // Transport only
    case 'operator_tps':
      return ['masuk', 'pilah', 'olah', 'residu']; // Full TPS operations
    case 'kader':
      return ['masuk', 'pilah', 'olah', 'insidental'];          // Basic input + sorting + processing
    default:
      return ['masuk', 'pilah', 'olah', 'residu', 'armada', 'insidental'];
  }
}
