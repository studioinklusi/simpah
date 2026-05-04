// SIMPAH - SIPSN Waste Categories
// Standar Sistem Informasi Pengelolaan Sampah Nasional
import { icons } from '../components/icons.js';

export const SIPSN_CATEGORIES = [
  { code: 'SM', name: 'Sisa Makanan', icon: icons.box, color: '#92400e' },
  { code: 'KR', name: 'Kayu / Ranting', icon: icons.box, color: '#78350f' },
  { code: 'KK', name: 'Kertas / Karton', icon: icons.file, color: '#1e40af' },
  { code: 'PL', name: 'Plastik', icon: icons.layers, color: '#0369a1' },
  { code: 'LG', name: 'Logam', icon: icons.tool, color: '#475569' },
  { code: 'KT', name: 'Kain / Tekstil', icon: icons.box, color: '#7c3aed' },
  { code: 'KL', name: 'Karet / Kulit', icon: icons.box, color: '#b91c1c' },
  { code: 'KC', name: 'Kaca', icon: icons.box, color: '#0d9488' },
  { code: 'LN', name: 'Lainnya', icon: icons.box, color: '#6b7280' }
];

export const WASTE_TYPES = [
  { id: 'masuk', label: 'Sampah Masuk', icon: icons.download, color: 'green' },
  { id: 'campur', label: 'Sampah Campur', icon: icons.box, color: 'amber' },
  { id: 'pilah', label: 'Sampah Terpilah', icon: icons.layers, color: 'blue' },
  { id: 'olah', label: 'Olah Sampah', icon: icons.activity, color: 'orange' },
  { id: 'residu', label: 'Residu', icon: icons.trash, color: 'red' },
  { id: 'insidental', label: 'Insidental', icon: icons.alert, color: 'purple' }
];

export const TREATMENT_METHODS = [
  { id: 'pakan_ternak', label: 'Pakan Ternak', icon: icons.heart, desc: 'Sisa makanan untuk pakan ayam, lele, sapi, dll' },
  { id: 'maggot_bsf', label: 'Maggot BSF', icon: icons.activity, desc: 'Biokonversi larva Black Soldier Fly' },
  { id: 'pengomposan', label: 'Pengomposan', icon: icons.layers, desc: 'Kompos aerob, takakura, komposter drum' },
  { id: 'biogas', label: 'Biogas / Biodigester', icon: icons.zap, desc: 'Pengolahan organik menjadi energi gas' },
  { id: 'insinerator', label: 'Insinerator', icon: icons.zap, desc: 'Pembakaran thermal tersertifikasi' },
  { id: 'pirolisis', label: 'Pirolisis', icon: icons.zap, desc: 'Konversi plastik menjadi BBM alternatif' },
  { id: 'eco_enzyme', label: 'Eco-Enzyme', icon: icons.droplet, desc: 'Fermentasi kulit buah menjadi cairan pembersih' },
  { id: 'kerajinan', label: 'Kerajinan / Upcycling', icon: icons.star, desc: 'Daur kreatif menjadi produk kerajinan tangan' },
  { id: 'lainnya', label: 'Pengolahan Lainnya', icon: icons.box, desc: 'Metode pengolahan mandiri lain' }
];

export const LOCATION_TYPES = [
  { id: 'tps', label: 'TPS', color: '#f59e0b', icon: icons.mapPin },
  { id: 'tps3r', label: 'TPS3R', color: '#10b981', icon: icons.recycle },
  { id: 'bank_sampah', label: 'Bank Sampah', color: '#3b82f6', icon: icons.briefcase },
  { id: 'pengepul', label: 'Pengepul', color: '#8b5cf6', icon: icons.truck },
  { id: 'tpa', label: 'TPA', color: '#ef4444', icon: icons.map }
];

export const INCIDENTAL_TYPES = [
  { id: 'kerja_bakti', label: 'Kerja Bakti', icon: icons.users },
  { id: 'event', label: 'Event / Acara', icon: icons.star },
  { id: 'bencana', label: 'Bencana', icon: icons.alert },
  { id: 'pembersihan', label: 'Pembersihan Khusus', icon: icons.tool },
  { id: 'edukasi', label: 'Edukasi/Sosialisasi', icon: icons.messageCircle },
  { id: 'lainnya', label: 'Lainnya', icon: icons.box }
];

export const USER_ROLES = [
  { id: 'warga', label: 'Warga', icon: icons.users },
  { id: 'petugas', label: 'Petugas Lapangan', icon: icons.truck },
  { id: 'eksekutif', label: 'Eksekutif', icon: icons.chart },
  { id: 'admin', label: 'Administrator', icon: icons.shield }
];

export function getCategoryByCode(code) {
  return SIPSN_CATEGORIES.find(c => c.code === code);
}

export function getLocationTypeInfo(type) {
  return LOCATION_TYPES.find(l => l.id === type);
}
