# RENCANA ANGGARAN BIAYA (RAB)
**Inovasi:** SIMPAH (Sistem Informasi Manajemen Pengelolaan Sampah Terintegrasi)  
**Periode:** 1 Tahun  
**Kebutuhan:** Implementasi Sistem, Cloud VPS Database & Hosting, Serta Serah Terima Manual Book  
**Total Anggaran:** Rp 50.000.000 (Terbilang: Lima Puluh Juta Rupiah)

---

## RINCIAN ANGGARAN BIAYA

| No | Komponen Pekerjaan / Rincian Biaya | Spesifikasi / Keterangan | Volume | Satuan | Harga Satuan (Rp) | Total Harga (Rp) |
|---|---|---|:---:|:---:|---|---|
| **1** | **Lisensi Penggunaan Sistem (1 Tahun)** | | | | | |
| 1.1 | Lisensi Platform Core SIMPAH (PWA) | Akses source code, modul aplikasi web responsif (Warga, Petugas, Koordinator, Eksekutif) selama 1 tahun | 1 | Paket | 22.045.000 | 22.045.000 |
| | *Subtotal Lisensi* | | | | | **22.045.000** |
| **2** | **Kustomisasi & Setup Database PostgreSQL** | | | | | |
| 2.1 | Pembuatan & Kustomisasi Skema Database | Setup database PostgreSQL lokal di VPS (konfigurasi tabel, view rekapitulasi, & triggers) | 1 | Paket | 6.000.000 | 6.000.000 |
| 2.2 | Penyesuaian API & Dashboard Dinas | Kustomisasi form pelaporan sampah sesuai standar Dinas DPPKPLH & integrasi Peta GIS | 1 | Paket | 6.000.000 | 6.000.000 |
| | *Subtotal Kustomisasi* | | | | | **12.000.000** |
| **3** | **Sewa Server Cloud Database & Hosting (1 Tahun)** | | | | | |
| 3.1 | Sewa Server Cloud VPS (Virtual Private Server) | Penyewaan Cloud VPS Server (Spesifikasi Core: 4 vCPU, 8GB RAM, 100GB SSD, Bandwidth Unlimited, Backup) | 12 | Bulan | 450.000 | 5.400.000 |
| 3.2 | Domain Resmi Pemda & SSL Certificate | Pengurusan domain `.go.id` / `.id` dan sertifikat SSL keamanan HTTPS untuk 1 tahun | 1 | Paket | 600.000 | 600.000 |
| | *Subtotal Server & Cloud* | | | | | **6.000.000** |
| **4** | **Instalasi, Uji Coba, Pemeliharaan & Manual Book** | | | | | |
| 4.1 | Setup CI/CD & Deployment Server | Konfigurasi pipeline deployment, pengujian keamanan data, dan konfigurasi environment | 1 | Paket | 2.000.000 | 2.000.000 |
| 4.2 | DevOps & Pemeliharaan Sistem (1 Tahun) | Monitoring keaktifan server 24/7, perbaikan bug minor, dan optimasi database berkala | 1 | Paket | 1.500.000 | 1.500.000 |
| 4.3 | Penyusunan Buku Panduan (Manual Book) | Penyusunan modul manual cetak dan video tutorial penggunaan sistem untuk admin & kader | 1 | Paket | 1.500.000 | 1.500.000 |
| | *Subtotal Layanan & Manual Book* | | | | | **5.000.000** |
| | **SUBtotal keseluruhan (Sebelum PPN)** | | | | | **45.045.000** |
| | **Pajak Pertambahan Nilai (PPN 11%)** | | | | | **4.955.000** |
| | **TOTAL ESTIMASI BIAYA (Subtotal + PPN 11%)** | | | | | **50.000.000** |

---

## RINGKASAN ANGGARAN
1. **Lisensi Sistem (1 Tahun):** Rp 22.045.000
2. **Kustomisasi & Setup Database:** Rp 12.000.000
3. **Infrastruktur Cloud & Server (1 Tahun):** Rp 6.000.000
4. **Instalasi, Pemeliharaan & Dokumentasi:** Rp 5.000.000
5. **Pajak Pertambahan Nilai (PPN 11%):** Rp 4.955.000

**TOTAL KESELURUHAN:** **Rp 50.000.000,00**  
*(Terbilang: Lima Puluh Juta Rupiah)*

---

## CATATAN TEKNIS & KETENTUAN
1. **Model Lisensi (SaaS):** Hak kekayaan intelektual source code berada pada pengembang. Hak pemanfaatan aplikasi dan seluruh kepemilikan data adalah mutlak milik instansi terkait.
2. **Server & Cloud:** Menggunakan Cloud VPS Server mandiri (self-hosted) dengan konfigurasi web server Nginx, database PostgreSQL lokal, dan SSL Certificate HTTPS (Let's Encrypt/Sertifikat Resmi) untuk menjamin kedaulatan data dan kemudahan pengelolaan server.
3. **Pelatihan & Sosialisasi:** Pelatihan operasional dan sosialisasi kepada kader lingkungan serta petugas lapangan diselenggarakan dan ditanggung sepenuhnya oleh instansi pengguna (Dinas). Pihak pengembang hanya menyediakan manual book (buku panduan) dan video tutorial penggunaan sistem sebagai bagian dari serah terima sistem.
4. **Perpanjangan Layanan:** Di tahun kedua dan seterusnya, biaya perpanjangan server, domain, pemeliharaan sistem, dan database diestimasi berkisar antara 15-30% dari nilai kontrak awal per tahun.
