// SIMPAH - Intervention Rule Engine
// Logika otomatis untuk menghasilkan rekomendasi intervensi tingkat desa

// ========== Benchmarks ==========
export const BENCHMARKS = {
  timbulan_per_kk_kritis: 45,
  timbulan_per_kk_perhatian: 35,
  timbulan_per_kk_ideal: 30,
  recycling_rate_kritis: 10,
  recycling_rate_perhatian: 25,
  recycling_rate_ideal: 25,
  residu_rate_kritis: 60,
  residu_rate_perhatian: 40,
  residu_rate_ideal: 40,
  angkut_kritis: 2,
  angkut_ideal: 3,
  aduan_kritis: 10,
  aduan_perhatian: 5,
  aduan_ideal: 2,
  partisipasi_kritis: 20,
  partisipasi_perhatian: 40,
  partisipasi_ideal: 50,
  gap_input_kritis: 14,
  gap_input_perhatian: 7,
};

// ========== Rules ==========
export const INTERVENTION_RULES = [
  // --- Kelompok A: Timbulan & Volume ---
  {
    id: 'A-01',
    group: 'Timbulan & Volume',
    groupIcon: 'chart',
    urgency: 'kritis',
    pic: 'Dinas + Desa',
    horizon: 'Segera',
    condition: (d) => d.timbulan_per_kk_bulan > 45,
    title: 'Timbulan Per KK Sangat Tinggi',
    recommendation: 'Volume timbulan per KK melampaui ambang batas wajar. Lakukan survei komposisi sampah rumah tangga untuk mengidentifikasi sumber dominan. Pertimbangkan program pengomposan mandiri skala rumah tangga sebagai langkah segera untuk mengurangi beban di hulu.',
  },
  {
    id: 'A-02',
    group: 'Timbulan & Volume',
    groupIcon: 'chart',
    urgency: 'perhatian',
    pic: 'Desa',
    horizon: 'Pendek (1–3 bulan)',
    condition: (d) => d.timbulan_per_kk_bulan >= 35 && d.timbulan_per_kk_bulan <= 45,
    title: 'Timbulan Per KK Tinggi',
    recommendation: 'Volume timbulan berada di atas rata-rata kabupaten. Prioritaskan edukasi pengurangan sampah di sumber (source reduction) melalui program 3R berbasis RT/RW yang dikoordinasikan Pemerintah Desa.',
  },
  {
    id: 'A-03',
    group: 'Timbulan & Volume',
    groupIcon: 'chart',
    urgency: 'perhatian',
    pic: 'Dinas',
    horizon: 'Segera',
    condition: (d) => d.lonjakan_terdeteksi === true,
    title: 'Lonjakan Timbulan Tiba-tiba',
    recommendation: 'Terdeteksi lonjakan volume signifikan (+50% dari rata-rata). Verifikasi apakah terdapat kegiatan insidental (event warga, hari raya, atau pembangunan). Jika bukan insidental, segera lakukan inspeksi lapangan.',
  },
  {
    id: 'A-04',
    group: 'Timbulan & Volume',
    groupIcon: 'chart',
    urgency: 'kritis',
    pic: 'Dinas + Desa',
    horizon: 'Menengah (3–12 bulan)',
    condition: (d) => d.tren_3_bulan === 'naik',
    title: 'Tren Timbulan Terus Meningkat',
    recommendation: 'Data menunjukkan tren kenaikan timbulan yang konsisten selama 3 bulan berturut-turut. Diperlukan kajian kapasitas infrastruktur pengelolaan (TPS/TPS3R) dan revisi rencana operasional pengangkutan untuk jangka menengah.',
  },

  // --- Kelompok B: Pemilahan & Daur Ulang ---
  {
    id: 'B-01',
    group: 'Pemilahan & Daur Ulang',
    groupIcon: 'recycle',
    urgency: 'kritis',
    pic: 'Dinas + Desa',
    horizon: 'Pendek (1–3 bulan)',
    condition: (d) => d.recycling_rate < 10,
    title: 'Recycling Rate Sangat Rendah',
    recommendation: 'Tingkat daur ulang di bawah 10% menunjukkan hampir tidak ada aktivitas pemilahan efektif. Diperlukan intervensi menyeluruh: pembentukan atau reaktivasi Bank Sampah desa, rekrutmen kader pemilah, dan koordinasi dengan pengepul/offtaker terdekat.',
  },
  {
    id: 'B-02',
    group: 'Pemilahan & Daur Ulang',
    groupIcon: 'recycle',
    urgency: 'perhatian',
    pic: 'Desa',
    horizon: 'Pendek (1–3 bulan)',
    condition: (d) => d.recycling_rate >= 10 && d.recycling_rate < 25,
    title: 'Recycling Rate Rendah',
    recommendation: 'Recycling rate masih di bawah target nasional (25%). Evaluasi titik-titik kegagalan rantai pilah: apakah karena rendahnya partisipasi warga, tidak adanya fasilitas pilah di TPS, atau tidak tersedianya offtaker?',
  },
  {
    id: 'B-03',
    group: 'Pemilahan & Daur Ulang',
    groupIcon: 'recycle',
    urgency: 'perhatian',
    pic: 'Desa',
    horizon: 'Segera',
    condition: (d) => d.bank_sampah_count === 0,
    title: 'Tidak Ada Bank Sampah',
    recommendation: 'Tidak terdapat Bank Sampah di wilayah ini. Bank Sampah adalah infrastruktur kunci untuk mendorong pemilahan di hulu. Koordinasikan pembentukan Bank Sampah melalui Pemerintah Desa atau kelompok masyarakat.',
  },

  // --- Kelompok C: Residu & TPA ---
  {
    id: 'C-01',
    group: 'Residu & TPA',
    groupIcon: 'trash',
    urgency: 'kritis',
    pic: 'Dinas',
    horizon: 'Pendek (1–3 bulan)',
    condition: (d) => d.residu_rate > 60,
    title: 'Residu ke TPA Sangat Tinggi',
    recommendation: 'Lebih dari 60% sampah berakhir sebagai residu ke TPA — angka ini tidak berkelanjutan dan membebani kapasitas TPA kabupaten. Diperlukan evaluasi menyeluruh kapasitas pengolahan TPS dan peningkatan status ke TPS3R.',
  },
  {
    id: 'C-02',
    group: 'Residu & TPA',
    groupIcon: 'trash',
    urgency: 'perhatian',
    pic: 'Desa + Dinas',
    horizon: 'Menengah (3–12 bulan)',
    condition: (d) => d.residu_rate >= 40 && d.residu_rate <= 60,
    title: 'Residu ke TPA Tinggi',
    recommendation: 'Persentase residu berada di atas ambang yang direkomendasikan. Tinjau komposisi residu: jika didominasi organik, program biodigester atau komposter komunal dapat menurunkan angka ini secara signifikan.',
  },

  // --- Kelompok D: Infrastruktur ---
  {
    id: 'D-01',
    group: 'Infrastruktur & Layanan',
    groupIcon: 'construction',
    urgency: 'kritis',
    pic: 'Dinas',
    horizon: 'Segera',
    condition: (d) => d.tps_count === 0 && d.tps3r_count === 0,
    title: 'Tidak Ada TPS/TPS3R',
    recommendation: 'Wilayah ini tidak memiliki TPS maupun TPS3R. Ini adalah hambatan fundamental yang menyebabkan penumpukan sampah dan pembuangan liar. Identifikasi lokasi strategis untuk pembangunan TPS berdasarkan analisis spasial kepadatan permukiman.',
  },
  {
    id: 'D-02',
    group: 'Infrastruktur & Layanan',
    groupIcon: 'construction',
    urgency: 'perhatian',
    pic: 'Dinas + Desa',
    horizon: 'Menengah (3–12 bulan)',
    condition: (d) => d.total_infrastruktur < 2,
    title: 'Infrastruktur Pengelolaan Minim',
    recommendation: 'Total fasilitas pengelolaan sampah (TPS/TPS3R/Bank Sampah) di wilayah ini sangat minim. Pertimbangkan pembangunan bertahap dimulai dari Bank Sampah komunal yang berbiaya rendah.',
  },

  // --- Kelompok E: Aduan Masyarakat ---
  {
    id: 'E-01',
    group: 'Aduan Masyarakat',
    groupIcon: 'megaphone',
    urgency: 'kritis',
    pic: 'Dinas',
    horizon: 'Segera',
    condition: (d) => d.complaint_count > 10,
    title: 'Volume Aduan Sangat Tinggi',
    recommendation: 'Lebih dari 10 aduan aktif — sinyal krisis layanan. Prioritaskan respons lapangan dalam 3×24 jam. Tinjau kluster spasial aduan di peta GIS untuk menentukan titik hot-spot prioritas inspeksi.',
  },
  {
    id: 'E-02',
    group: 'Aduan Masyarakat',
    groupIcon: 'megaphone',
    urgency: 'perhatian',
    pic: 'Dinas',
    horizon: 'Segera',
    condition: (d) => d.complaint_count >= 5 && d.complaint_count <= 10,
    title: 'Aduan Masyarakat Tinggi',
    recommendation: 'Terdapat 5–10 aduan aktif. Lakukan prioritasi penanganan berdasarkan kategori aduan dan lokasi kluster. Koordinasikan respons bersama perangkat desa.',
  },
  {
    id: 'E-03',
    group: 'Aduan Masyarakat',
    groupIcon: 'megaphone',
    urgency: 'kritis',
    pic: 'Dinas',
    horizon: 'Segera',
    condition: (d) => d.aduan_belum_ditangani > 3,
    title: 'Aduan Berulang Tanpa Respons',
    recommendation: 'Terdapat aduan yang belum ditangani. Aduan yang dibiarkan merusak kepercayaan publik. Eskalasikan ke pejabat terkait dengan PIC dan tenggat waktu yang jelas.',
  },

  // --- Kelompok F: Kelembagaan ---
  {
    id: 'F-01',
    group: 'Kapasitas Kelembagaan',
    groupIcon: 'landmark',
    urgency: 'perhatian',
    pic: 'Dinas',
    horizon: 'Pendek (1–3 bulan)',
    condition: (d) => d.avg_entries_per_month < 4,
    title: 'Data Entry Tidak Konsisten',
    recommendation: 'Frekuensi input data sangat rendah (<4x/bulan), mengindikasikan kader tidak aktif atau hambatan teknis. Lakukan verifikasi dan pembinaan langsung ke kader desa.',
  },

  // --- Kelompok G: Kepatuhan & Audit ---
  {
    id: 'G-01',
    group: 'Kepatuhan & Audit',
    groupIcon: 'search',
    urgency: 'perhatian',
    pic: 'Dinas',
    horizon: 'Pendek (1–3 bulan)',
    condition: (d) => d.pct_tanpa_gps > 30,
    title: 'Banyak Entri Tanpa GPS',
    recommendation: 'Lebih dari 30% entri tanpa geolokasi — melemahkan auditabilitas. Lakukan re-training penggunaan aplikasi kepada kader dengan penekanan pentingnya izin lokasi aktif di perangkat.',
  },
  {
    id: 'G-02',
    group: 'Kepatuhan & Audit',
    groupIcon: 'search',
    urgency: 'perhatian',
    pic: 'Dinas',
    horizon: 'Pendek (1–3 bulan)',
    condition: (d) => d.pct_belum_sync > 20,
    title: 'Data Banyak Belum Tersinkronisasi',
    recommendation: 'Data dalam jumlah signifikan belum tersinkronisasi ke server pusat. Kemungkinan keterbatasan akses internet. Koordinasikan sinkronisasi manual di lokasi dengan akses internet (kantor desa/kecamatan).',
  },

  // --- Kelompok H: Komparatif & Potensi ---
  {
    id: 'H-01',
    group: 'Komparatif & Potensi',
    groupIcon: 'trendUp',
    urgency: 'kritis',
    pic: 'Dinas',
    horizon: 'Menengah (3–12 bulan)',
    condition: (d) => d.skor < 40,
    title: 'Performa di Bawah Standar',
    recommendation: 'Performa pengelolaan desa ini signifikan di bawah standar. Pertimbangkan program sister-village dengan desa berperforma tinggi untuk transfer pengetahuan dan praktik baik secara peer-to-peer.',
  },
  {
    id: 'H-02',
    group: 'Komparatif & Potensi',
    groupIcon: 'trendUp',
    urgency: 'pengembangan',
    pic: 'Dinas',
    horizon: 'Panjang (> 1 tahun)',
    condition: (d) => d.recycling_rate > 40 && d.residu_rate < 30 && d.complaint_count < 2,
    title: 'Potensi Desa Model',
    recommendation: 'Desa ini memiliki performa pengelolaan sampah terbaik di kelasnya. Rekomendasikan untuk dijadikan desa percontohan (pilot village) dalam program replikasi kabupaten.',
  },
  {
    id: 'H-03',
    group: 'Komparatif & Potensi',
    groupIcon: 'trendUp',
    urgency: 'pengembangan',
    pic: 'Desa + Pemdes',
    horizon: 'Menengah (3–12 bulan)',
    condition: (d) => d.recycling_rate > 25 && d.bank_sampah_count > 0,
    title: 'Potensi Ekonomi Daur Ulang',
    recommendation: 'Volume material terpilah cukup signifikan. Fasilitasi akses ke platform digital pengepul atau negosiasi harga dengan pengepul resmi kabupaten. Pertimbangkan agregasi material antar desa.',
  },
];

// ========== Evaluator ==========
export function evaluateVillage(villageData) {
  return INTERVENTION_RULES
    .filter(rule => {
      try {
        return rule.condition(villageData);
      } catch {
        return false;
      }
    })
    .sort((a, b) => getUrgencyWeight(b.urgency) - getUrgencyWeight(a.urgency));
}

export function calculateVillageScore(d) {
  let score = 50; // Baseline

  // Recycling rate contribution (0-30 points)
  if (d.recycling_rate >= 25) score += 30;
  else if (d.recycling_rate >= 10) score += Math.round((d.recycling_rate / 25) * 30);
  else score -= 10;

  // Residu penalty (0 to -25)
  if (d.residu_rate > 60) score -= 25;
  else if (d.residu_rate > 40) score -= 15;
  else score += 10;

  // Complaint penalty (0 to -20)
  if (d.complaint_count > 10) score -= 20;
  else if (d.complaint_count > 5) score -= 10;
  else if (d.complaint_count <= 2) score += 10;

  // Data quality bonus/penalty
  if (d.pct_tanpa_gps > 30) score -= 5;
  if (d.pct_belum_sync > 20) score -= 5;
  if (d.avg_entries_per_month >= 8) score += 5;

  return Math.max(0, Math.min(100, score));
}

export function getUrgencyWeight(urgency) {
  return { kritis: 3, perhatian: 2, pengembangan: 1 }[urgency] || 0;
}

export function getUrgencyLabel(urgency) {
  return { kritis: 'Kritis', perhatian: 'Perlu Perhatian', pengembangan: 'Pengembangan' }[urgency] || urgency;
}

export function getUrgencyColor(urgency) {
  return { kritis: '#ef4444', perhatian: '#f59e0b', pengembangan: '#10b981' }[urgency] || '#6b7280';
}

export function getScoreStatus(score) {
  if (score >= 70) return { label: 'Baik', color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
  if (score >= 45) return { label: 'Perhatian', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  return { label: 'Prioritas', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
}
