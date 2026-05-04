# Product Requirements Document (PRD)
**SIMPAH (Sistem Informasi Monitoring Pengelolaan Sampah)**

---

## 1. Executive Summary

**SIMPAH** adalah platform digital berbasis Progressive Web App (PWA) dan Web Dashboard yang berfungsi untuk memonitor, mencatat, dan menganalisis siklus pengelolaan sampah secara *end-to-end*—dari tingkat masyarakat akar rumput hingga Dinas Lingkungan Hidup.

Aplikasi ini tidak hanya sekadar alat untuk pencatatan entri data, melainkan sebuah **sistem kendali pengelolaan sampah kabupaten secara real-time dan terintegrasi.** 

Tujuan utama sistem ini adalah meningkatkan akurasi data pencatatan, mempermudah pelaporan yang kompatibel dengan **SIPSN** (Sistem Informasi Pengelolaan Sampah Nasional), memberikan transparansi operasional, serta memastikan akuntabilitas rantai proses melalui jejak audit (audit trail) berbasis GPS dan stempel waktu (*timestamp*).

---

## 2. Product Vision & Value Proposition

### Value Utama Produk
1. **Standarisasi Data:** Transformasi format data di lapangan agar bisa sejalan secara penuh dengan standar SIPSN.
2. **Monitoring Berbasis Peta (GIS):** Visualisasi geospasial (bukan sekadar tabel) untuk memantau sebaran infrastruktur TPS/Bank Sampah serta mendeteksi konsentrasi volume (heatmap).
3. **Efisiensi SIPSN:** Mempermudah pembuatan laporan bagi Dinas, didukung fitur Export siap *upload*.
4. **Transparansi & Akuntabilitas:** Tiap entri bisa dilacak kembali siapa pengunggahnya, kapan diunggah, dan di mana persis lokasinya (*auto-geolocation*).
5. **Keterlibatan Masyarakat:** Pemberdayaan warga untuk secara aktif memilah sampah dan berani melaporkan permasalahan lewat Form Aduan anonim.

### Key Message (Arah Pitching/Presentasi)
> *"Ini bukan sekadar aplikasi pencatatan, tapi sistem kendali pengelolaan sampah kabupaten secara real-time dan terintegrasi."*

---

## 3. Target Pengguna (User Personas & RBAC)

Sistem ini menggunakan arsitektur *Role-Based Access Control* (RBAC) 4 Peran Utama, dengan penjabaran operasional (*Job Types*) khusus untuk petugas lapangan:

| Peran (Role) | Sub-Peran (Job Type) | Kebutuhan Utama & Hak Akses |
| --- | --- | --- |
| **Warga** | - | Melihat statistik publik, peta GIS, dan melaporkan aduan/keluhan (Akses Portal & PWA). |
| **Petugas** | **Koordinator Lapangan** | Pengawas lapangan; memiliki hak untuk memvalidasi (Approve/Reject) data operasional. |
| **Petugas** | **Petugas Angkut** | Memasukkan data manifest truk (Armada), sampah masuk, dan residu akhir. |
| **Petugas** | **Operator TPS3R** | Pengelola TPS/Bank Sampah; akses penuh input Sampah Masuk, Pilah, Olah, dan Residu. |
| **Petugas** | **Kader Lingkungan** | Penggerak RT/RW; menginput data Sampah Masuk, Pemilahan, serta **Olah Sampah** (misal: pakan maggot, kompos). |
| **Eksekutif** | - | Akses dashboard *bird-eye view*, mengekstrak laporan SIPSN, dan memonitor kinerja. |
| **Admin** | - | Hak kontrol penuh (*Superuser*), manajemen Master Data, Audit Log, Manajemen MoU, dan pengaturan sistem DLH. |

---

## 4. Core System & Features

### 4.1. PWA Operasional (Lapangan - Mobile First)
Didesain khusus untuk operasional di lapangan menggunakan perangkat *mobile* kelas menengah ke bawah (*low-end*).
*   **Performa Ekstra Cepat:** Flow input ringkas `< 10 detik` dengan tombol besar.
*   **Mode Offline-First:** Pengguna dapat mencatat data di daerah tanpa sinyal internet. Data tersimpan di *cache* lokal (IndexedDB) dan di-*sync* atau dikirim secara otomatis saat jaringan tersedia.
*   **Sistem Hub "Sampah Masuk" Terpusat:** Input operasional diorganisir dalam satu pintu (*Hub*) yang membagi alur pencatatan secara logis berdasarkan kondisi sampah:
    *   *Campur* (Sampah campuran/tidak dipilah yang langsung diteruskan ke TPA).
    *   *Pilah* (Pemilahan berdasarkan detail kategori SIPSN otomatis, terintegrasi langsung dengan field *Residu* untuk mencatat sisa pemilahan di satu tempat).
    *   *Olah* (Pengolahan mandiri di sumber menjadi produk bernilai seperti Pakan Ternak, Kompos, Maggot BSF, Biogas, Kerajinan, dll).
*   **Sistem Anti Double-Counting (Pendeteksi Sumber):** Mengakomodir transaksi B2B antar fasilitas. Terdapat opsi "Asal/Sumber Sampah" di tiap form (*Sumber Langsung* vs *Fasilitas Lain*). Sistem secara cerdas akan mengecualikan sampah dari *Fasilitas Lain* (misal: Pengepul B membeli dari Bank Sampah A) dari total agregasi kabupaten untuk mencegah penghitungan ganda yang merusak akurasi pelaporan nasional.
*   **Input Akumulasi (Batch):** Kader di pedesaan seringkali tidak mengolah sampah setiap hari. Fitur toggle "Laporan Akumulasi" memungkinkan pengguna memasukkan total timbangan dari beberapa hari sekaligus (misal seminggu sekali), dan sistem akan **membagi rata berat per hari secara otomatis ke belakang** sehingga grafik dasbor Dinas tetap mulus tanpa lonjakan palsu (*false spike*).
*   **Insidental Form:** Menu khusus penjadwalan kegiatan insidental (Misal: kerja bakti RT, pembersihan khusus, edukasi, lainnya).
*   **Validasi Armada & MoU:** Fitur mencantumkan pelat nomor/kode kendaraan pada saat pembuangan ke TPA guna validasi MoU transportasi (mencegah pembuang luar kawasan/liar).

### 4.2. Dashboard GIS (Geospasial)
Peta interaktif (*bird-eye view*) untuk pemetaan tata kelola lingkungan kabupaten.
*   **Pemetaan Titik Lokasi (POIs):** Memvisualisasikan TPS, TPS3R, Bank Sampah, lokasi Pengepul hingga lokasi TPA di peta interaktif.
*   **Volume Heatmap:** Menampilkan *heatmap* intensitas penumpukan/produksi volume sampah pada berbagai wilayah untuk menentukan skala prioritas tindakan.
*   **Filter Geospasial:** Visualisasikan data lokasi tersebut berdasarkan interval kapan data diambil dan klasifikasi jenis lokasi.

### 4.3. Dashboard Eksekutif (Dinas DLHK/DLH)
Panel ringkasan (*Analytics & Reporting*) berorientasi indikator KPI makro kabupaten.
*   **Alur Validasi Data (Anti-Fraud):** Seluruh input dari Kader di lapangan harus melalui meja validasi elektronik (Status *Pending*) sebelum disetujui masuk kalkulasi statistik SIPSN, guna menghindari manipulasi target tonase sampah.
*   **Dasbor Intervensi Desa (Decision Support System):** Mesin intelijen terotomatisasi (*Rule Engine*) yang memberikan *traffic light scoring* kepada setiap desa berdasarkan rasio daur ulang, aduan, dan residu tingkat mikro, lengkap dengan menu *Export PDF Rekomendasi Prioritas* siap cetak.
*   **Laporan Multi-Tempo:** Grafik rekap volume sampah, residu, dan *recycling rate* secara Harian, Mingguan, Bulanan, dan Tahunan.
*   **Export Data Terstandarisasi:** Unduh tabel tabulasi yang diformat *plek-ketiplek* sesuai kolom persyaratan SIPSN (via *CSV* atau *Excel*).
*   **Manajemen MoU Transportasi:** Meninjau daftar armada transporter swasta, melacak nomor registrasi, serta status aktif/kadaluarsa dari perjanjian MoU.
*   **Master Data Management (MDM):** Panel khusus CRUD bagi admin Dinas untuk mengelola dan menambah kamus entitas utama sistem secara dinamis (Daftar Lokasi TPS, Daftar Armada Kendaraan, dan Manajemen Akun Pengguna).
*   **Manajemen Aduan Warga:** Panel monitoring komprehensif bagi Dinas untuk melihat, merespon, dan menindaklanjuti keluhan masyarakat yang masuk beserta pembaruan status penyelesaiannya secara transparan.

### 4.4. Portal Publik 
Gerbang transparansi, partisipasi informasi, dan serap aspirasi warga.
*   **Modul Edukasi & Galeri:** Kumpulan artikel artikel panduan (*composting*, daur ulang), dan galeri kegiatan kebersihan daerah.
*   **Halaman Regulasi:** Direktori terpusat untuk menampilkan Perda dan Perbup yang berkaitan dengan persampahan. Downloadable *PDF*.
*   **Lapor & Aduan (Without Login):**
    *   Memungkinkan masyarakat untuk melapor masalah (seperti TPS membludak / tumpukan liar).
    *   **Sistem Nomor Tiket (Resi Pelacakan Publik):** Warga akan mendapatkan Nomor Resi (misal: `ADU-260401-1234`) setelah mengunggah laporan, lalu dapat mengecek status (Diterima, Diproses, Ditindaklanjuti, Selesai) beserta melihat "Tanggapan Dinas" secara transparan.
    *   Otomatis menarik *Geotagging* Lokasi warga.
    *   Wajib menyertakan *Upload Foto*.

---

## 5. Non-Functional Requirements (NFR)

1.  **Optimization for Low-End Devices:** Antarmuka harus *resource-friendly*; mampu beroperasi mulus pada HP Android dengan RAM 1–2 GB. Animasi dan elemen-elemen dikurangi di sisi Mobile PWA.
2.  **SLA Kecepatan Load:** *Web Dashboard* mentargetkan perenderan data (< 3 detik batas toleransi visual).
3.  **Keamanan Audit (Auditability):** Semua transaksi di database harus menyimpan jejak: (a) Kapan dibuat, (b) Siapa yang memasukkan (*userID*), dan (c) Di mana koordinatnya (*lat, lng*).
4.  **Standarisasi SIPSN:** Arsitektur dari variabel skema database mengikuti standar pembakuan tipe tipe bahan SIPSN (mis: *Sisa Makanan, Kayu, Kertas, Plastik, Logam, Tekstil, dll*).

---

## 6. Output Utama (Deliverables) Proyek 

1.  **Aplikasi Dashboard Skala Kabupaten:** Yang mendukung monitoring pusat untuk pengampu kebijakan.
2.  **Dataset Siap Audit:** Yang transparan, tidak bisa dirubah sesuka hati, dan valid berdasarkan parameter lapangan.
3.  **Peta Wilayah Prioritas:** Visualisasi yang tajam untuk membantu Dinas Lingkungan dalam alokasi resources (truk/tenaga kebersihan) berdasarkan heatmap sampah.
4.  **Ekosistem yang Fleksibel (Replicable):** Infrastruktur berbasis modul *(frontend decoupled)* yang siap untuk direplikasi ke sistem kabupaten/kota tetangga apabila terbukti sukses.
