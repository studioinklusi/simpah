# Product Requirements Document (PRD) & Future Plan
**Produk:** SIMPAH (Sistem Informasi Manajemen Pengelolaan Sampah)
**Versi Dokumen:** 1.0
**Tanggal Update:** 9 Mei 2026

---

## 1. Ringkasan Eksekutif
SIMPAH adalah platform digital berbasis Progressive Web App (PWA) yang dirancang untuk mendigitalisasi dan memonitor seluruh rantai pasok pengelolaan sampah, mulai dari sumber (warga/TPS), pengangkutan (armada), hingga pemrosesan akhir (TPA/Bank Sampah). Sistem ini dilengkapi dengan kecerdasan buatan (AI Chatbot) dan Machine Learning (Prophet) untuk membantu pengambilan keputusan berbasis data yang selaras dengan pelaporan standar nasional (SIPSN).

## 2. Tujuan & Sasaran
*   **Akurasi Data:** Memastikan data sampah tercatat dengan akurat dan tervalidasi secara *real-time*.
*   **Aksesibilitas Tinggi:** Menggunakan teknologi PWA agar petugas lapangan dapat menginput data secara *offline* di daerah minim sinyal, dan akan sinkronisasi saat *online*.
*   **Analitik Prediktif:** Memanfaatkan AI/ML untuk memprediksi tren timbulan sampah harian untuk manajemen armada yang lebih baik.
*   **Transparansi & Pelaporan:** Menyediakan dashboard eksekutif yang memudahkan pimpinan melihat KPI dan ekspor data langsung ke format SIPSN.

---

## 3. Fitur Utama yang Sudah Diimplementasikan (Current State)

### A. Manajemen Pengguna & Otorisasi (Supabase Auth)
*   **Role-Based Access Control (RBAC):** Membagi pengguna dalam 4 level utama: Warga, Kader/Petugas Lapangan, Koordinator/Validator, dan Eksekutif/Kadis.
*   **Keamanan Data:** Implementasi Row Level Security (RLS) di Supabase.

### B. Modul Operasional (Progressive Web App)
*   **Input Data Sampah (Offline-First):** Pencatatan berat sampah (Campur, Pilah, Residu, Masuk, Olah) via HP.
*   **Sistem Validasi Multi-layer:** Data dari lapangan berstatus *Pending* dan harus disetujui (*Approved*) oleh Koordinator sebelum masuk ke analitik utama.
*   **Manajemen Armada & MoU:** Pemantauan status armada pengangkut dan peringatan otomatis untuk kontrak (MoU) yang hampir kedaluwarsa.
*   **Pengaduan Masyarakat:** Form aduan interaktif berbasis foto dan lokasi (GIS).

### C. Dashboard & Analitik Eksekutif
*   **KPI Cards:** Pemantauan ringkasan metrik utama (Total Volume, Pengurangan Sampah, Residu, dan MoU aktif).
*   **Visualisasi Komposisi:** Grafik Donut untuk kategori sampah berstandar SIPSN (Plastik, Organik, Logam, dll).
*   **Machine Learning Forecasting (Prophet):** Integrasi API Backend Python (`ml-backend`) untuk memprediksi volume sampah 7 hari ke depan (Garis Oranye pada grafik tren harian).

### D. Kecerdasan Buatan (AI)
*   **SIMPAH Buddy:** Asisten virtual interaktif menggunakan model bahasa besar (LLM) Qwen dari Alibaba Cloud. Membantu memberikan edukasi sampah, ringkasan laporan, dan panduan penggunaan sistem kepada pengguna.

---

## 4. Arsitektur Teknis Saat Ini
*   **Frontend:** React / Vite (di-build sebagai PWA).
*   **Database & Auth:** Supabase (PostgreSQL) + Row Level Security (RLS).
*   **Machine Learning Backend:** Python (FastAPI + Meta Prophet + Pandas).
*   **AI LLM:** Alibaba Cloud MaaS (Qwen) via integrasi standar OpenAI.

---

## 5. Rencana Pengembangan ke Depan (Future Plan)

Pengembangan selanjutnya (Fase 2 & 3) difokuskan pada otomatisasi perangkat keras, skalabilitas bisnis, dan pemberdayaan ekonomi sirkular.

### Q3 2026: Peningkatan Operasional & IoT
1.  **Integrasi Timbangan Digital (IoT):** 
    *   Menghubungkan timbangan digital di TPS/Bank Sampah secara *bluetooth/serial* langsung ke PWA SIMPAH.
    *   Tujuan: Mencegah *human-error* dan manipulasi data berat sampah.
2.  **Optimasi Rute Armada (Smart Routing):**
    *   Integrasi Google Maps API / Mapbox.
    *   Algoritma untuk menentukan rute pengangkutan sampah terpendek dan paling efisien berdasarkan laporan TPS penuh.

### Q4 2026: Monetisasi & Gamifikasi
3.  **Model Berlangganan & Pembayaran (SaaS):**
    *   Integrasi Payment Gateway (Midtrans) untuk memungut retribusi sampah secara digital dari warga.
    *   Model langganan Premium untuk pengelola kawasan komersial (hotel/pabrik) agar mendapatkan analitik lebih dalam.
4.  **Sistem Reward (Poin Sampah):**
    *   Gamifikasi untuk warga: Warga yang rajin memilah sampah dari rumah (organik vs anorganik) akan mendapatkan poin.
    *   Poin dapat ditukar dengan potongan retribusi atau voucher sembako.

### Q1 2027: Advanced Analytics (Big Data)
5.  **Anomaly Detection (Pendeteksi Kejanggalan):**
    *   Menggunakan algoritma *Isolation Forest* atau *Autoencoders* untuk memberikan *alert* jika tiba-tiba ada penurunan drastis volume sampah (indikasi sampah dibuang liar) atau lonjakan tajam.
6.  **Ekspansi Native Mobile App (Opsional):**
    *   *Wrapping* PWA menggunakan Capacitor/Tauri menjadi aplikasi `.apk` dan `.ipa` murni jika pasar membutuhkan eksistensi resmi di Google Play Store & Apple App Store untuk *branding*.
