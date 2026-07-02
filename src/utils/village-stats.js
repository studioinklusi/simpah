// SIMPAH - Village Statistics Aggregator
// Mengagregasi data dari IndexedDB menjadi profil per wilayah
// Termasuk kalkulasi potensi timbulan berdasarkan data kependudukan

import { getAllWasteRecords, getAllLocations, getAllComplaints, getAllMasterWilayah, getAllPublicFacilities } from '../db/store.js';
import { calculateVillageScore, evaluateVillage } from './intervention-rules.js';

// Standar timbulan nasional (KLHK) — kg/orang/hari
const DEFAULT_TIMBULAN_PER_KAPITA = 0.70;

export async function getVillageProfiles() {
  const [records, locations, complaints, masterWilayah, facilities] = await Promise.all([
    getAllWasteRecords(),
    getAllLocations(),
    getAllComplaints(),
    getAllMasterWilayah(),
    getAllPublicFacilities(),
  ]);

  // Build master_wilayah lookup maps
  const wilayahMap = {};
  const kecamatanSet = new Set();
  const kecamatanDemographics = {};

  masterWilayah.forEach(w => {
    wilayahMap[w.id] = w;
    kecamatanSet.add(w.kecamatan);

    const kecKey = w.kecamatan.toLowerCase();
    if (!kecamatanDemographics[kecKey]) {
      kecamatanDemographics[kecKey] = {
        jumlah_penduduk: 0,
        jumlah_kk: 0,
        luas_km2: 0,
        timbulan_per_kapita: w.timbulan_per_kapita || DEFAULT_TIMBULAN_PER_KAPITA
      };
    }
    kecamatanDemographics[kecKey].jumlah_penduduk += w.jumlah_penduduk || 0;
    kecamatanDemographics[kecKey].jumlah_kk += w.jumlah_kk || 0;
    kecamatanDemographics[kecKey].luas_km2 += w.luas_km2 || 0;
  });

  // Build public facilities potential lookup by kecamatan
  const fasilitasMap = {};
  facilities.forEach(f => {
    const wil = f.kecamatan.toLowerCase();
    const potensi = (f.capacity_value || 0) * (f.timbulan_per_unit || 0);
    fasilitasMap[wil] = (fasilitasMap[wil] || 0) + potensi;
  });

  // Build location lookup
  const locationMap = {};
  locations.forEach(loc => {
    locationMap[loc.id] = loc;
  });

  // Build per-wilayah profiles for ALL 20 KECAMATAN in Banjarnegara
  const profiles = {};

  kecamatanSet.forEach(kecamatan => {
    profiles[kecamatan] = {
      wilayah: kecamatan,
      // Infrastructure counts
      tps_count: 0,
      tps3r_count: 0,
      bank_sampah_count: 0,
      pengepul_count: 0,
      tpa_count: 0,
      total_infrastruktur: 0,
      location_names: [],
      // Waste volumes
      total_masuk_kg: 0,
      total_campur_kg: 0,
      total_pilah_kg: 0,
      total_olah_kg: 0,
      total_residu_kg: 0,
      total_all_kg: 0,
      // Record counts
      record_count: 0,
      record_dates: new Set(),
      // Audit quality
      tanpa_gps_count: 0,
      belum_sync_count: 0,
      // Complaints
      complaint_count: 0,
      aduan_belum_ditangani: 0,
      complaints: [],
      // Monthly data for trend
      monthly_volumes: {},
      // Category breakdown
      by_category: {},
    };
  });

  // Filter out pending and rejected records, and prevent double counting
  const validRecords = records.filter(r => 
    (!r.verification_status || r.verification_status === 'approved') &&
    r.source_type !== 'fasilitas'
  );

  // Aggregate waste records
  validRecords.forEach(r => {
    let wilayah = null;
    if (r.desa_id && wilayahMap[r.desa_id]) {
      wilayah = wilayahMap[r.desa_id].kecamatan;
    } else if (r.location_id && locationMap[r.location_id]) {
      const loc = locationMap[r.location_id];
      if (loc.desa_id && wilayahMap[loc.desa_id]) {
        wilayah = wilayahMap[loc.desa_id].kecamatan;
      } else {
        wilayah = loc.wilayah;
      }
    }
    
    if (!wilayah || !profiles[wilayah]) return;

    const p = profiles[wilayah];
    p.record_count++;
    p.total_all_kg += r.weight_kg || 0;
    if (r.date_str) p.record_dates.add(r.date_str);

    if (r.type === 'masuk') p.total_masuk_kg += r.weight_kg || 0;
    if (r.type === 'campur') p.total_campur_kg += r.weight_kg || 0;
    if (r.type === 'pilah') p.total_pilah_kg += r.weight_kg || 0;
    if (r.type === 'olah') p.total_olah_kg += r.weight_kg || 0;
    if (r.type === 'residu') p.total_residu_kg += r.weight_kg || 0;

    if (!r.lat && !r.lng) p.tanpa_gps_count++;
    if (!r.synced) p.belum_sync_count++;

    // Monthly tracking
    if (r.date_str) {
      const monthKey = r.date_str.substring(0, 7);
      p.monthly_volumes[monthKey] = (p.monthly_volumes[monthKey] || 0) + (r.weight_kg || 0);
    }

    // Category breakdown
    if (r.category_sipsn) {
      p.by_category[r.category_sipsn] = (p.by_category[r.category_sipsn] || 0) + (r.weight_kg || 0);
    }
  });

  // Aggregate locations infrastructure
  locations.forEach(loc => {
    let wilayah = null;
    if (loc.desa_id && wilayahMap[loc.desa_id]) {
      wilayah = wilayahMap[loc.desa_id].kecamatan;
    } else {
      wilayah = loc.wilayah;
    }
    if (!wilayah || !profiles[wilayah]) return;
    const p = profiles[wilayah];
    p.location_names.push({ name: loc.name, type: loc.type });
    if (loc.type === 'tps') p.tps_count++;
    if (loc.type === 'tps3r') p.tps3r_count++;
    if (loc.type === 'bank_sampah') p.bank_sampah_count++;
    if (loc.type === 'pengepul') p.pengepul_count++;
    if (loc.type === 'tpa') p.tpa_count++;
    p.total_infrastruktur = p.tps_count + p.tps3r_count + p.bank_sampah_count;
  });

  // Aggregate complaints (by matching address/location to wilayah)
  complaints.forEach(c => {
    // Try matching complaint to wilayah by checking address or nearest location
    let matched = false;
    for (const wil of kecamatanSet) {
      if (c.address && c.address.toLowerCase().includes(wil.toLowerCase())) {
        const p = profiles[wil];
        p.complaint_count++;
        p.complaints.push(c);
        if (c.status === 'baru' || c.status === 'diproses') {
          p.aduan_belum_ditangani++;
        }
        matched = true;
        break;
      }
    }
    // If no match, try by proximity to first wilayah (fallback to first)
    if (!matched && kecamatanSet.size > 0) {
      const firstWil = [...kecamatanSet][0];
      profiles[firstWil].complaint_count++;
      profiles[firstWil].complaints.push(c);
      if (c.status === 'baru' || c.status === 'diproses') {
        profiles[firstWil].aduan_belum_ditangani++;
      }
    }
  });

  // Calculate derived metrics
  const result = Object.values(profiles).map(p => {
    const totalMasuk = (p.total_masuk_kg + p.total_campur_kg) || 1;
    // Waste Reduction Rate = (Pilah + Olah) / (Masuk + Campur) × 100
    const recycling_rate = ((p.total_pilah_kg + p.total_olah_kg) / totalMasuk) * 100;
    const residu_rate = ((p.total_residu_kg + p.total_campur_kg) / totalMasuk) * 100;

    // Trend analysis (last 3 months)
    const sortedMonths = Object.keys(p.monthly_volumes).sort();
    const last3 = sortedMonths.slice(-3);
    let tren_3_bulan = 'stabil';
    if (last3.length >= 3) {
      const v = last3.map(m => p.monthly_volumes[m]);
      if (v[2] > v[1] && v[1] > v[0]) tren_3_bulan = 'naik';
      else if (v[2] < v[1] && v[1] < v[0]) tren_3_bulan = 'turun';
    }

    // Detect spike
    const avgVolume = last3.length > 1
      ? last3.slice(0, -1).reduce((s, m) => s + p.monthly_volumes[m], 0) / (last3.length - 1)
      : 0;
    const lastMonthVol = last3.length > 0 ? p.monthly_volumes[last3[last3.length - 1]] : 0;
    const lonjakan_terdeteksi = avgVolume > 0 && lastMonthVol > avgVolume * 1.5;

    // Average entries per month
    const uniqueMonths = new Set();
    p.record_dates.forEach(d => { if (d) uniqueMonths.add(d.substring(0, 7)); });
    const avg_entries_per_month = uniqueMonths.size > 0 ? p.record_count / uniqueMonths.size : 0;

    // Percentages
    const pct_tanpa_gps = p.record_count > 0 ? (p.tanpa_gps_count / p.record_count) * 100 : 0;
    const pct_belum_sync = p.record_count > 0 ? (p.belum_sync_count / p.record_count) * 100 : 0;

    // ── Data Kependudukan (dari Supabase atau master_wilayah) ──
    const popData = kecamatanDemographics[p.wilayah.toLowerCase()];
    const has_population_data = !!popData && popData.jumlah_penduduk > 0;
    const jumlah_penduduk = popData?.jumlah_penduduk || 0;
    const jumlah_kk = popData?.jumlah_kk || 0;
    const luas_km2 = popData?.luas_km2 || 0;
    const timbulan_per_kapita = popData?.timbulan_per_kapita || DEFAULT_TIMBULAN_PER_KAPITA;
    const tahun_data = 2026;
    const sumber_data = 'Master Wilayah';

    // ── Potensi Timbulan & Kinerja ──
    const numMonths = Math.max(uniqueMonths.size, 1);
    const potensi_timbulan_domestik = jumlah_penduduk * timbulan_per_kapita;          // kg/hari
    const potensi_timbulan_fasum = fasilitasMap[p.wilayah.toLowerCase()] || 0;
    const potensi_timbulan_harian = potensi_timbulan_domestik + potensi_timbulan_fasum;
    const potensi_timbulan_bulanan = potensi_timbulan_harian * 30;                  // kg/bulan
    const volume_terkelola_bulanan = numMonths > 0 ? p.total_all_kg / numMonths : 0; // kg/bulan (rata-rata)
    const volume_terpilah_bulanan = numMonths > 0 ? (p.total_pilah_kg + p.total_olah_kg) / numMonths : 0;

    // % Penanganan = Volume Terkelola / Potensi × 100
    const pct_penanganan = potensi_timbulan_bulanan > 0
      ? (volume_terkelola_bulanan / potensi_timbulan_bulanan) * 100
      : 0;

    // % Pengurangan = Volume Terpilah / Volume Terkelola × 100
    const pct_pengurangan = volume_terkelola_bulanan > 0
      ? (volume_terpilah_bulanan / volume_terkelola_bulanan) * 100
      : 0;

    // Gap penanganan (kg/bulan yang belum terkelola)
    const gap_penanganan = Math.max(0, potensi_timbulan_bulanan - volume_terkelola_bulanan);

    // Kepadatan layanan (jiwa per unit fasilitas)
    const kepadatan_layanan = p.total_infrastruktur > 0
      ? Math.round(jumlah_penduduk / p.total_infrastruktur)
      : jumlah_penduduk; // Jika 0 fasilitas, seluruh penduduk tak terlayani

    // Timbulan per KK per bulan
    const timbulan_per_kk_bulan = jumlah_kk > 0
      ? (volume_terkelola_bulanan / jumlah_kk)
      : 0;

    const villageData = {
      ...p,
      recycling_rate: parseFloat(recycling_rate.toFixed(1)),
      residu_rate: parseFloat(residu_rate.toFixed(1)),
      tren_3_bulan,
      lonjakan_terdeteksi,
      avg_entries_per_month: parseFloat(avg_entries_per_month.toFixed(1)),
      pct_tanpa_gps: parseFloat(pct_tanpa_gps.toFixed(1)),
      pct_belum_sync: parseFloat(pct_belum_sync.toFixed(1)),
      // ── Data Kependudukan ──
      has_population_data,
      jumlah_penduduk,
      jumlah_kk,
      luas_km2,
      timbulan_per_kapita,
      tahun_data,
      sumber_data,
      // ── Metrik Kinerja Baru ──
      potensi_timbulan_harian: parseFloat(potensi_timbulan_harian.toFixed(1)),
      potensi_timbulan_bulanan: parseFloat(potensi_timbulan_bulanan.toFixed(1)),
      volume_terkelola_bulanan: parseFloat(volume_terkelola_bulanan.toFixed(1)),
      volume_terpilah_bulanan: parseFloat(volume_terpilah_bulanan.toFixed(1)),
      pct_penanganan: parseFloat(pct_penanganan.toFixed(1)),
      pct_pengurangan: parseFloat(pct_pengurangan.toFixed(1)),
      gap_penanganan: parseFloat(gap_penanganan.toFixed(1)),
      kepadatan_layanan,
      timbulan_per_kk_bulan: parseFloat(timbulan_per_kk_bulan.toFixed(1)),
      monthly_volumes_sorted: sortedMonths.map(m => ({ month: m, volume: p.monthly_volumes[m] })),
      record_dates: undefined, // Clean up Set
    };

    // Calculate composite score (now includes population-based metrics)
    villageData.skor = calculateVillageScore(villageData);

    // Evaluate rules
    villageData.recommendations = evaluateVillage(villageData);

    return villageData;
  });

  // Sort by score ascending (worst first)
  return result.sort((a, b) => a.skor - b.skor);
}
