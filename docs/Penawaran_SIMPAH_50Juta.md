# DOKUMEN PENAWARAN PENGEMBANGAN SISTEM
**Sistem Informasi Monitoring Pengelolaan Sampah (SIMPAH) Terintegrasi**

**Tanggal:** 23 April 2026
**Ditujukan Kepada:** Kepala Dinas Perumahan, Kawasan Permukiman dan Lingkungan Hidup (DPPKPLH) Kabupaten Banjarnegara
**Dari:** Tim Pengembang SIMPAH Banjarnegara

---

## 1. PENDAHULUAN
Sejalan dengan program pemerintah dalam upaya digitalisasi layanan publik dan optimalisasi pengelolaan sampah daerah, kami mengajukan penawaran untuk pengembangan dan implementasi **Sistem Informasi Monitoring Pengelolaan Sampah (SIMPAH)**. 

Sistem ini dirancang untuk mendigitalisasi proses pencatatan tonase sampah, manajemen operasional Tempat Pembuangan Sementara (TPS), serta menyediakan dasbor eksekutif untuk pemantauan data secara *real-time* yang valid, transparan, dan dapat dipertanggungjawabkan (mendukung pelaporan SIPSN).

## 2. RUANG LINGKUP PEKERJAAN (SCOPE OF WORK)
Mengingat penyesuaian anggaran, pengembangan sistem pada tahap ini akan difokuskan pada pemenuhan kebutuhan dasar operasional *(Minimum Viable Product)*. Ruang lingkup pekerjaan dibatasi pada:

1. **Modul Aplikasi Petugas Lapangan (Web-Based):**
   - Form pencatatan sampah masuk (Tonase/Volume).
   - Form pencatatan sampah terolah & residu.
   - Hak akses login operator TPS.
2. **Modul Kader Lingkungan (Web-Based):**
   - Form pelaporan edukasi/sosialisasi kemasyarakatan dan pemantauan pemilahan sampah di sumber (RT/RW).
   - Hak akses login khusus untuk Kader Desa/Kelurahan.
3. **Modul Dasbor Eksekutif & Admin (Web-Based):**
   - Halaman rekapitulasi data tonase sampah bulanan/tahunan.
   - Manajemen *Master Data* (Data TPS, Data Petugas, Data Kader, Kategori Sampah).
   - Export laporan ke format Excel/PDF untuk kebutuhan pelaporan dinas.
4. **Infrastruktur & Keamanan Dasar:**
   - Database terpusat menggunakan PostgreSQL.
   - Sistem *Role-Based Access Control* (Admin Dinas, Operator Lapangan, dan Kader).

*(Catatan: Fitur Offline-First, Notifikasi Real-time, dan Integrasi AI belum termasuk dalam ruang lingkup fase ini).*

## 3. SPESIFIKASI TEKNIS & LISENSI
- **Platform:** Web Application (Responsive/Mobile-Friendly)
- **Backend & API:** Node.js / Python
- **Database:** PostgreSQL
- **Hosting:** Cloud VPS Lokal (Sesuai regulasi data pemerintah) - Disewa untuk masa aktif 1 (satu) tahun.
- **Model Kerjasama:** Sewa Layanan / Lisensi Penggunaan (*Software as a Service*). *Source code* utama tetap menjadi Hak Kekayaan Intelektual (HKI) pihak pengembang, sedangkan kepemilikan seluruh data yang diinput adalah mutlak milik DPPKPLH Kabupaten Banjarnegara.

## 4. RENCANA ANGGARAN BIAYA (RAB)
Berikut adalah rincian Rencana Anggaran Biaya untuk implementasi SIMPAH:

| No | Uraian Pekerjaan / Layanan | Volume | Harga Satuan (Rp) | Total Harga (Rp) |
|:---|:---|:---:|:---|:---|
| 1 | **Lisensi Penggunaan Sistem (1 Tahun)**<br>*(Termasuk instalasi modul Admin & Operator)* | 1 Paket | 20.000.000 | 20.000.000 |
| 2 | **Kustomisasi & Setup Database PostgreSQL**<br>*(Penyesuaian form laporan dengan standar Dinas)* | 1 Paket | 10.000.000 | 10.000.000 |
| 3 | **Sewa Server Cloud VPS & Domain (1 Tahun)** | 1 Paket | 6.000.000 | 6.000.000 |
| 4 | **Instalasi, Uji Coba, & Pembuatan Manual Book** | 1 Paket | 5.000.000 | 5.000.000 |
| 5 | **Pelatihan (Training) & Pendampingan 1 Bulan** | 1 Ls | 4.045.000 | 4.045.000 |
| | **SUB-TOTAL** | | | **45.045.000** |
| | **Pajak Pertambahan Nilai (PPN 11%)** | | | **4.955.000** |
| | **TOTAL ESTIMASI BIAYA** | | | **50.000.000** |

*Terbilang: Lima Puluh Juta Rupiah*

## 5. JADWAL PELAKSANAAN
Waktu penyelesaian pekerjaan diestimasikan selama **45 Hari Kerja** sejak Surat Perintah Kerja (SPK) / Kontrak ditandatangani.
- Minggu 1-2: Analisis & Penyesuaian Database
- Minggu 3-4: Penyiapan Infrastruktur Server & Kustomisasi Modul
- Minggu 5-6: Uji Coba (UAT), Serah Terima, dan Pelatihan

## 6. SYARAT & KETENTUAN (TERMS & CONDITIONS)
1. **Revisi:** Permintaan revisi tata letak (UI) atau penambahan kolom isian dibatasi maksimal 2 (dua) kali masa revisi selama proses Uji Coba (UAT).
2. **Penambahan Fitur:** Penambahan modul di luar poin *Ruang Lingkup Pekerjaan* (seperti Integrasi IoT, PWA Offline, atau API pihak ketiga) akan dikenakan biaya terpisah (*Add-on*).
3. **Perpanjangan Layanan:** Pada tahun kedua dan seterusnya, pihak Dinas hanya dikenakan biaya **Perpanjangan Sewa Server dan Pemeliharaan Sistem (Maintenance)** yang akan disepakati kemudian (diestimasi tidak lebih dari 30% dari nilai kontrak awal per tahun).

---

Demikian penawaran ini kami sampaikan. Kami sangat menantikan kesempatan untuk berdiskusi lebih lanjut dan berkontribusi dalam digitalisasi pengelolaan lingkungan hidup di Kabupaten Banjarnegara.

Hormat Kami,

*(Nama Anda / Perwakilan Tim)*
**Pengembang SIMPAH**
