# SIMPAH (Sistem Informasi Monitoring Pengelolaan Sampah)
**PWA (Progressive Web App) & Dashboard Monitoring Skala Kabupaten**

SIMPAH adalah platform prototype / MVP pengelolaan sampah *end-to-end* yang mensinkronisasi data lapangan dengan standar laporan pemerintah pusat (SIPSN). Aplikasi ini dirancang untuk dapat beroperasi meski tanpa koneksi internet yang stabil (*Offline-first PWA*), dan menyediakan dashboard interaktif bagi pemangku keputusan (GIS & Analytics) untuk DLHK/Dinas terkait (dalam studi kasus ini difokuskan untuk Kabupaten Banjarnegara).

---

## 🎯 Fitur Utama

1.  **PWA Modul Lapangan (Offline-First)**
    *   Bisa diinstal sebagai aplikasi *Mobile* di layar utama *smartphone*.
    *   *Data Sync*: Data dapat direkam tanpa sinyal internet, lalu akan diunggah (tersinkronisasi) otomatis ketika *online*.
    *   Rekam sampah masuk, pemilahan, pengolahan mandiri (kompos/pakan ternak/pirolisis), dan residu super cepat (< 10 detik).
    *   **Input Akumulasi (Batch):** Kader bisa mencatat timbangan total seminggu sekaligus — sistem **membagi rata berat otomatis per hari** ke belakang agar grafik Dinas tetap mulus.
    *   *Geotagging* otomatis dan lampiran foto untuk jejak audit.

2.  **Dashboard GIS (Peta Interaktif)**
    *   Pemetaan lokasi TPS, TPS3R, Bank Sampah, dan TPA.
    *   Visualisasi *Heatmap* volume produksi sampah di ruang lingkup geospasial.

3.  **Dashboard DLHK Eksekutif**
    *   *Alur Validasi Anti-Fraud*: Filter persetujuan (Status Pending) oleh Dinas untuk membedakan data bersih yang boleh masuk perhitungan statistik SIPSN.
    *   *Decision Support System / Intervensi*: Sistem analitik rule-engine otomatis yang mengukur rapor/scoring desa terkait masalah timbulan sampah, daur ulang terbengkalai, dan fasilitas minim—lengkap dengan fasilitas ekspor PDF.
    *   *Analytics & Charts* real-time: volume harian, laju daur ulang (*recycle rate*), dan komposisi berdasarkan kategori SIPSN.
    *   Eksport data dalam *format raw* Excel (CSV) yang serasi persis dengan format upload SIPSN Kementerian LHK.
    *   Manajemen *MoU Pipeline* untuk kepatuhan operasional angkutan / transporter swasta.
    *   **Master Data**: Dashboard setelan untuk menambah dan mengelola titik Lokasi TPS, Armada Kendaraan, dan Akun Pengguna secara dinamis.
    *   **Manajemen Aduan Warga**: Panel untuk merespon dan menindaklanjuti keluhan masyarakat yang masuk dari portal publik.

4.  **Portal Layanan Publik**
    *   Portal aduan liar dengan GPS tracking di-enkapsulasi dengan edukasi pengelolaan limbah bagi tata rukun publik.
    *   **Sistem Nomor Resi**: Warga mendapatkan *tracking number* otomatis untuk memonitor progres penyelesaian aduan mereka secara publik dan transparan.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi dibangun *client-side* menggunakan bundler modern **Vite** dan Vanilla JavaScript (Tanpa framework berat demi meringankan beban *browser mobile*).

### A. Persyaratan Awal (Prerequisites)
Pastikan sistem operasi Anda (Windows/Mac/Linux) telah terinstal aplikasi:
*   [Node.js](https://nodejs.org/en/) (Disarankan versi LTS, misal v18 atau v20).

### B. Langkah Instalasi & Menjalankan (Development)

1.  Buka terminal (Command Prompt / PowerShell) dan arahkan ke dalam *folder* `simpah`:
    ```bash
    cd u:\Project\simpah
    # Atau sesuaikan dengan lokasi direktori Anda
    ```

2.  Unduh *dependencies* package yang diperlukan:
    ```bash
    npm install
    ```

3.  Nyalakan server lokal (Dev Server):
    ```bash
    npm run dev
    ```

4.  Buka *browser* (direkomendasikan Google Chrome) dan akses:
    **[http://localhost:3000](http://localhost:3000)**

### C. Men-generate Produksi (Build Output)
Jika hendak diunggah ke layanan *web hosting* (seperti Vercel, Netlify, atau Apache Server standard):
```bash
npm run build
```
Hasil file jadi yang sudah diringkas (minified) akan muncul di dalam folder `dist/`.

---

## 🔑 Akun Demo (Simulasi)

Saat membuka aplikasi, Anda bisa mengklik tombol uji coba cepat, atau memasukkan *username* serta *password* berikut secara manual di menu Login (**Masuk Sistem**). 
Karena data dikelola di `IndexedDB` *(Browser Storage lokal)*, setiap profil memiliki hierarki hak akses yang berbeda:

| Role Akses | Tujuan / Fokus Demo | Username | Password |
| :--- | :--- | :--- | :--- |
| **Pekerja Lapangan (Kader)** | Tampilan PWA Mobile untuk rekam timbangan sampah | `kader1` | `kader123` |
| **Petugas Truk / Armada** | Tampilan PWA Mobile khusus input residu ke TPA | `petugas1` | `petugas123` |
| **Pengepul Sampah** | Tampilan PWA Mobile untuk rekam konversi daur ulang | `pengepul1` | `pengepul123` |
| **Pemerintah Desa** | Dashboard Peta GIS dan Operasional Kewilayahan | `pemdes` | `pemdes123` |
| **Tim Dinas / DLH Utama** | Dasbor Pusat (Eksekutif, Validasi, Intervensi Desa) | `dinas` | `dinas123` |

> *Catatan: Untuk menguji tampilan PWA Kader Lapangan, sangat disarankan menggunakan "Inspect Element > Toggle Device Toolbar (F12 di Chrome)" agar window web berubah menyerupai layar HP dan responsifnya terlihat optimal.*

---

**© 2026 Developed for KMM Kabupaten Banjarnegara (Development Build)**
