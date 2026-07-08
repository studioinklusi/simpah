import XLSX from 'xlsx';

const headers = [
  'Nama Lokasi',
  'Tipe',
  'Kecamatan',
  'Desa Lokasi Fisik',
  'Alamat',
  'Latitude',
  'Longitude',
  'Kapasitas (kg)',
  'Desa yang Dilayani (Opsional - Pisahkan Koma)'
];

const data = [
  ['TPS Krandegan Utama', 'TPS', 'Banjarnegara', 'Krandegan', 'Jl. Pemuda No. 12, Krandegan', -7.3985, 109.697, 1500, 'Krandegan'],
  ['TPS3R Semampir Asri', 'TPS3R', 'Banjarnegara', 'Semampir', 'Jl. Semampir Indah No. 5', -7.405, 109.689, 3000, 'Semampir, Krandegan'],
  ['Bank Sampah Klampok Bersih', 'Bank Sampah', 'Purwareja Klampok', 'Klampok', 'Jl. Raya Klampok No. 88', -7.421, 109.615, 1000, 'Klampok'],
  ['Pengepul Mandiraja Sejahtera', 'Pengepul', 'Mandiraja', 'Mandiraja Wetan', 'Jl. Gatot Subroto No. 24', -7.452, 109.623, 5000, 'Mandiraja Wetan, Mandiraja Kulon'],
  ['TPS3R Purwareja Madani', 'TPS3R', 'Purwareja Klampok', 'Purwareja', 'Jl. Purwareja Baru No. 10', -7.418, 109.629, 2000, 'Purwareja'],
  ['TPS Parakancanggah Jaya', 'TPS', 'Banjarnegara', 'Parakancanggah', 'Jl. Selamanik Gg. IV', -7.3912, 109.692, 1200, 'Parakancanggah'],
  ['Bank Sampah Mandiraja Kulon', 'Bank Sampah', 'Mandiraja', 'Mandiraja Kulon', 'Jl. Kemerdekaan No. 50', -7.458, 109.619, 800, 'Mandiraja Kulon'],
  ['TPS Pagentan Lestari', 'TPS', 'Pagentan', 'Pagentan', 'Desa Pagentan RT 02/RW 01', -7.32, 109.73, 1000, 'Pagentan'],
  ['TPS3R Wanayasa Hijau', 'TPS3R', 'Wanayasa', 'Wanayasa', 'Jl. Raya Wanayasa No. 15', -7.225, 109.755, 2500, 'Wanayasa'],
  ['TPA Rakit Agung', 'TPA', 'Rakit', 'Rakit', 'Area TPA Rakit, Desa Rakit', -7.375, 109.58, 60000, 'Rakit']
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
XLSX.utils.book_append_sheet(wb, ws, 'Template');

XLSX.writeFile(wb, 'U:/Project/simpah-rilis v1/docs/data_dummy_lokasi.xlsx');
console.log('Excel file created successfully!');
