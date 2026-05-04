// SIMPAH - Seed Data Generator (Kabupaten Banjarnegara)
import { getDB } from './schema.js';

const BANJARNEGARA_CENTER = { lat: -7.3953, lng: 109.6944 };

const LOCATIONS_DATA = [
  { id: 'loc-01', name: 'TPS3R Banjarnegara', type: 'tps3r', lat: -7.3891, lng: 109.6952, address: 'Jl. Selamanik No. 10, Banjarnegara', wilayah: 'Banjarnegara' },
  { id: 'loc-02', name: 'TPS3R Purwareja', type: 'tps3r', lat: -7.4123, lng: 109.6310, address: 'Jl. Raya Purwareja, Purwareja Klampok', wilayah: 'Purwareja Klampok' },
  { id: 'loc-03', name: 'TPS Mandiraja', type: 'tps', lat: -7.4502, lng: 109.6218, address: 'Jl. Raya Mandiraja', wilayah: 'Mandiraja' },
  { id: 'loc-04', name: 'Bank Sampah Berseri', type: 'bank_sampah', lat: -7.3935, lng: 109.6988, address: 'Jl. Letjend S. Parman No. 45, Banjarnegara', wilayah: 'Banjarnegara' },
  { id: 'loc-05', name: 'Bank Sampah Mawar', type: 'bank_sampah', lat: -7.3780, lng: 109.7051, address: 'Jl. Pemuda No. 22, Banjarnegara', wilayah: 'Banjarnegara' },
  { id: 'loc-06', name: 'Bank Sampah Cempaka', type: 'bank_sampah', lat: -7.4250, lng: 109.6850, address: 'Jl. Raya Sigaluh No. 5', wilayah: 'Sigaluh' },
  { id: 'loc-07', name: 'Pengepul Jaya Abadi', type: 'pengepul', lat: -7.3998, lng: 109.7102, address: 'Jl. Salak No. 8, Banjarnegara', wilayah: 'Banjarnegara' },
  { id: 'loc-08', name: 'Pengepul Berkah', type: 'pengepul', lat: -7.4350, lng: 109.6450, address: 'Jl. Raya Bawang No. 12', wilayah: 'Bawang' },
  { id: 'loc-09', name: 'TPA Winong', type: 'tpa', lat: -7.3720, lng: 109.6780, address: 'Desa Winong, Kec. Banjarnegara', wilayah: 'Banjarnegara' },
  { id: 'loc-10', name: 'TPS3R Wanadadi', type: 'tps3r', lat: -7.3555, lng: 109.7410, address: 'Jl. Raya Wanadadi No. 3', wilayah: 'Wanadadi' }
];

const USERS_DATA = [
  { id: 'usr-01', username: 'warga1', password: 'warga123', name: 'Warga Banjarnegara', role: 'warga', phone: '081234567890' },
  { id: 'usr-02', username: 'petugas1', password: 'petugas123', name: 'Petugas Pengangkut', role: 'petugas', job_type: 'angkut', location_id: 'loc-01', phone: '081234567891' },
  { id: 'usr-03', username: 'eksekutif1', password: 'eksekutif123', name: 'Bupati Banjarnegara', role: 'eksekutif', phone: '081234567892' },
  { id: 'usr-04', username: 'admin1', password: 'admin123', name: 'Admin SIMPAH', role: 'admin', phone: '081234567893' },
  { id: 'usr-05', username: 'koordinator1', password: 'koordinator123', name: 'Koordinator Lapangan', role: 'petugas', job_type: 'koordinator', location_id: 'loc-01', phone: '081234567894' },
  { id: 'usr-06', username: 'operator1', password: 'operator123', name: 'Operator TPS3R', role: 'petugas', job_type: 'operator_tps', location_id: 'loc-01', phone: '081234567895' },
  { id: 'usr-07', username: 'kader1', password: 'kader123', name: 'Kader Lingkungan', role: 'petugas', job_type: 'kader', location_id: 'loc-01', phone: '081234567896' }
];

const FLEET_DATA = [
  { id: 'flt-01', plate_number: 'R 1234 AB', vehicle_type: 'Dump Truck', driver_name: 'Suparjo', capacity_kg: 5000, status: 'active' },
  { id: 'flt-02', plate_number: 'R 5678 CD', vehicle_type: 'Arm Roll', driver_name: 'Darmaji', capacity_kg: 8000, status: 'active' },
  { id: 'flt-03', plate_number: 'R 9012 EF', vehicle_type: 'Motor Roda Tiga', driver_name: 'Wahyudi', capacity_kg: 500, status: 'active' },
  { id: 'flt-04', plate_number: 'R 3456 GH', vehicle_type: 'Pick Up', driver_name: 'Eko Prasetyo', capacity_kg: 1500, status: 'maintenance' }
];

const MOU_DATA = [
  { id: 'mou-01', transporter_name: 'CV. Bersih Lestari', contract_number: 'MOU/2025/001', start_date: '2025-01-01', end_date: '2026-12-31', status: 'active', fleet_ids: ['flt-01', 'flt-02'], contact_person: 'Ir. Sugeng', phone: '081299988877' },
  { id: 'mou-02', transporter_name: 'PT. Hijau Mandiri', contract_number: 'MOU/2025/002', start_date: '2025-06-01', end_date: '2026-05-31', status: 'active', fleet_ids: ['flt-03'], contact_person: 'Bambang S.', phone: '082188877766' },
  { id: 'mou-03', transporter_name: 'UD. Sampah Bersih', contract_number: 'MOU/2024/003', start_date: '2024-01-01', end_date: '2025-12-31', status: 'expiring', fleet_ids: ['flt-04'], contact_person: 'Haryanto', phone: '085766655544' }
];

const SIPSN_CODES = ['SM', 'KR', 'KK', 'PL', 'LG', 'KT', 'KL', 'KC', 'LN'];

function randomFromList(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function generateWasteRecords(count = 120) {
  const records = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 12) + 6, Math.floor(Math.random() * 60));

    const type = randomFromList(['masuk', 'masuk', 'masuk', 'pilah', 'pilah', 'residu']);
    const location = randomFromList(LOCATIONS_DATA);
    const user = randomFromList(USERS_DATA);
    const category = randomFromList(SIPSN_CODES);

    const weightRanges = {
      masuk: [50, 800],
      pilah: [10, 200],
      residu: [20, 300]
    };
    const [minW, maxW] = weightRanges[type];

    records.push({
      id: `wr-${String(i + 1).padStart(4, '0')}`,
      type,
      category_sipsn: category,
      weight_kg: parseFloat(randomBetween(minW, maxW).toFixed(1)),
      lat: location.lat + randomBetween(-0.002, 0.002),
      lng: location.lng + randomBetween(-0.002, 0.002),
      location_id: location.id,
      location_name: location.name,
      user_id: user.id,
      user_name: user.name,
      fleet_id: type === 'masuk' ? randomFromList(FLEET_DATA).id : null,
      fleet_plate: type === 'masuk' ? randomFromList(FLEET_DATA).plate_number : null,
      is_incidental: Math.random() < 0.08,
      notes: Math.random() < 0.3 ? randomFromList([
        'Kondisi normal',
        'Volume meningkat karena hari raya',
        'Sampah dari pasar pagi',
        'Pembersihan selokan',
        'Pengumpulan dari RT 03',
        'Campuran organik-anorganik',
        'Banyak plastik kemasan'
      ]) : '',
      created_at: date.toISOString(),
      created_by: user.id,
      date_str: date.toISOString().split('T')[0],
      synced: Math.random() < 0.85,
      verification_status: 'approved'
    });
  }

  // Create explicit pending records for demo
  records.push({
    id: `wr-pend-01`,
    type: 'masuk', category_sipsn: 'PL', weight_kg: 50.5,
    lat: LOCATIONS_DATA[1].lat, lng: LOCATIONS_DATA[1].lng,
    location_id: LOCATIONS_DATA[1].id, location_name: LOCATIONS_DATA[1].name,
    user_id: USERS_DATA[0].id, user_name: USERS_DATA[0].name,
    fleet_id: null, fleet_plate: null, is_incidental: false,
    notes: 'Klaim plastik jumlah besar',
    created_at: now.toISOString(),
    date_str: now.toISOString().split('T')[0],
    synced: true,
    verification_status: 'pending'
  });
  
  records.push({
    id: `wr-pend-02`,
    type: 'residu', category_sipsn: 'LN', weight_kg: 120,
    lat: LOCATIONS_DATA[3].lat, lng: LOCATIONS_DATA[3].lng,
    location_id: LOCATIONS_DATA[3].id, location_name: LOCATIONS_DATA[3].name,
    user_id: USERS_DATA[1].id, user_name: USERS_DATA[1].name,
    fleet_id: null, fleet_plate: null, is_incidental: false,
    notes: 'Residu bulanan',
    created_at: now.toISOString(),
    date_str: now.toISOString().split('T')[0],
    synced: true,
    verification_status: 'pending'
  });

  return records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function generateComplaints() {
  return [
    {
      id: 'cmp-001', tracking_number: 'ADU-260401-1234',
      reporter_user_id: 'usr-01',
      reporter_name: 'Warga RT 05 RW 02', reporter_phone: '081233344455',
      is_anonymous: false,
      category: 'Sampah menumpuk', description: 'Sampah di TPS depan pasar sudah menumpuk 3 hari tidak diangkut, menimbulkan bau tidak sedap.',
      lat: -7.3920, lng: 109.6935, address: 'TPS Pasar Banjarnegara',
      photo_url: null, status: 'baru', created_at: '2026-04-19T08:30:00.000Z'
    },
    {
      id: 'cmp-002', tracking_number: 'ADU-260402-5678',
      reporter_user_id: 'usr-01',
      reporter_name: 'Ibu Darmi', reporter_phone: '082199988877',
      is_anonymous: false,
      category: 'Pembuangan liar', description: 'Ada warga yang membuang sampah ke sungai di belakang perumahan Griya Asri.',
      lat: -7.4010, lng: 109.7020, address: 'Belakang Perumahan Griya Asri',
      photo_url: null, status: 'diproses', created_at: '2026-04-18T14:15:00.000Z'
    },
    {
      id: 'cmp-003', tracking_number: 'ADU-260403-9012',
      reporter_user_id: null,
      reporter_name: 'Pak Ahmad', reporter_phone: '085677788899',
      is_anonymous: true,
      category: 'Bau tidak sedap', description: 'Bau dari TPA Winong sangat menyengat ketika angin bertiup ke arah pemukiman.',
      lat: -7.3740, lng: 109.6800, address: 'Sekitar TPA Winong',
      photo_url: null, status: 'selesai', created_at: '2026-04-15T10:00:00.000Z'
    }
  ];
}

function generateEvents() {
  return [
    {
      id: 'evt-001', type: 'kerja_bakti', title: 'Kerja Bakti Bersih Desa',
      description: 'Kegiatan kerja bakti membersihkan lingkungan desa menjelang HUT RI',
      location_name: 'Desa Semampir', participants: 45,
      lat: -7.3900, lng: 109.6960,
      user_id: 'usr-01', user_name: 'Siti Aminah',
      created_at: '2026-04-10T07:00:00.000Z'
    },
    {
      id: 'evt-002', type: 'edukasi', title: 'Sosialisasi Pilah Sampah',
      description: 'Sosialisasi pemilahan sampah di tingkat RT/RW bersama karang taruna',
      location_name: 'Balai Desa Parakancanggah', participants: 30,
      lat: -7.3950, lng: 109.6970,
      user_id: 'usr-04', user_name: 'Pemdes Mandiraja',
      created_at: '2026-04-05T09:00:00.000Z'
    }
  ];
}

export async function seedDatabase() {
  const db = await getDB();

  // Check if already seeded
  const existingUsers = await db.count('users');
  if (existingUsers > 0) {
    console.log('Database already seeded');

    // MIGRATION: Update legacy users to new 4 roles (WARGA, PETUGAS, EKSEKUTIF, ADMIN)
    const user1 = await db.get('users', 'usr-01');
    if (user1 && user1.role !== 'warga') {
      const tx = db.transaction('users', 'readwrite');
      for (const user of USERS_DATA) {
        await tx.store.put(user);
      }
      // Clean up extra legacy users
      await tx.store.delete('usr-05');
      await tx.store.delete('usr-06');
      await tx.done;
      console.log('Successfully migrated legacy accounts to 4 roles (warga, petugas, eksekutif, admin)');
    }

    return false;
  }

  console.log('Seeding database...');

  // Seed users
  const tx1 = db.transaction('users', 'readwrite');
  for (const user of USERS_DATA) {
    await tx1.store.put(user);
  }
  await tx1.done;

  // Seed locations
  const tx2 = db.transaction('locations', 'readwrite');
  for (const loc of LOCATIONS_DATA) {
    await tx2.store.put(loc);
  }
  await tx2.done;

  // Seed fleet
  const tx3 = db.transaction('fleet', 'readwrite');
  for (const f of FLEET_DATA) {
    await tx3.store.put(f);
  }
  await tx3.done;

  // Seed MoU
  const tx4 = db.transaction('mou', 'readwrite');
  for (const m of MOU_DATA) {
    await tx4.store.put(m);
  }
  await tx4.done;

  // Seed waste records
  const wasteRecords = generateWasteRecords(120);
  const tx5 = db.transaction('waste_records', 'readwrite');
  for (const r of wasteRecords) {
    await tx5.store.put(r);
  }
  await tx5.done;

  // Seed complaints
  const complaints = generateComplaints();
  const tx6 = db.transaction('complaints', 'readwrite');
  for (const c of complaints) {
    await tx6.store.put(c);
  }
  await tx6.done;

  // Seed events
  const events = generateEvents();
  const tx7 = db.transaction('incidental_events', 'readwrite');
  for (const e of events) {
    await tx7.store.put(e);
  }
  await tx7.done;

  console.log('Database seeded successfully!');
  return true;
}
