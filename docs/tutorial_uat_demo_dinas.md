# 📋 Tutorial & UAT — Demonstrasi SIMPAH kepada Pihak Dinas

**Dokumen ini berisi panduan demonstrasi dan skenario User Acceptance Testing (UAT) untuk presentasi SIMPAH kepada pihak Dinas Lingkungan Hidup.**

---

## 🎯 Tujuan Demonstrasi

Memperlihatkan bahwa SIMPAH (Sistem Informasi Manajemen Pengelolaan Sampah) adalah platform digital terintegrasi yang mampu:
1. Mencatat dan memonitor data sampah secara real-time
2. Menampilkan analitik dan dashboard eksekutif
3. Memanfaatkan Machine Learning (Prophet) untuk **forecasting timbulan sampah**

---

## 🚀 Persiapan Sebelum Demo

### Checklist Teknis
- [ ] Pastikan laptop terhubung ke internet (diperlukan untuk sync Supabase)
- [ ] Buka terminal dan jalankan kedua server:

**Terminal 1 - Frontend PWA**
```bash
cd "u:\Project\simpah-rilis v1"
npm run dev
```

**Terminal 2 - ML Backend (Prophet)**
```bash
cd "u:\Project\simpah-rilis v1\ml-backend"
venv\Scripts\activate
uvicorn main:app --reload
```
- [ ] Pastikan kedua server berjalan: **http://localhost:3000** dan **http://localhost:8000**
- [ ] Siapkan browser Chrome/Edge dengan 2 tab:
  - Tab 1: `http://localhost:3000` (Aplikasi SIMPAH)
  - Tab 2: `http://localhost:8000/docs` (API ML Prophet - opsional untuk demo teknis)

### Akun Demo yang Disiapkan
| Role | Username | Password | Fungsi |
|---|---|---|---|
| **Admin / Eksekutif** | `eksekutif1` | `simpah123` | Melihat Dashboard & Forecasting |
| **Operator / Kader** | `kader1` | `simpah123` | Input data harian |
| **Koordinator** | `koordinator1` | `simpah123` | Validasi & Laporan |

---

## 📺 Skenario Demonstrasi (Step-by-Step)

### Sesi 1: Halaman Beranda & Login (5 menit)
**Langkah:**
1. Buka `http://localhost:3000`
2. Tunjukkan halaman landing SIMPAH yang profesional
3. Klik **"Masuk Sistem"** dan login sebagai `kader1`
4. Tunjukkan bahwa ini adalah **PWA (Progressive Web App)** — bisa diinstal di HP

**Poin yang Disampaikan:**
> *"SIMPAH bisa diakses dari HP manapun tanpa perlu install di PlayStore. Cukup buka browser dan tambahkan ke layar utama."*

---

### Sesi 2: Input Data Harian oleh Petugas (10 menit)
**Langkah:**
1. Navigasi ke menu **Pencatatan Sampah**
2. Pilih **Sampah Masuk (Campur)**
3. Isi form: Berat: `250 kg`, pilih lokasi yang tersedia, dan tanggal hari ini
4. Klik **Simpan**
5. Tunjukkan notifikasi berhasil
6. Coba **matikan WiFi** sebentar → tunjukkan bahwa form masih bisa diisi (offline mode)
7. Nyalakan kembali WiFi → tunjukkan data tersinkronisasi otomatis

**Poin yang Disampaikan:**
> *"Petugas lapangan bisa tetap menginput data meski tidak ada sinyal. Data akan tersinkronisasi otomatis saat kembali online."*

---

### Sesi 3: Validasi Data oleh Koordinator (5 menit)
**Langkah:**
1. Logout, login sebagai `koordinator1`
2. Navigasi ke menu **Validasi Data**
3. Tunjukkan data yang baru diinput muncul dengan status **"Menunggu Verifikasi"**
4. Klik **Setujui** pada salah satu data
5. Tunjukkan status berubah menjadi **"Disetujui"**

**Poin yang Disampaikan:**
> *"Setiap data yang diinput oleh petugas harus divalidasi oleh koordinator sebelum masuk ke dashboard. Ini memastikan akurasi data."*

---

### Sesi 4: Dashboard Eksekutif & ML Forecasting ⭐ (15 menit)
> **Ini adalah sesi paling penting untuk demonstrasi kepada Kepala Dinas.**

**Langkah:**
1. Logout, login sebagai `eksekutif1`
2. Navigasi ke **Dashboard → Ringkasan Eksekutif**
3. Tunjukkan **4 KPI Card** di bagian atas (Total Volume, Pengurangan, Residu, MoU)
4. Scroll ke bawah ke bagian **Grafik Tren Volume Sampah (30 Hari)**
5. Tunjukkan **2 garis** di grafik:
   - Garis Hijau = Data Historis Nyata
   - Garis Oranye Putus-putus = **Prediksi Machine Learning (Prophet)**
6. Klik tab **Harian** → tunggu beberapa detik → garis prediksi akan muncul dengan label `(ML)`

**Poin Teknis yang Disampaikan:**
> *"Garis oranye ini bukan perkiraan manual. Ini adalah hasil kalkulasi dari algoritma Prophet buatan Meta (Facebook) yang kami integrasikan ke dalam sistem. Prophet menganalisis pola historis selama 30 hari terakhir — termasuk efek hari dalam seminggu dan tren bulanan — lalu memproyeksikan 7 hari ke depan secara otomatis."*

**Analogi untuk non-teknis:**
> *"Bayangkan seperti cuaca. Prakiraan cuaca menggunakan data suhu dan curah hujan masa lalu untuk memprediksi besok. Prophet melakukan hal yang sama tapi untuk timbulan sampah — sehingga Bapak/Ibu bisa tahu minggu depan perlu armada berapa untuk mengangkut."*

> [!WARNING]
> **⚠️ DISCLAIMER PENTING UNTUK EKSEKUTIF**  
> *Sampaikan secara jelas bahwa Prediksi Machine Learning ini bersifat probabilistik dan didesain sebagai **Alat Bantu Keputusan (Decision Support System)**, bukan sebagai kebenaran mutlak. Kebijakan penambahan armada tetap harus mempertimbangkan **analisis kritis manusia (Human-in-the-Loop)** untuk kejadian tak terduga (cuaca ekstrem, penutupan jalan, atau event insidental).*

---

### Sesi 5: Fitur Pendukung (10 menit)
1. **GIS / Peta Lokasi**: Tunjukkan distribusi titik pengumpulan sampah di peta
2. **Manajemen MoU**: Tunjukkan daftar MoU dengan transporter, termasuk yang hampir expired
3. **Laporan & Ekspor**: Tunjukkan kemampuan ekspor data untuk pelaporan SIPSN
4. **Pengaduan Masyarakat**: Tunjukkan form aduan yang bisa diisi warga

---

## ✅ Skenario UAT (User Acceptance Testing)

### UAT-01: Input Data Sampah
| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | Login sebagai kader1 | Berhasil masuk ke halaman PWA | ☐ Pass / ☐ Fail |
| 2 | Buka menu Pencatatan | Form input terbuka | ☐ Pass / ☐ Fail |
| 3 | Isi berat = 150 kg, pilih lokasi | Data terisi | ☐ Pass / ☐ Fail |
| 4 | Klik Simpan | Muncul notifikasi berhasil | ☐ Pass / ☐ Fail |
| 5 | Cek di halaman Validasi | Data muncul dengan status "Pending" | ☐ Pass / ☐ Fail |

### UAT-02: Validasi Data
| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | Login sebagai koordinator1 | Berhasil masuk | ☐ Pass / ☐ Fail |
| 2 | Buka menu Validasi Data | Daftar data pending muncul | ☐ Pass / ☐ Fail |
| 3 | Klik Setujui pada data UAT-01| Status berubah jadi Disetujui | ☐ Pass / ☐ Fail |
| 4 | Cek dashboard eksekutif | Angka KPI ter-update | ☐ Pass / ☐ Fail |

### UAT-03: Dashboard & Forecasting ML
| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | Login sebagai eksekutif1 | Berhasil masuk ke dashboard | ☐ Pass / ☐ Fail |
| 2 | Buka Dashboard Eksekutif | 4 KPI card tampil dengan benar | ☐ Pass / ☐ Fail |
| 3 | Lihat grafik Tren Volume | Grafik garis terbuka | ☐ Pass / ☐ Fail |
| 4 | Klik tab Harian | Garis prediksi ML (oranye) muncul | ☐ Pass / ☐ Fail |
| 5 | Lihat label "(ML)" di grafik | Label muncul pada titik prediksi | ☐ Pass / ☐ Fail |

### UAT-04: Offline Mode
| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | Login sebagai kader1 | Berhasil masuk | ☐ Pass / ☐ Fail |
| 2 | Matikan WiFi/koneksi | App masih terbuka | ☐ Pass / ☐ Fail |
| 3 | Input data sampah 100 kg | Form bisa diisi dan disimpan | ☐ Pass / ☐ Fail |
| 4 | Nyalakan kembali WiFi | Muncul notifikasi tersinkronisasi | ☐ Pass / ☐ Fail |

### UAT-05: Manajemen MoU
| # | Langkah | Hasil yang Diharapkan | Status |
|---|---|---|---|
| 1 | Login sebagai koordinator1 | Berhasil masuk | ☐ Pass / ☐ Fail |
| 2 | Buka menu MoU | Daftar MoU tampil | ☐ Pass / ☐ Fail |
| 3 | Cek MoU hampir expired | Muncul indikator warna kuning | ☐ Pass / ☐ Fail |

---

## ❓ Pertanyaan yang Mungkin Ditanyakan & Jawaban

**Q: Apakah sistem ini bisa berjalan di HP Android/iPhone?**
> A: Ya, SIMPAH adalah Progressive Web App (PWA) yang bisa berjalan di browser HP manapun, Android dan iPhone, tanpa perlu install dari PlayStore.

**Q: Bagaimana keamanan data Supabase?**
> A: Data disimpan di server Supabase yang terenkripsi. Setiap pengguna hanya bisa mengakses data sesuai rolenya (sistem RLS - Row Level Security).

**Q: Apa bedanya prediksi ML dengan perkiraan manual?**
> A: Prediksi manual biasanya hanya melihat rata-rata sederhana. Prophet (ML) menganalisis pola kompleks seperti efek hari libur, tren mingguan, dan musiman secara bersamaan — menghasilkan prediksi yang lebih akurat.

**Q: Berapa akurasi prediksi ML-nya?**
> A: Akurasi Prophet bergantung pada kualitas dan jumlah data historis. Semakin banyak data (minimal 3 bulan), semakin akurat. Sistem ini didesain sebagai alat **bantu keputusan**, bukan pengganti keputusan manusia.

**Q: Apakah bisa diintegrasikan dengan sistem SIPSN pusat?**
> A: Ya, sistem memiliki modul komposisi SIPSN yang sudah memetakan kategori sampah sesuai standar nasional, sehingga siap untuk pelaporan SIPSN.

---
*Dokumen ini disiapkan khusus untuk presentasi SIMPAH*
