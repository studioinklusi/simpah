# 🔑 Daftar Akun Demo & Hak Akses SIMPAH

Dokumen ini berisi daftar lengkap akun demo untuk sistem SIMPAH (Sistem Informasi Manajemen Pengelolaan Sampah) Kabupaten Banjarnegara, lengkap dengan kredensial, peran, spesialisasi, serta penjelasan fungsional masing-masing akun.

---

## 👥 Ringkasan Kredensial Login

Secara umum, kredensial login akun demo menggunakan pola seragam berikut untuk mempermudah pengujian:
* **Email:** `<username>@simpah.dev`
* **Password Utama:** `<username>123`
* **Password Cadangan (Fallback):** `simpah123`
* **Metode Login:** Dapat menggunakan **Username** saja (misal: `admin1`) atau **Email Lengkap** (misal: `admin1@simpah.dev`).

---

## 📋 Tabel Detail Akun Pengguna

| No | Nama / Instansi | Username | Role Utama | Spesialisasi (Job Type) | Password Utama | Fitur Utama & Penjelasan Akses |
|:---:|---|---|:---:|:---:|---|---|
| **1** | **Admin SIMPAH** | `admin1` | `admin` | - | `admin123` | **Super Administrator:** Akses penuh ke seluruh sistem dashboard & PWA mobile. Mengelola Master Data (pengguna, lokasi, fasum), MoU Transporter, Validasi Data, Audit Log, dan Export Laporan. |
| **2** | **Bupati Banjarnegara** | `eksekutif1` | `eksekutif` | - | `eksekutif123` | **Executive Viewer (Read-Only):** Memantau data makro melalui Ringkasan Eksekutif, Peta GIS, Laporan & Ekspor, serta Intervensi Wilayah/Fasilitas Umum. Tidak memiliki akses menulis data. |
| **3** | **Koordinator Lapangan** | `koordinator1` | `petugas` | `koordinator` | `koordinator123` | **Pengawas Lapangan:** Bertanggung jawab memverifikasi dan memvalidasi data inputan sampah masuk, pilah, dan olah dari petugas lain. Tidak menginput sampah secara langsung. |
| **4** | **Operator TPS3R** | `operator1` | `petugas` | `operator_tps` | `operator123` | **Pengelola Fasilitas TPS3R:** Mencatat timbangan sampah masuk, proses pemilahan (pilah), hasil pengolahan (olah), dan sisa sampah (residu) di fasilitas TPS3R. |
| **5** | **Petugas Pengangkut** | `petugas1` | `petugas` | `angkut` | `petugas123` | **Driver Armada:** Mencatat pengangkutan sampah masuk, pembuangan residu ke TPA, serta mengelola status armada/kendaraan yang dikemudikan. |
| **6** | **Kader Lingkungan** | `kader1` | `petugas` | `kader` | `kader123` | **Penggerak Masyarakat:** Menginput data sampah tingkat RT/RW (masuk, pilah, olah) serta melaporkan kegiatan insidental seperti kerja bakti atau sosialisasi warga. |
| **7** | **Warga Banjarnegara** | `warga1` | `warga` | - | `warga123` | **Masyarakat Umum (PWA):** Melaporkan aduan tumpukan sampah liar, memantau status aduan pribadi, dan melihat peta GIS lokasi fasilitas kebersihan terdekat. |

---

## 🗺️ Struktur Hubungan Role & Fitur

```mermaid
graph TD
    subgraph Dashboard Admin & Eksekutif
        admin["Admin (Full Control)"] -->|Kelola| md[Master Data & MoU]
        admin -->|Validasi| val[Persetujuan Data]
        eksekutif["Bupati/Eksekutif (Read-Only)"] -->|Pantau| stats[Statistik & GIS Map]
    end

    subgraph Aplikasi Mobile PWA (Petugas)
        petugas["Role: petugas"] --> koor["Koordinator Lapangan"]
        petugas --> opt["Operator TPS3R"]
        petugas --> angkut["Petugas Angkut"]
        petugas --> kader["Kader Lingkungan"]
        
        koor -->|Aksi| val_pwa[Validasi Data Lapangan]
        opt -->|Input| waste_full[Masuk, Pilah, Olah, Residu]
        angkut -->|Input| waste_fleet[Masuk, Residu, Armada]
        kader -->|Input| waste_ins[Masuk, Pilah, Olah, Kegiatan Warga]
    end

    subgraph Aplikasi Mobile PWA (Masyarakat)
        warga["Warga Banjarnegara"] -->|Aksi| aduan[Buat Aduan Sampah & GIS Map]
    end

    style admin fill:#2563eb,color:#fff
    style eksekutif fill:#059669,color:#fff
    style petugas fill:#d97706,color:#fff
    style warga fill:#4b5563,color:#fff
```

---

## 💡 Informasi Penting Tambahan

1. **Aplikasi Mobile PWA (Progressive Web App):**
   * Role `petugas` dan `warga` didesain untuk kenyamanan akses melalui perangkat mobile/PWA. Mereka secara default tidak diarahkan ke halaman dashboard administrasi, melainkan ke antarmuka aplikasi mobile yang ringkas.
2. **Fleksibilitas Autentikasi:**
   * Jika saat login pengguna hanya memasukkan username saja (misal: `kader1`), sistem secara otomatis menambahkan domain `@simpah.dev` di latar belakang sebelum memverifikasi data ke Supabase Auth.
3. **Penyimpanan Lokal (Offline Mode):**
   * Akun-akun di atas juga terdaftar pada database lokal IndexedDB browser saat pertama kali aplikasi dijalankan offline, sehingga proses simulasi pengumpulan data tetap dapat dicoba meskipun koneksi internet terputus.
