// SIMPAH - Seed Data Generator (Kabupaten Banjarnegara)
import { getDB } from './schema.js';

const BANJARNEGARA_CENTER = { lat: -7.3953, lng: 109.6944 };

const WILAYAH_DATA = [
  { id: 'wil-001', kecamatan: 'Banjarmangu', desa_kelurahan: 'Banjarkulon', jumlah_penduduk: 5000, jumlah_kk: 1220, luas_km2: 2 },
  { id: 'wil-002', kecamatan: 'Banjarmangu', desa_kelurahan: 'Banjarmangu', jumlah_penduduk: 4500, jumlah_kk: 1150, luas_km2: 3.5 },
  { id: 'wil-003', kecamatan: 'Banjarmangu', desa_kelurahan: 'Beji', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.8 },
  { id: 'wil-004', kecamatan: 'Banjarmangu', desa_kelurahan: 'Gripit', jumlah_penduduk: 5100, jumlah_kk: 1244, luas_km2: 2.3 },
  { id: 'wil-005', kecamatan: 'Banjarmangu', desa_kelurahan: 'Jenggawur', jumlah_penduduk: 3800, jumlah_kk: 970, luas_km2: 2.4 },
  { id: 'wil-006', kecamatan: 'Banjarmangu', desa_kelurahan: 'Kalilunjar', jumlah_penduduk: 2700, jumlah_kk: 690, luas_km2: 2.3 },
  { id: 'wil-007', kecamatan: 'Banjarmangu', desa_kelurahan: 'Kendaga', jumlah_penduduk: 4700, jumlah_kk: 1146, luas_km2: 2.6 },
  { id: 'wil-008', kecamatan: 'Banjarmangu', desa_kelurahan: 'Kesenet', jumlah_penduduk: 2900, jumlah_kk: 740, luas_km2: 2.1 },
  { id: 'wil-009', kecamatan: 'Banjarmangu', desa_kelurahan: 'Majatengah', jumlah_penduduk: 3400, jumlah_kk: 870, luas_km2: 2.9 },
  { id: 'wil-010', kecamatan: 'Banjarmangu', desa_kelurahan: 'Paseh', jumlah_penduduk: 3100, jumlah_kk: 800, luas_km2: 2.6 },
  { id: 'wil-011', kecamatan: 'Banjarmangu', desa_kelurahan: 'Pekandangan', jumlah_penduduk: 4500, jumlah_kk: 1098, luas_km2: 3.1 },
  { id: 'wil-012', kecamatan: 'Banjarmangu', desa_kelurahan: 'Prendengan', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-013', kecamatan: 'Banjarmangu', desa_kelurahan: 'Rejasari', jumlah_penduduk: 4500, jumlah_kk: 1098, luas_km2: 3.1 },
  { id: 'wil-014', kecamatan: 'Banjarmangu', desa_kelurahan: 'Sigeblok', jumlah_penduduk: 5400, jumlah_kk: 1317, luas_km2: 2.8 },
  { id: 'wil-015', kecamatan: 'Banjarmangu', desa_kelurahan: 'Sijenggung', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 4 },
  { id: 'wil-016', kecamatan: 'Banjarmangu', desa_kelurahan: 'Sijeruk', jumlah_penduduk: 5700, jumlah_kk: 1390, luas_km2: 3.3 },
  { id: 'wil-017', kecamatan: 'Banjarmangu', desa_kelurahan: 'Sipedang', jumlah_penduduk: 4700, jumlah_kk: 1146, luas_km2: 2.6 },
  { id: 'wil-018', kecamatan: 'Banjarnegara', desa_kelurahan: 'Argasoka', jumlah_penduduk: 4500, jumlah_kk: 1150, luas_km2: 2.1 },
  { id: 'wil-019', kecamatan: 'Banjarnegara', desa_kelurahan: 'Karangtengah', jumlah_penduduk: 5000, jumlah_kk: 1300, luas_km2: 2.8 },
  { id: 'wil-020', kecamatan: 'Banjarnegara', desa_kelurahan: 'Krandegan', jumlah_penduduk: 7200, jumlah_kk: 1850, luas_km2: 2.5 },
  { id: 'wil-021', kecamatan: 'Banjarnegara', desa_kelurahan: 'Kutabanjarnegara', jumlah_penduduk: 6000, jumlah_kk: 1550, luas_km2: 1.8 },
  { id: 'wil-022', kecamatan: 'Banjarnegara', desa_kelurahan: 'Parakancanggah', jumlah_penduduk: 8500, jumlah_kk: 2200, luas_km2: 3.1 },
  { id: 'wil-023', kecamatan: 'Banjarnegara', desa_kelurahan: 'Semampir', jumlah_penduduk: 6800, jumlah_kk: 1750, luas_km2: 2.2 },
  { id: 'wil-024', kecamatan: 'Banjarnegara', desa_kelurahan: 'Semarang', jumlah_penduduk: 4200, jumlah_kk: 1080, luas_km2: 2.3 },
  { id: 'wil-025', kecamatan: 'Banjarnegara', desa_kelurahan: 'Sokanandi', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.8 },
  { id: 'wil-026', kecamatan: 'Banjarnegara', desa_kelurahan: 'Wangon', jumlah_penduduk: 4900, jumlah_kk: 1195, luas_km2: 2.3 },
  { id: 'wil-027', kecamatan: 'Banjarnegara', desa_kelurahan: 'Ampelsari', jumlah_penduduk: 3800, jumlah_kk: 980, luas_km2: 3.4 },
  { id: 'wil-028', kecamatan: 'Banjarnegara', desa_kelurahan: 'Cendana', jumlah_penduduk: 4000, jumlah_kk: 1020, luas_km2: 4.1 },
  { id: 'wil-029', kecamatan: 'Banjarnegara', desa_kelurahan: 'Sokayasa', jumlah_penduduk: 3200, jumlah_kk: 820, luas_km2: 2 },
  { id: 'wil-030', kecamatan: 'Banjarnegara', desa_kelurahan: 'Tlagawera', jumlah_penduduk: 4300, jumlah_kk: 1049, luas_km2: 3.3 },
  { id: 'wil-031', kecamatan: 'Batur', desa_kelurahan: 'Bakal', jumlah_penduduk: 2800, jumlah_kk: 720, luas_km2: 3.1 },
  { id: 'wil-032', kecamatan: 'Batur', desa_kelurahan: 'Batur', jumlah_penduduk: 6200, jumlah_kk: 1590, luas_km2: 5.2 },
  { id: 'wil-033', kecamatan: 'Batur', desa_kelurahan: 'Dieng Kulon', jumlah_penduduk: 4500, jumlah_kk: 1150, luas_km2: 3.8 },
  { id: 'wil-034', kecamatan: 'Batur', desa_kelurahan: 'Karangtengah', jumlah_penduduk: 3900, jumlah_kk: 1000, luas_km2: 4.1 },
  { id: 'wil-035', kecamatan: 'Batur', desa_kelurahan: 'Kepakisan', jumlah_penduduk: 3100, jumlah_kk: 800, luas_km2: 3.4 },
  { id: 'wil-036', kecamatan: 'Batur', desa_kelurahan: 'Pasurenan', jumlah_penduduk: 4600, jumlah_kk: 1122, luas_km2: 2.9 },
  { id: 'wil-037', kecamatan: 'Batur', desa_kelurahan: 'Pekasiran', jumlah_penduduk: 3500, jumlah_kk: 900, luas_km2: 4.4 },
  { id: 'wil-038', kecamatan: 'Batur', desa_kelurahan: 'Sumberejo', jumlah_penduduk: 4400, jumlah_kk: 1073, luas_km2: 3.3 },
  { id: 'wil-039', kecamatan: 'Bawang', desa_kelurahan: 'Bandingan', jumlah_penduduk: 2900, jumlah_kk: 740, luas_km2: 1.9 },
  { id: 'wil-040', kecamatan: 'Bawang', desa_kelurahan: 'Bawang', jumlah_penduduk: 6200, jumlah_kk: 1590, luas_km2: 3.2 },
  { id: 'wil-041', kecamatan: 'Bawang', desa_kelurahan: 'Binorong', jumlah_penduduk: 5800, jumlah_kk: 1490, luas_km2: 2.8 },
  { id: 'wil-042', kecamatan: 'Bawang', desa_kelurahan: 'Blambangan', jumlah_penduduk: 5100, jumlah_kk: 1310, luas_km2: 2.5 },
  { id: 'wil-043', kecamatan: 'Bawang', desa_kelurahan: 'Depok', jumlah_penduduk: 4300, jumlah_kk: 1100, luas_km2: 2.1 },
  { id: 'wil-044', kecamatan: 'Bawang', desa_kelurahan: 'Gemuruh', jumlah_penduduk: 4200, jumlah_kk: 1024, luas_km2: 3.7 },
  { id: 'wil-045', kecamatan: 'Bawang', desa_kelurahan: 'Joho', jumlah_penduduk: 3900, jumlah_kk: 1000, luas_km2: 2.2 },
  { id: 'wil-046', kecamatan: 'Bawang', desa_kelurahan: 'Kebondalem', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.7 },
  { id: 'wil-047', kecamatan: 'Bawang', desa_kelurahan: 'Kutayasa', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.8 },
  { id: 'wil-048', kecamatan: 'Bawang', desa_kelurahan: 'Majalengka', jumlah_penduduk: 3200, jumlah_kk: 820, luas_km2: 2 },
  { id: 'wil-049', kecamatan: 'Bawang', desa_kelurahan: 'Mantrianom', jumlah_penduduk: 4000, jumlah_kk: 1020, luas_km2: 2.7 },
  { id: 'wil-050', kecamatan: 'Bawang', desa_kelurahan: 'Masaran', jumlah_penduduk: 3800, jumlah_kk: 970, luas_km2: 2.3 },
  { id: 'wil-051', kecamatan: 'Bawang', desa_kelurahan: 'Pucang', jumlah_penduduk: 4100, jumlah_kk: 1050, luas_km2: 2.6 },
  { id: 'wil-052', kecamatan: 'Bawang', desa_kelurahan: 'Serang', jumlah_penduduk: 5700, jumlah_kk: 1390, luas_km2: 3.3 },
  { id: 'wil-053', kecamatan: 'Bawang', desa_kelurahan: 'Wanadri', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 4 },
  { id: 'wil-054', kecamatan: 'Bawang', desa_kelurahan: 'Watuurip', jumlah_penduduk: 5400, jumlah_kk: 1317, luas_km2: 2.8 },
  { id: 'wil-055', kecamatan: 'Bawang', desa_kelurahan: 'Winong', jumlah_penduduk: 4400, jumlah_kk: 1073, luas_km2: 3.1 },
  { id: 'wil-056', kecamatan: 'Bawang', desa_kelurahan: 'Wiramastra', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-057', kecamatan: 'Kalibening', desa_kelurahan: 'Asinan', jumlah_penduduk: 4500, jumlah_kk: 1098, luas_km2: 3 },
  { id: 'wil-058', kecamatan: 'Kalibening', desa_kelurahan: 'Bedana', jumlah_penduduk: 5400, jumlah_kk: 1317, luas_km2: 2.9 },
  { id: 'wil-059', kecamatan: 'Kalibening', desa_kelurahan: 'Gununglangit', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 4 },
  { id: 'wil-060', kecamatan: 'Kalibening', desa_kelurahan: 'Kalibening', jumlah_penduduk: 5100, jumlah_kk: 1310, luas_km2: 4.2 },
  { id: 'wil-061', kecamatan: 'Kalibening', desa_kelurahan: 'Kalibombong', jumlah_penduduk: 4700, jumlah_kk: 1146, luas_km2: 2.6 },
  { id: 'wil-062', kecamatan: 'Kalibening', desa_kelurahan: 'Kalisat Kidul', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 3.9 },
  { id: 'wil-063', kecamatan: 'Kalibening', desa_kelurahan: 'Karang Anyar', jumlah_penduduk: 4300, jumlah_kk: 1049, luas_km2: 3.5 },
  { id: 'wil-064', kecamatan: 'Kalibening', desa_kelurahan: 'Kasinoman', jumlah_penduduk: 3200, jumlah_kk: 820, luas_km2: 3.5 },
  { id: 'wil-065', kecamatan: 'Kalibening', desa_kelurahan: 'Kertasari', jumlah_penduduk: 2900, jumlah_kk: 740, luas_km2: 2.9 },
  { id: 'wil-066', kecamatan: 'Kalibening', desa_kelurahan: 'Majatengah', jumlah_penduduk: 3400, jumlah_kk: 870, luas_km2: 3.1 },
  { id: 'wil-067', kecamatan: 'Kalibening', desa_kelurahan: 'Plorengan', jumlah_penduduk: 2700, jumlah_kk: 690, luas_km2: 3.8 },
  { id: 'wil-068', kecamatan: 'Kalibening', desa_kelurahan: 'Sembawa', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.7 },
  { id: 'wil-069', kecamatan: 'Kalibening', desa_kelurahan: 'Sidakangen', jumlah_penduduk: 3000, jumlah_kk: 770, luas_km2: 2.7 },
  { id: 'wil-070', kecamatan: 'Kalibening', desa_kelurahan: 'Sikumpul', jumlah_penduduk: 4900, jumlah_kk: 1195, luas_km2: 2.2 },
  { id: 'wil-071', kecamatan: 'Kalibening', desa_kelurahan: 'Sirukem', jumlah_penduduk: 5800, jumlah_kk: 1415, luas_km2: 3.5 },
  { id: 'wil-072', kecamatan: 'Kalibening', desa_kelurahan: 'Sirukun', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 3.9 },
  { id: 'wil-073', kecamatan: 'Karangkobar', desa_kelurahan: 'Ambal', jumlah_penduduk: 3100, jumlah_kk: 800, luas_km2: 2.8 },
  { id: 'wil-074', kecamatan: 'Karangkobar', desa_kelurahan: 'Binangun', jumlah_penduduk: 2800, jumlah_kk: 720, luas_km2: 2.4 },
  { id: 'wil-075', kecamatan: 'Karangkobar', desa_kelurahan: 'Gumelar', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-076', kecamatan: 'Karangkobar', desa_kelurahan: 'Jlegong', jumlah_penduduk: 4600, jumlah_kk: 1122, luas_km2: 2.8 },
  { id: 'wil-077', kecamatan: 'Karangkobar', desa_kelurahan: 'Karanggondang', jumlah_penduduk: 5600, jumlah_kk: 1366, luas_km2: 3.1 },
  { id: 'wil-078', kecamatan: 'Karangkobar', desa_kelurahan: 'Karangkobar', jumlah_penduduk: 5500, jumlah_kk: 1410, luas_km2: 3.1 },
  { id: 'wil-079', kecamatan: 'Karangkobar', desa_kelurahan: 'Leksana', jumlah_penduduk: 2900, jumlah_kk: 740, luas_km2: 2.5 },
  { id: 'wil-080', kecamatan: 'Karangkobar', desa_kelurahan: 'Pagerpelah', jumlah_penduduk: 4600, jumlah_kk: 1122, luas_km2: 2.9 },
  { id: 'wil-081', kecamatan: 'Karangkobar', desa_kelurahan: 'Pasuruhan', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-082', kecamatan: 'Karangkobar', desa_kelurahan: 'Paweden', jumlah_penduduk: 4400, jumlah_kk: 1073, luas_km2: 3.3 },
  { id: 'wil-083', kecamatan: 'Karangkobar', desa_kelurahan: 'Purwodadi', jumlah_penduduk: 5300, jumlah_kk: 1293, luas_km2: 2.6 },
  { id: 'wil-084', kecamatan: 'Karangkobar', desa_kelurahan: 'Sampang', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 3.9 },
  { id: 'wil-085', kecamatan: 'Karangkobar', desa_kelurahan: 'Slatri', jumlah_penduduk: 5700, jumlah_kk: 1390, luas_km2: 3.5 },
  { id: 'wil-086', kecamatan: 'Madukara', desa_kelurahan: 'Kenteng', jumlah_penduduk: 4800, jumlah_kk: 1171, luas_km2: 2.4 },
  { id: 'wil-087', kecamatan: 'Madukara', desa_kelurahan: 'Rejasa', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.8 },
  { id: 'wil-088', kecamatan: 'Madukara', desa_kelurahan: 'Bantarwaru', jumlah_penduduk: 4200, jumlah_kk: 1024, luas_km2: 3.6 },
  { id: 'wil-089', kecamatan: 'Madukara', desa_kelurahan: 'Blitar', jumlah_penduduk: 5000, jumlah_kk: 1220, luas_km2: 2.1 },
  { id: 'wil-090', kecamatan: 'Madukara', desa_kelurahan: 'Clapar', jumlah_penduduk: 2800, jumlah_kk: 720, luas_km2: 2.4 },
  { id: 'wil-091', kecamatan: 'Madukara', desa_kelurahan: 'Dawuhan', jumlah_penduduk: 3400, jumlah_kk: 870, luas_km2: 3.5 },
  { id: 'wil-092', kecamatan: 'Madukara', desa_kelurahan: 'Gununggiana', jumlah_penduduk: 5100, jumlah_kk: 1244, luas_km2: 2.2 },
  { id: 'wil-093', kecamatan: 'Madukara', desa_kelurahan: 'Kaliurip', jumlah_penduduk: 4200, jumlah_kk: 1024, luas_km2: 3.6 },
  { id: 'wil-094', kecamatan: 'Madukara', desa_kelurahan: 'Karanganyar', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.9 },
  { id: 'wil-095', kecamatan: 'Madukara', desa_kelurahan: 'Kutayasa', jumlah_penduduk: 3200, jumlah_kk: 820, luas_km2: 2.7 },
  { id: 'wil-096', kecamatan: 'Madukara', desa_kelurahan: 'Limbangan', jumlah_penduduk: 5700, jumlah_kk: 1390, luas_km2: 3.4 },
  { id: 'wil-097', kecamatan: 'Madukara', desa_kelurahan: 'Madukara', jumlah_penduduk: 4900, jumlah_kk: 1260, luas_km2: 3.2 },
  { id: 'wil-098', kecamatan: 'Madukara', desa_kelurahan: 'Pagelak', jumlah_penduduk: 5400, jumlah_kk: 1317, luas_km2: 2.8 },
  { id: 'wil-099', kecamatan: 'Madukara', desa_kelurahan: 'Pakelen', jumlah_penduduk: 4400, jumlah_kk: 1073, luas_km2: 3.1 },
  { id: 'wil-100', kecamatan: 'Madukara', desa_kelurahan: 'Pekauman', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-101', kecamatan: 'Madukara', desa_kelurahan: 'Penawangan', jumlah_penduduk: 4500, jumlah_kk: 1098, luas_km2: 3 },
  { id: 'wil-102', kecamatan: 'Madukara', desa_kelurahan: 'Petambakan', jumlah_penduduk: 5500, jumlah_kk: 1341, luas_km2: 2.9 },
  { id: 'wil-103', kecamatan: 'Madukara', desa_kelurahan: 'Rakitan', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 4 },
  { id: 'wil-104', kecamatan: 'Madukara', desa_kelurahan: 'Sered', jumlah_penduduk: 5600, jumlah_kk: 1366, luas_km2: 3.2 },
  { id: 'wil-105', kecamatan: 'Madukara', desa_kelurahan: 'Talunamba', jumlah_penduduk: 4700, jumlah_kk: 1146, luas_km2: 2.6 },
  { id: 'wil-106', kecamatan: 'Mandiraja', desa_kelurahan: 'Banjengan', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 3.9 },
  { id: 'wil-107', kecamatan: 'Mandiraja', desa_kelurahan: 'Blimbing', jumlah_penduduk: 2800, jumlah_kk: 720, luas_km2: 1.8 },
  { id: 'wil-108', kecamatan: 'Mandiraja', desa_kelurahan: 'Candiwulan', jumlah_penduduk: 3200, jumlah_kk: 820, luas_km2: 2.2 },
  { id: 'wil-109', kecamatan: 'Mandiraja', desa_kelurahan: 'Glempang', jumlah_penduduk: 4300, jumlah_kk: 1100, luas_km2: 2.7 },
  { id: 'wil-110', kecamatan: 'Mandiraja', desa_kelurahan: 'Jalatunda', jumlah_penduduk: 3100, jumlah_kk: 800, luas_km2: 3.4 },
  { id: 'wil-111', kecamatan: 'Mandiraja', desa_kelurahan: 'Kaliwungu', jumlah_penduduk: 3900, jumlah_kk: 1000, luas_km2: 2.5 },
  { id: 'wil-112', kecamatan: 'Mandiraja', desa_kelurahan: 'Kebakalan', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.7 },
  { id: 'wil-113', kecamatan: 'Mandiraja', desa_kelurahan: 'Kebanaran', jumlah_penduduk: 5200, jumlah_kk: 1340, luas_km2: 4.2 },
  { id: 'wil-114', kecamatan: 'Mandiraja', desa_kelurahan: 'Kertayasa', jumlah_penduduk: 3600, jumlah_kk: 920, luas_km2: 2.1 },
  { id: 'wil-115', kecamatan: 'Mandiraja', desa_kelurahan: 'Mandirajakulon', jumlah_penduduk: 5800, jumlah_kk: 1415, luas_km2: 3.6 },
  { id: 'wil-116', kecamatan: 'Mandiraja', desa_kelurahan: 'Mandirajawetan', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.9 },
  { id: 'wil-117', kecamatan: 'Mandiraja', desa_kelurahan: 'Panggisari', jumlah_penduduk: 4100, jumlah_kk: 1050, luas_km2: 2.3 },
  { id: 'wil-118', kecamatan: 'Mandiraja', desa_kelurahan: 'Purwasaba', jumlah_penduduk: 3700, jumlah_kk: 950, luas_km2: 3 },
  { id: 'wil-119', kecamatan: 'Mandiraja', desa_kelurahan: 'Salamerta', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-120', kecamatan: 'Mandiraja', desa_kelurahan: 'Simbang', jumlah_penduduk: 2900, jumlah_kk: 740, luas_km2: 1.6 },
  { id: 'wil-121', kecamatan: 'Mandiraja', desa_kelurahan: 'Somawangi', jumlah_penduduk: 4900, jumlah_kk: 1260, luas_km2: 3.8 },
  { id: 'wil-122', kecamatan: 'Pagedongan', desa_kelurahan: 'Duren', jumlah_penduduk: 3200, jumlah_kk: 820, luas_km2: 3.9 },
  { id: 'wil-123', kecamatan: 'Pagedongan', desa_kelurahan: 'Gentansari', jumlah_penduduk: 5500, jumlah_kk: 1341, luas_km2: 3 },
  { id: 'wil-124', kecamatan: 'Pagedongan', desa_kelurahan: 'Gunungjati', jumlah_penduduk: 4500, jumlah_kk: 1098, luas_km2: 2.9 },
  { id: 'wil-125', kecamatan: 'Pagedongan', desa_kelurahan: 'Kebutuhduwur', jumlah_penduduk: 3800, jumlah_kk: 970, luas_km2: 5.1 },
  { id: 'wil-126', kecamatan: 'Pagedongan', desa_kelurahan: 'Kebutuhjurang', jumlah_penduduk: 3400, jumlah_kk: 870, luas_km2: 4.6 },
  { id: 'wil-127', kecamatan: 'Pagedongan', desa_kelurahan: 'Lebakwangi', jumlah_penduduk: 5300, jumlah_kk: 1293, luas_km2: 2.7 },
  { id: 'wil-128', kecamatan: 'Pagedongan', desa_kelurahan: 'Pagedongan', jumlah_penduduk: 4500, jumlah_kk: 1150, luas_km2: 4.8 },
  { id: 'wil-129', kecamatan: 'Pagedongan', desa_kelurahan: 'Pesangkalan', jumlah_penduduk: 5700, jumlah_kk: 1390, luas_km2: 3.4 },
  { id: 'wil-130', kecamatan: 'Pagedongan', desa_kelurahan: 'Twelagiri', jumlah_penduduk: 4800, jumlah_kk: 1171, luas_km2: 2.4 },
  { id: 'wil-131', kecamatan: 'Pagentan', desa_kelurahan: 'Aribaya', jumlah_penduduk: 2900, jumlah_kk: 740, luas_km2: 2.9 },
  { id: 'wil-132', kecamatan: 'Pagentan', desa_kelurahan: 'Babadan', jumlah_penduduk: 3300, jumlah_kk: 850, luas_km2: 3.1 },
  { id: 'wil-133', kecamatan: 'Pagentan', desa_kelurahan: 'Gumingsir', jumlah_penduduk: 5100, jumlah_kk: 1244, luas_km2: 2.1 },
  { id: 'wil-134', kecamatan: 'Pagentan', desa_kelurahan: 'Kalitlaga', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.7 },
  { id: 'wil-135', kecamatan: 'Pagentan', desa_kelurahan: 'Karangnangka', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.8 },
  { id: 'wil-136', kecamatan: 'Pagentan', desa_kelurahan: 'Karekan', jumlah_penduduk: 5100, jumlah_kk: 1244, luas_km2: 2.2 },
  { id: 'wil-137', kecamatan: 'Pagentan', desa_kelurahan: 'Kasmaran', jumlah_penduduk: 4200, jumlah_kk: 1024, luas_km2: 3.6 },
  { id: 'wil-138', kecamatan: 'Pagentan', desa_kelurahan: 'Kayuares', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.9 },
  { id: 'wil-139', kecamatan: 'Pagentan', desa_kelurahan: 'Larangan', jumlah_penduduk: 4800, jumlah_kk: 1171, luas_km2: 2.5 },
  { id: 'wil-140', kecamatan: 'Pagentan', desa_kelurahan: 'Majasari', jumlah_penduduk: 5700, jumlah_kk: 1390, luas_km2: 3.4 },
  { id: 'wil-141', kecamatan: 'Pagentan', desa_kelurahan: 'Metawana', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 4 },
  { id: 'wil-142', kecamatan: 'Pagentan', desa_kelurahan: 'Nagasari', jumlah_penduduk: 5400, jumlah_kk: 1317, luas_km2: 2.7 },
  { id: 'wil-143', kecamatan: 'Pagentan', desa_kelurahan: 'Pagentan', jumlah_penduduk: 4200, jumlah_kk: 1080, luas_km2: 3.5 },
  { id: 'wil-144', kecamatan: 'Pagentan', desa_kelurahan: 'Plumbungan', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-145', kecamatan: 'Pagentan', desa_kelurahan: 'Sokaraja', jumlah_penduduk: 4500, jumlah_kk: 1098, luas_km2: 3 },
  { id: 'wil-146', kecamatan: 'Pagentan', desa_kelurahan: 'Tegaljeruk', jumlah_penduduk: 5500, jumlah_kk: 1341, luas_km2: 2.9 },
  { id: 'wil-147', kecamatan: 'Pandanarum', desa_kelurahan: 'Beji', jumlah_penduduk: 2400, jumlah_kk: 610, luas_km2: 3.2 },
  { id: 'wil-148', kecamatan: 'Pandanarum', desa_kelurahan: 'Lawen', jumlah_penduduk: 2800, jumlah_kk: 720, luas_km2: 3.8 },
  { id: 'wil-149', kecamatan: 'Pandanarum', desa_kelurahan: 'Pandanarum', jumlah_penduduk: 3900, jumlah_kk: 1000, luas_km2: 4.5 },
  { id: 'wil-150', kecamatan: 'Pandanarum', desa_kelurahan: 'Pasegeran', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 3.9 },
  { id: 'wil-151', kecamatan: 'Pandanarum', desa_kelurahan: 'Pingit Lor', jumlah_penduduk: 4300, jumlah_kk: 1049, luas_km2: 3.4 },
  { id: 'wil-152', kecamatan: 'Pandanarum', desa_kelurahan: 'Pringamba', jumlah_penduduk: 5200, jumlah_kk: 1268, luas_km2: 2.4 },
  { id: 'wil-153', kecamatan: 'Pandanarum', desa_kelurahan: 'Sinduaji', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.9 },
  { id: 'wil-154', kecamatan: 'Pandanarum', desa_kelurahan: 'Sirongge', jumlah_penduduk: 5800, jumlah_kk: 1415, luas_km2: 3.6 },
  { id: 'wil-155', kecamatan: 'Pejawaran', desa_kelurahan: 'Beji', jumlah_penduduk: 3100, jumlah_kk: 800, luas_km2: 3.1 },
  { id: 'wil-156', kecamatan: 'Pejawaran', desa_kelurahan: 'Biting', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.7 },
  { id: 'wil-157', kecamatan: 'Pejawaran', desa_kelurahan: 'Condong Campur', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.8 },
  { id: 'wil-158', kecamatan: 'Pejawaran', desa_kelurahan: 'Darmayasa', jumlah_penduduk: 4900, jumlah_kk: 1195, luas_km2: 2.2 },
  { id: 'wil-159', kecamatan: 'Pejawaran', desa_kelurahan: 'Gembol', jumlah_penduduk: 5800, jumlah_kk: 1415, luas_km2: 3.6 },
  { id: 'wil-160', kecamatan: 'Pejawaran', desa_kelurahan: 'Giritirta', jumlah_penduduk: 3400, jumlah_kk: 870, luas_km2: 3.5 },
  { id: 'wil-161', kecamatan: 'Pejawaran', desa_kelurahan: 'Grogol', jumlah_penduduk: 5200, jumlah_kk: 1268, luas_km2: 2.4 },
  { id: 'wil-162', kecamatan: 'Pejawaran', desa_kelurahan: 'Kalilunjar', jumlah_penduduk: 4300, jumlah_kk: 1049, luas_km2: 3.4 },
  { id: 'wil-163', kecamatan: 'Pejawaran', desa_kelurahan: 'Karangsari', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-164', kecamatan: 'Pejawaran', desa_kelurahan: 'Panusupan', jumlah_penduduk: 4600, jumlah_kk: 1122, luas_km2: 2.7 },
  { id: 'wil-165', kecamatan: 'Pejawaran', desa_kelurahan: 'Pegundungan', jumlah_penduduk: 5600, jumlah_kk: 1366, luas_km2: 3.2 },
  { id: 'wil-166', kecamatan: 'Pejawaran', desa_kelurahan: 'Pejawaran', jumlah_penduduk: 4800, jumlah_kk: 1230, luas_km2: 3.9 },
  { id: 'wil-167', kecamatan: 'Pejawaran', desa_kelurahan: 'Ratamba', jumlah_penduduk: 5500, jumlah_kk: 1341, luas_km2: 3 },
  { id: 'wil-168', kecamatan: 'Pejawaran', desa_kelurahan: 'Sarwodadi', jumlah_penduduk: 4500, jumlah_kk: 1098, luas_km2: 3 },
  { id: 'wil-169', kecamatan: 'Pejawaran', desa_kelurahan: 'Semangkung', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-170', kecamatan: 'Pejawaran', desa_kelurahan: 'Sidengok', jumlah_penduduk: 4400, jumlah_kk: 1073, luas_km2: 3.2 },
  { id: 'wil-171', kecamatan: 'Pejawaran', desa_kelurahan: 'Tlahap', jumlah_penduduk: 5300, jumlah_kk: 1293, luas_km2: 2.7 },
  { id: 'wil-172', kecamatan: 'Punggelan', desa_kelurahan: 'Badakarya', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 4 },
  { id: 'wil-173', kecamatan: 'Punggelan', desa_kelurahan: 'Bondolharjo', jumlah_penduduk: 3800, jumlah_kk: 970, luas_km2: 3.8 },
  { id: 'wil-174', kecamatan: 'Punggelan', desa_kelurahan: 'Danakerta', jumlah_penduduk: 4800, jumlah_kk: 1171, luas_km2: 2.4 },
  { id: 'wil-175', kecamatan: 'Punggelan', desa_kelurahan: 'Jembangan', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.9 },
  { id: 'wil-176', kecamatan: 'Punggelan', desa_kelurahan: 'Karangsari', jumlah_penduduk: 4200, jumlah_kk: 1024, luas_km2: 3.6 },
  { id: 'wil-177', kecamatan: 'Punggelan', desa_kelurahan: 'Kecepit', jumlah_penduduk: 5100, jumlah_kk: 1244, luas_km2: 2.1 },
  { id: 'wil-178', kecamatan: 'Punggelan', desa_kelurahan: 'Klapa', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.8 },
  { id: 'wil-179', kecamatan: 'Punggelan', desa_kelurahan: 'Mlaya', jumlah_penduduk: 2900, jumlah_kk: 740, luas_km2: 4.1 },
  { id: 'wil-180', kecamatan: 'Punggelan', desa_kelurahan: 'Petuguran', jumlah_penduduk: 5100, jumlah_kk: 1244, luas_km2: 2.1 },
  { id: 'wil-181', kecamatan: 'Punggelan', desa_kelurahan: 'Punggelan', jumlah_penduduk: 5200, jumlah_kk: 1330, luas_km2: 4.5 },
  { id: 'wil-182', kecamatan: 'Punggelan', desa_kelurahan: 'Purwasana', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.9 },
  { id: 'wil-183', kecamatan: 'Punggelan', desa_kelurahan: 'Sambong', jumlah_penduduk: 4800, jumlah_kk: 1171, luas_km2: 2.4 },
  { id: 'wil-184', kecamatan: 'Punggelan', desa_kelurahan: 'Sawangan', jumlah_penduduk: 5700, jumlah_kk: 1390, luas_km2: 3.4 },
  { id: 'wil-185', kecamatan: 'Punggelan', desa_kelurahan: 'Sidarata', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 4 },
  { id: 'wil-186', kecamatan: 'Punggelan', desa_kelurahan: 'Tanjungtirta', jumlah_penduduk: 5300, jumlah_kk: 1293, luas_km2: 2.7 },
  { id: 'wil-187', kecamatan: 'Punggelan', desa_kelurahan: 'Tlaga', jumlah_penduduk: 4400, jumlah_kk: 1073, luas_km2: 3.2 },
  { id: 'wil-188', kecamatan: 'Punggelan', desa_kelurahan: 'Tribuana', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-189', kecamatan: 'Purwanegara', desa_kelurahan: 'Danaraja', jumlah_penduduk: 4500, jumlah_kk: 1098, luas_km2: 3 },
  { id: 'wil-190', kecamatan: 'Purwanegara', desa_kelurahan: 'Gumiwang', jumlah_penduduk: 5500, jumlah_kk: 1341, luas_km2: 3 },
  { id: 'wil-191', kecamatan: 'Purwanegara', desa_kelurahan: 'Kaliajir', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 4 },
  { id: 'wil-192', kecamatan: 'Purwanegara', desa_kelurahan: 'Kalipelus', jumlah_penduduk: 5600, jumlah_kk: 1366, luas_km2: 3.2 },
  { id: 'wil-193', kecamatan: 'Purwanegara', desa_kelurahan: 'Kalitengah', jumlah_penduduk: 4600, jumlah_kk: 1122, luas_km2: 2.7 },
  { id: 'wil-194', kecamatan: 'Purwanegara', desa_kelurahan: 'Karanganyar', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-195', kecamatan: 'Purwanegara', desa_kelurahan: 'Kutawuluh', jumlah_penduduk: 4300, jumlah_kk: 1049, luas_km2: 3.4 },
  { id: 'wil-196', kecamatan: 'Purwanegara', desa_kelurahan: 'Merden', jumlah_penduduk: 5200, jumlah_kk: 1268, luas_km2: 2.4 },
  { id: 'wil-197', kecamatan: 'Purwanegara', desa_kelurahan: 'Mertasari', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.9 },
  { id: 'wil-198', kecamatan: 'Purwanegara', desa_kelurahan: 'Parakan', jumlah_penduduk: 5800, jumlah_kk: 1415, luas_km2: 3.6 },
  { id: 'wil-199', kecamatan: 'Purwanegara', desa_kelurahan: 'Petir', jumlah_penduduk: 4900, jumlah_kk: 1195, luas_km2: 2.2 },
  { id: 'wil-200', kecamatan: 'Purwanegara', desa_kelurahan: 'Pucungbedug', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.8 },
  { id: 'wil-201', kecamatan: 'Purwanegara', desa_kelurahan: 'Purwonegoro', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.7 },
  { id: 'wil-202', kecamatan: 'Purwareja Klampok', desa_kelurahan: 'Kalilandak', jumlah_penduduk: 4900, jumlah_kk: 1260, luas_km2: 2.8 },
  { id: 'wil-203', kecamatan: 'Purwareja Klampok', desa_kelurahan: 'Kalimandi', jumlah_penduduk: 3800, jumlah_kk: 970, luas_km2: 1.9 },
  { id: 'wil-204', kecamatan: 'Purwareja Klampok', desa_kelurahan: 'Kaliwinasuh', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.9 },
  { id: 'wil-205', kecamatan: 'Purwareja Klampok', desa_kelurahan: 'Kecitran', jumlah_penduduk: 5800, jumlah_kk: 1490, luas_km2: 2.5 },
  { id: 'wil-206', kecamatan: 'Purwareja Klampok', desa_kelurahan: 'Klampok', jumlah_penduduk: 8200, jumlah_kk: 2100, luas_km2: 3.4 },
  { id: 'wil-207', kecamatan: 'Purwareja Klampok', desa_kelurahan: 'Pagak', jumlah_penduduk: 4200, jumlah_kk: 1080, luas_km2: 2.2 },
  { id: 'wil-208', kecamatan: 'Purwareja Klampok', desa_kelurahan: 'Purworejo', jumlah_penduduk: 4700, jumlah_kk: 1146, luas_km2: 2.7 },
  { id: 'wil-209', kecamatan: 'Purwareja Klampok', desa_kelurahan: 'Sirkandi', jumlah_penduduk: 5500, jumlah_kk: 1410, luas_km2: 3.2 },
  { id: 'wil-210', kecamatan: 'Rakit', desa_kelurahan: 'Adipasir', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 4 },
  { id: 'wil-211', kecamatan: 'Rakit', desa_kelurahan: 'Badamita', jumlah_penduduk: 3800, jumlah_kk: 970, luas_km2: 3.2 },
  { id: 'wil-212', kecamatan: 'Rakit', desa_kelurahan: 'Bandingan', jumlah_penduduk: 4500, jumlah_kk: 1098, luas_km2: 3 },
  { id: 'wil-213', kecamatan: 'Rakit', desa_kelurahan: 'Gelang', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-214', kecamatan: 'Rakit', desa_kelurahan: 'Kincang', jumlah_penduduk: 4400, jumlah_kk: 1073, luas_km2: 3.2 },
  { id: 'wil-215', kecamatan: 'Rakit', desa_kelurahan: 'Lengkong', jumlah_penduduk: 5400, jumlah_kk: 1317, luas_km2: 2.7 },
  { id: 'wil-216', kecamatan: 'Rakit', desa_kelurahan: 'Luwung', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 4 },
  { id: 'wil-217', kecamatan: 'Rakit', desa_kelurahan: 'Pingit', jumlah_penduduk: 5700, jumlah_kk: 1390, luas_km2: 3.4 },
  { id: 'wil-218', kecamatan: 'Rakit', desa_kelurahan: 'Rakit', jumlah_penduduk: 5500, jumlah_kk: 1410, luas_km2: 3.4 },
  { id: 'wil-219', kecamatan: 'Rakit', desa_kelurahan: 'Situwangi', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.9 },
  { id: 'wil-220', kecamatan: 'Rakit', desa_kelurahan: 'Tanjunganom', jumlah_penduduk: 4200, jumlah_kk: 1024, luas_km2: 3.6 },
  { id: 'wil-221', kecamatan: 'Sigaluh', desa_kelurahan: 'Kalibenda', jumlah_penduduk: 3000, jumlah_kk: 770, luas_km2: 2 },
  { id: 'wil-222', kecamatan: 'Sigaluh', desa_kelurahan: 'Bandingan', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.8 },
  { id: 'wil-223', kecamatan: 'Sigaluh', desa_kelurahan: 'Bojanegara', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.7 },
  { id: 'wil-224', kecamatan: 'Sigaluh', desa_kelurahan: 'Gembongan', jumlah_penduduk: 5100, jumlah_kk: 1244, luas_km2: 2.1 },
  { id: 'wil-225', kecamatan: 'Sigaluh', desa_kelurahan: 'Karangmangu', jumlah_penduduk: 3100, jumlah_kk: 800, luas_km2: 2.3 },
  { id: 'wil-226', kecamatan: 'Sigaluh', desa_kelurahan: 'Kemiri', jumlah_penduduk: 3500, jumlah_kk: 900, luas_km2: 2.4 },
  { id: 'wil-227', kecamatan: 'Sigaluh', desa_kelurahan: 'Panawaren', jumlah_penduduk: 4800, jumlah_kk: 1171, luas_km2: 2.4 },
  { id: 'wil-228', kecamatan: 'Sigaluh', desa_kelurahan: 'Prigi', jumlah_penduduk: 3200, jumlah_kk: 820, luas_km2: 2.1 },
  { id: 'wil-229', kecamatan: 'Sigaluh', desa_kelurahan: 'Pringamba', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 3.9 },
  { id: 'wil-230', kecamatan: 'Sigaluh', desa_kelurahan: 'Randegan', jumlah_penduduk: 2900, jumlah_kk: 740, luas_km2: 1.8 },
  { id: 'wil-231', kecamatan: 'Sigaluh', desa_kelurahan: 'Sawal', jumlah_penduduk: 2800, jumlah_kk: 720, luas_km2: 1.9 },
  { id: 'wil-232', kecamatan: 'Sigaluh', desa_kelurahan: 'Sigaluh', jumlah_penduduk: 4800, jumlah_kk: 1230, luas_km2: 3.2 },
  { id: 'wil-233', kecamatan: 'Sigaluh', desa_kelurahan: 'Singomerto', jumlah_penduduk: 3400, jumlah_kk: 870, luas_km2: 2.5 },
  { id: 'wil-234', kecamatan: 'Sigaluh', desa_kelurahan: 'Tunggara', jumlah_penduduk: 5500, jumlah_kk: 1341, luas_km2: 3 },
  { id: 'wil-235', kecamatan: 'Sigaluh', desa_kelurahan: 'Wanacipta', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 4 },
  { id: 'wil-236', kecamatan: 'Susukan', desa_kelurahan: 'Berta', jumlah_penduduk: 5600, jumlah_kk: 1366, luas_km2: 3.2 },
  { id: 'wil-237', kecamatan: 'Susukan', desa_kelurahan: 'Brengkok', jumlah_penduduk: 3400, jumlah_kk: 870, luas_km2: 2.9 },
  { id: 'wil-238', kecamatan: 'Susukan', desa_kelurahan: 'Derik', jumlah_penduduk: 4000, jumlah_kk: 976, luas_km2: 4 },
  { id: 'wil-239', kecamatan: 'Susukan', desa_kelurahan: 'Dermasari', jumlah_penduduk: 4300, jumlah_kk: 1049, luas_km2: 3.4 },
  { id: 'wil-240', kecamatan: 'Susukan', desa_kelurahan: 'Gumelem Kulon', jumlah_penduduk: 5200, jumlah_kk: 1268, luas_km2: 2.5 },
  { id: 'wil-241', kecamatan: 'Susukan', desa_kelurahan: 'Gumelem Wetan', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.9 },
  { id: 'wil-242', kecamatan: 'Susukan', desa_kelurahan: 'Karangjati', jumlah_penduduk: 5800, jumlah_kk: 1415, luas_km2: 3.6 },
  { id: 'wil-243', kecamatan: 'Susukan', desa_kelurahan: 'Karangsalam', jumlah_penduduk: 4900, jumlah_kk: 1195, luas_km2: 2.2 },
  { id: 'wil-244', kecamatan: 'Susukan', desa_kelurahan: 'Kedawung', jumlah_penduduk: 2900, jumlah_kk: 740, luas_km2: 2.5 },
  { id: 'wil-245', kecamatan: 'Susukan', desa_kelurahan: 'Kemranggon', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.7 },
  { id: 'wil-246', kecamatan: 'Susukan', desa_kelurahan: 'Pakikiran', jumlah_penduduk: 5000, jumlah_kk: 1220, luas_km2: 2.1 },
  { id: 'wil-247', kecamatan: 'Susukan', desa_kelurahan: 'Panerusan Kulon', jumlah_penduduk: 5800, jumlah_kk: 1415, luas_km2: 3.6 },
  { id: 'wil-248', kecamatan: 'Susukan', desa_kelurahan: 'Panerusan Wetan', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.9 },
  { id: 'wil-249', kecamatan: 'Susukan', desa_kelurahan: 'Piasa Wetan', jumlah_penduduk: 5200, jumlah_kk: 1268, luas_km2: 2.4 },
  { id: 'wil-250', kecamatan: 'Susukan', desa_kelurahan: 'Susukan', jumlah_penduduk: 5100, jumlah_kk: 1310, luas_km2: 3.6 },
  { id: 'wil-251', kecamatan: 'Wanadadi', desa_kelurahan: 'Gumingsir', jumlah_penduduk: 2700, jumlah_kk: 690, luas_km2: 1.4 },
  { id: 'wil-252', kecamatan: 'Wanadadi', desa_kelurahan: 'Kandangwangi', jumlah_penduduk: 3300, jumlah_kk: 850, luas_km2: 2 },
  { id: 'wil-253', kecamatan: 'Wanadadi', desa_kelurahan: 'Karangjambe', jumlah_penduduk: 3800, jumlah_kk: 970, luas_km2: 2.1 },
  { id: 'wil-254', kecamatan: 'Wanadadi', desa_kelurahan: 'Karangkemiri', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 4 },
  { id: 'wil-255', kecamatan: 'Wanadadi', desa_kelurahan: 'Kasalib', jumlah_penduduk: 5500, jumlah_kk: 1341, luas_km2: 2.9 },
  { id: 'wil-256', kecamatan: 'Wanadadi', desa_kelurahan: 'Lemahjaya', jumlah_penduduk: 4500, jumlah_kk: 1098, luas_km2: 3 },
  { id: 'wil-257', kecamatan: 'Wanadadi', desa_kelurahan: 'Linggasari', jumlah_penduduk: 3500, jumlah_kk: 900, luas_km2: 2.3 },
  { id: 'wil-258', kecamatan: 'Wanadadi', desa_kelurahan: 'Medayu', jumlah_penduduk: 2900, jumlah_kk: 740, luas_km2: 1.8 },
  { id: 'wil-259', kecamatan: 'Wanadadi', desa_kelurahan: 'Tapen', jumlah_penduduk: 4900, jumlah_kk: 1260, luas_km2: 2.2 },
  { id: 'wil-260', kecamatan: 'Wanadadi', desa_kelurahan: 'Wanadadi', jumlah_penduduk: 5800, jumlah_kk: 1490, luas_km2: 2.5 },
  { id: 'wil-261', kecamatan: 'Wanadadi', desa_kelurahan: 'Wanakarsa', jumlah_penduduk: 4200, jumlah_kk: 1080, luas_km2: 1.9 },
  { id: 'wil-262', kecamatan: 'Wanayasa', desa_kelurahan: 'Balun', jumlah_penduduk: 3200, jumlah_kk: 820, luas_km2: 3.5 },
  { id: 'wil-263', kecamatan: 'Wanayasa', desa_kelurahan: 'Bantar', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.9 },
  { id: 'wil-264', kecamatan: 'Wanayasa', desa_kelurahan: 'Dawuhan', jumlah_penduduk: 4200, jumlah_kk: 1024, luas_km2: 3.6 },
  { id: 'wil-265', kecamatan: 'Wanayasa', desa_kelurahan: 'Jatilawang', jumlah_penduduk: 5100, jumlah_kk: 1244, luas_km2: 2.2 },
  { id: 'wil-266', kecamatan: 'Wanayasa', desa_kelurahan: 'Karangtengah', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.8 },
  { id: 'wil-267', kecamatan: 'Wanayasa', desa_kelurahan: 'Kasimpar', jumlah_penduduk: 5900, jumlah_kk: 1439, luas_km2: 3.7 },
  { id: 'wil-268', kecamatan: 'Wanayasa', desa_kelurahan: 'Kubang', jumlah_penduduk: 5000, jumlah_kk: 1220, luas_km2: 2.1 },
  { id: 'wil-269', kecamatan: 'Wanayasa', desa_kelurahan: 'Legoksayem', jumlah_penduduk: 4200, jumlah_kk: 1024, luas_km2: 3.6 },
  { id: 'wil-270', kecamatan: 'Wanayasa', desa_kelurahan: 'Pagergunung', jumlah_penduduk: 4100, jumlah_kk: 1000, luas_km2: 3.8 },
  { id: 'wil-271', kecamatan: 'Wanayasa', desa_kelurahan: 'Pandansari', jumlah_penduduk: 4800, jumlah_kk: 1171, luas_km2: 2.4 },
  { id: 'wil-272', kecamatan: 'Wanayasa', desa_kelurahan: 'Penanggungan', jumlah_penduduk: 5700, jumlah_kk: 1390, luas_km2: 3.5 },
  { id: 'wil-273', kecamatan: 'Wanayasa', desa_kelurahan: 'Kalideres', jumlah_penduduk: 6000, jumlah_kk: 1463, luas_km2: 3.9 },
  { id: 'wil-274', kecamatan: 'Wanayasa', desa_kelurahan: 'Susukan', jumlah_penduduk: 5300, jumlah_kk: 1293, luas_km2: 2.6 },
  { id: 'wil-275', kecamatan: 'Wanayasa', desa_kelurahan: 'Suwidak', jumlah_penduduk: 4400, jumlah_kk: 1073, luas_km2: 3.3 },
  { id: 'wil-276', kecamatan: 'Wanayasa', desa_kelurahan: 'Tempuran', jumlah_penduduk: 2900, jumlah_kk: 740, luas_km2: 2.9 },
  { id: 'wil-277', kecamatan: 'Wanayasa', desa_kelurahan: 'Wanaraja', jumlah_penduduk: 4600, jumlah_kk: 1122, luas_km2: 2.9 },
  { id: 'wil-278', kecamatan: 'Wanayasa', desa_kelurahan: 'Wanayasa', jumlah_penduduk: 4800, jumlah_kk: 1230, luas_km2: 4.1 }
];

const LOCATIONS_DATA = [
  { id: 'loc-01', name: 'TPS3R Banjarnegara', type: 'tps3r', lat: -7.3891, lng: 109.6952, address: 'Jl. Selamanik No. 10, Banjarnegara', wilayah: 'Banjarnegara', desa_id: 'wil-055', served_desa_ids: ['wil-055'] },
  { id: 'loc-02', name: 'TPS3R Purwareja', type: 'tps3r', lat: -7.4123, lng: 109.631, address: 'Jl. Raya Purwareja, Purwareja Klampok', wilayah: 'Purwareja Klampok', desa_id: 'wil-208', served_desa_ids: ['wil-208'] },
  { id: 'loc-03', name: 'TPS Mandiraja', type: 'tps', lat: -7.4502, lng: 109.6218, address: 'Jl. Raya Mandiraja', wilayah: 'Mandiraja', desa_id: 'wil-116', served_desa_ids: ['wil-116'] },
  { id: 'loc-04', name: 'Bank Sampah Berseri', type: 'bank_sampah', lat: -7.3935, lng: 109.6988, address: 'Jl. Letjend S. Parman No. 45, Banjarnegara', wilayah: 'Banjarnegara', desa_id: 'wil-020', served_desa_ids: ['wil-020'] },
  { id: 'loc-05', name: 'Bank Sampah Mawar', type: 'bank_sampah', lat: -7.378, lng: 109.7051, address: 'Jl. Pemuda No. 22, Banjarnegara', wilayah: 'Banjarnegara', desa_id: 'wil-023', served_desa_ids: ['wil-023'] },
  { id: 'loc-06', name: 'Bank Sampah Cempaka', type: 'bank_sampah', lat: -7.425, lng: 109.685, address: 'Jl. Raya Sigaluh No. 5', wilayah: 'Sigaluh', desa_id: 'wil-232', served_desa_ids: ['wil-232'] },
  { id: 'loc-07', name: 'Pengepul Jaya Abadi', type: 'pengepul', lat: -7.3998, lng: 109.7102, address: 'Jl. Salak No. 8, Banjarnegara', wilayah: 'Banjarnegara', desa_id: 'wil-022', served_desa_ids: ['wil-022'] },
  { id: 'loc-08', name: 'Pengepul Berkah', type: 'pengepul', lat: -7.435, lng: 109.645, address: 'Jl. Raya Bawang No. 12', wilayah: 'Bawang', desa_id: 'wil-040', served_desa_ids: ['wil-040'] },
  { id: 'loc-09', name: 'TPA Winong', type: 'tpa', lat: -7.372, lng: 109.678, address: 'Desa Winong, Kec. Banjarnegara', wilayah: 'Banjarnegara', desa_id: 'wil-055', served_desa_ids: ['wil-055'] },
  { id: 'loc-10', name: 'TPS3R Wanadadi', type: 'tps3r', lat: -7.3555, lng: 109.741, address: 'Jl. Raya Wanadadi No. 3', wilayah: 'Wanadadi', desa_id: 'wil-260', served_desa_ids: ['wil-260'] }
];

const USERS_DATA = [
  { id: 'usr-01', username: 'warga1', password: 'warga123', name: 'Warga Banjarnegara', role: 'warga', phone: '081234567890' },
  { id: 'usr-02', username: 'petugas1', password: 'petugas123', name: 'Petugas Pengangkut', role: 'petugas', job_type: 'angkut', location_id: 'loc-01', phone: '081234567891' },
  { id: 'usr-03', username: 'eksekutif1', password: 'eksekutif123', name: 'Bupati Banjarnegara', role: 'eksekutif', phone: '081234567892' },
  { id: 'usr-04', username: 'admin1', password: 'admin123', name: 'Admin SIMPAH', role: 'admin', phone: '081234567893' },
  { id: 'usr-05', username: 'koordinator1', password: 'koordinator123', name: 'Koordinator Lapangan', role: 'petugas', job_type: 'koordinator', location_id: 'loc-01', phone: '081234567894' },
  { id: 'usr-06', username: 'operator1', password: 'operator123', name: 'Operator TPS3R', role: 'petugas', job_type: 'operator_tps', location_id: 'loc-01', phone: '081234567895' },
  { id: 'usr-07', username: 'kader1', password: 'kader123', name: 'Kader Lingkungan', role: 'petugas', job_type: 'kader', location_id: 'loc-01', desa_id: 'wil-005', phone: '081234567896' }
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

function generateWasteRecords(count = 180) {
  const records = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
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
      desa_id: location.desa_id || null,
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
      verification_status: 'approved',
      is_demo: true
    });
  }

  // Create explicit pending records for demo
  records.push({
    id: `wr-pend-01`,
    type: 'masuk', category_sipsn: 'PL', weight_kg: 50.5,
    lat: LOCATIONS_DATA[1].lat, lng: LOCATIONS_DATA[1].lng,
    location_id: LOCATIONS_DATA[1].id, location_name: LOCATIONS_DATA[1].name,
    desa_id: LOCATIONS_DATA[1].desa_id || null,
    user_id: USERS_DATA[0].id, user_name: USERS_DATA[0].name,
    fleet_id: null, fleet_plate: null, is_incidental: false,
    notes: 'Klaim plastik jumlah besar',
    created_at: now.toISOString(),
    date_str: now.toISOString().split('T')[0],
    synced: true,
    verification_status: 'pending',
    is_demo: true
  });
  
  records.push({
    id: `wr-pend-02`,
    type: 'residu', category_sipsn: 'LN', weight_kg: 120,
    lat: LOCATIONS_DATA[3].lat, lng: LOCATIONS_DATA[3].lng,
    location_id: LOCATIONS_DATA[3].id, location_name: LOCATIONS_DATA[3].name,
    desa_id: LOCATIONS_DATA[3].desa_id || null,
    user_id: USERS_DATA[1].id, user_name: USERS_DATA[1].name,
    fleet_id: null, fleet_plate: null, is_incidental: false,
    notes: 'Residu bulanan',
    created_at: now.toISOString(),
    date_str: now.toISOString().split('T')[0],
    synced: true,
    verification_status: 'pending',
    is_demo: true
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
      photo_url: null, status: 'baru', created_at: '2026-04-19T08:30:00.000Z',
      is_demo: true
    },
    {
      id: 'cmp-002', tracking_number: 'ADU-260402-5678',
      reporter_user_id: 'usr-01',
      reporter_name: 'Ibu Darmi', reporter_phone: '082199988877',
      is_anonymous: false,
      category: 'Pembuangan liar', description: 'Ada warga yang membuang sampah ke sungai di belakang perumahan Griya Asri.',
      lat: -7.4010, lng: 109.7020, address: 'Belakang Perumahan Griya Asri',
      photo_url: null, status: 'diproses', created_at: '2026-04-18T14:15:00.000Z',
      is_demo: true
    },
    {
      id: 'cmp-003', tracking_number: 'ADU-260403-9012',
      reporter_user_id: null,
      reporter_name: 'Pak Ahmad', reporter_phone: '085677788899',
      is_anonymous: true,
      category: 'Bau tidak sedap', description: 'Bau dari TPA Winong sangat menyengat ketika angin bertiup ke arah pemukiman.',
      lat: -7.3740, lng: 109.6800, address: 'Sekitar TPA Winong',
      photo_url: null, status: 'selesai', created_at: '2026-04-15T10:00:00.000Z',
      is_demo: true
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
      created_at: '2026-04-10T07:00:00.000Z',
      is_demo: true
    },
    {
      id: 'evt-002', type: 'edukasi', title: 'Sosialisasi Pilah Sampah',
      description: 'Sosialisasi pemilahan sampah di tingkat RT/RW bersama karang taruna',
      location_name: 'Balai Desa Parakancanggah', participants: 30,
      lat: -7.3950, lng: 109.6970,
      user_id: 'usr-04', user_name: 'Pemdes Mandiraja',
      created_at: '2026-04-05T09:00:00.000Z',
      is_demo: true
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
    // Only updates roles if they're using old role names (e.g., 'dinas', 'kader', 'pemdes', 'pengepul')
    const user1 = await db.get('users', 'usr-01');
    const validNewRoles = ['warga', 'petugas', 'eksekutif', 'admin'];
    if (user1 && !validNewRoles.includes(user1.role)) {
      const tx = db.transaction('users', 'readwrite');
      for (const user of USERS_DATA) {
        await tx.store.put(user);
      }
      await tx.done;
      console.log('[Seed] Migrated legacy accounts to 4-role system');
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
  const wasteRecords = generateWasteRecords(180);
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

  // Seed master_wilayah
  const tx8 = db.transaction('master_wilayah', 'readwrite');
  for (const w of WILAYAH_DATA) {
    await tx8.store.put(w);
  }
  await tx8.done;

  console.log('Database seeded successfully!');
  return true;
}
