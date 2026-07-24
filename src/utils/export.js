// SIMPAH - SIPSN Export Utility
import { SIPSN_CATEGORIES } from './sipsn.js';
import { formatDate } from './helpers.js';

export function exportToCSV(records, filename = 'simpah-export') {
  const headers = [
    'No', 'Tanggal', 'Jenis', 'Kategori SIPSN', 'Kode Kategori',
    'Berat (kg)', 'Lokasi', 'Latitude', 'Longitude',
    'Petugas', 'Kendaraan', 'Catatan', 'Synced',
    'Akumulasi', 'Hari Akumulasi', 'Berat Total Akumulasi (kg)',
    'Batch ID', 'Periode Mulai', 'Periode Selesai'
  ];

  const rows = records.map((r, i) => [
    i + 1,
    formatDate(r.created_at),
    r.is_incidental ? 'Insidental' : (r.type === 'masuk' || r.type === 'campur') ? 'Sampah Campur' : r.type === 'pilah' ? 'Sampah Terpilah' : r.type === 'olah' ? 'Olah Sampah' : 'Residu',
    getCategoryName(r.category_sipsn),
    r.category_sipsn || '',
    r.weight_kg || 0,
    r.location_name || '',
    r.lat || '',
    r.lng || '',
    r.user_name || '',
    r.fleet_plate || '',
    cleanNotes(r.notes),
    r.synced ? 'Ya' : 'Belum',
    r.batch_id ? 'Ya' : 'Tidak',
    r.batch_days || r.accumulation_days || '',
    r.accumulation_total_kg || (r.batch_id && r.batch_days ? parseFloat((r.weight_kg * r.batch_days).toFixed(1)) : ''),
    r.batch_id || '',
    r.batch_start_date || '',
    r.batch_end_date || ''
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv');
}

export function exportToSIPSN(records, period = '', sortedWasteList = []) {
  const sortedWasteMap = buildSortedWasteMap(sortedWasteList);
  // Format specifically for SIPSN upload template
  // MIX is excluded from per-category SIPSN columns (not a standard SIPSN category)
  const sipsn9 = SIPSN_CATEGORIES.filter(c => !c.isMixed);
  const headers = [
    'Nama Kabupaten/Kota', 'Tahun', 'Bulan',
    ...sipsn9.map(c => `${c.name} (ton)`),
    'Total Volume (ton)', 'Terkelola (ton)', 'Residu (ton)'
  ];

  const byCategory = {};
  sipsn9.forEach(c => { byCategory[c.code] = 0; });
  
  let totalManaged = 0, totalResidu = 0;
  records.forEach(r => {
    const weightTon = (r.weight_kg || 0) / 1000;
    const sortedItems = sortedWasteMap[r.id];

    if (r.category_sipsn === 'MIX' && Array.isArray(sortedItems) && sortedItems.length > 0) {
      sortedItems.forEach(item => {
        const itemWeightTon = (parseFloat(item.weight_kg) || 0) / 1000;
        if (byCategory[item.category_sipsn] !== undefined) {
          byCategory[item.category_sipsn] += itemWeightTon;
        }
      });
    } else if (r.category_sipsn && byCategory[r.category_sipsn] !== undefined) {
      byCategory[r.category_sipsn] += weightTon;
    }

    if (r.type === 'pilah' || r.type === 'olah') totalManaged += weightTon;
    if (r.type === 'residu' || r.type === 'campur' || r.type === 'masuk') totalResidu += weightTon;
  });

  const totalVolume = Object.values(byCategory).reduce((s, v) => s + v, 0);

  const row = [
    'Kabupaten Banjarnegara',
    period ? period.split('-')[0] : new Date().getFullYear(),
    period ? parseInt(period.split('-')[1]) : new Date().getMonth() + 1,
    ...sipsn9.map(c => byCategory[c.code].toFixed(3)),
    totalVolume.toFixed(3),
    totalManaged.toFixed(3),
    totalResidu.toFixed(3)
  ];

  const csv = [headers.join(','), row.map(v => `"${v}"`).join(',')].join('\n');
  downloadFile(csv, `sipsn-export-${period || 'all'}.csv`, 'text/csv');
}

export async function exportToExcel(records, filename = 'simpah-report', sortedWasteList = []) {
  try {
    const XLSX = await import('xlsx');
    const data = records.map((r, i) => ({
      'No': i + 1,
      'Tanggal': formatDate(r.created_at),
      'Jenis': r.is_incidental ? 'Insidental' : (r.type === 'masuk' || r.type === 'campur') ? 'Sampah Campur' : r.type === 'pilah' ? 'Sampah Terpilah' : r.type === 'olah' ? 'Olah Sampah' : 'Residu',
      'Kategori': getCategoryName(r.category_sipsn),
      'Kode': r.category_sipsn || '',
      'Berat (kg)': r.weight_kg || 0,
      'Lokasi': r.location_name || '',
      'Lat': r.lat || '',
      'Lng': r.lng || '',
      'Petugas': r.user_name || '',
      'Catatan': cleanNotes(r.notes),
      'Akumulasi': r.batch_id ? 'Ya' : 'Tidak',
      'Hari Akumulasi': r.batch_days || r.accumulation_days || '',
      'Berat Total Akumulasi (kg)': r.accumulation_total_kg || (r.batch_id && r.batch_days ? parseFloat((r.weight_kg * r.batch_days).toFixed(1)) : ''),
      'Batch ID': r.batch_id || '',
      'Periode Mulai': r.batch_start_date || '',
      'Periode Selesai': r.batch_end_date || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Sampah');

    // Add SIPSN summary sheet
    const summary = createSIPSNSummary(records, sortedWasteList);
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan SIPSN');

    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (e) {
    console.error('Excel export failed:', e);
    // Fallback to CSV
    exportToCSV(records, filename);
  }
}

function createSIPSNSummary(records, sortedWasteList = []) {
  const sortedWasteMap = buildSortedWasteMap(sortedWasteList);
  const catTotals = {};
  const catRecordCounts = {};

  SIPSN_CATEGORIES.forEach(cat => {
    catTotals[cat.code] = 0;
    catRecordCounts[cat.code] = 0;
  });

  records.forEach(r => {
    const sortedItems = sortedWasteMap[r.id];
    if (r.category_sipsn === 'MIX' && Array.isArray(sortedItems) && sortedItems.length > 0) {
      sortedItems.forEach(item => {
        const code = item.category_sipsn;
        if (catTotals[code] !== undefined) {
          catTotals[code] += (parseFloat(item.weight_kg) || 0);
          catRecordCounts[code] += 1;
        }
      });
    } else if (r.category_sipsn && catTotals[r.category_sipsn] !== undefined) {
      catTotals[r.category_sipsn] += (parseFloat(r.weight_kg) || 0);
      catRecordCounts[r.category_sipsn] += 1;
    }
  });

  return SIPSN_CATEGORIES.map(cat => {
    const totalKg = catTotals[cat.code] || 0;
    return {
      'Kategori': cat.name,
      'Kode': cat.code,
      'Jumlah Record': catRecordCounts[cat.code] || 0,
      'Total (kg)': totalKg.toFixed(1),
      'Total (ton)': (totalKg / 1000).toFixed(3)
    };
  });
}

function buildSortedWasteMap(sortedWasteList) {
  const map = {};
  if (Array.isArray(sortedWasteList)) {
    sortedWasteList.forEach(sw => {
      const recId = sw.waste_record_id;
      if (recId) {
        if (!map[recId]) map[recId] = [];
        map[recId].push(sw);
      }
    });
  }
  return map;
}

function getCategoryName(code) {
  const cat = SIPSN_CATEGORIES.find(c => c.code === code);
  return cat ? cat.name : '-';
}

// Remove internal accumulation markers from notes since info is now in dedicated columns
function cleanNotes(notes) {
  if (!notes) return '';
  return notes.replace(/\s*\[Akumulasi hari ke-\d+\/\d+\]\s*/g, '').trim();
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
