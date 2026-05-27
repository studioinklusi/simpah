# RENCANA ANGGARAN BIAYA (RAB)
**Inovasi:** SIMPAH (Sistem Informasi Manajemen Pengelolaan Sampah)
**Periode:** 1 Tahun
**Lingkup:** Implementasi Infrastruktur Cloud (AWS), Lisensi, dan Layanan Operasional

## 1. Infrastruktur Cloud (Amazon Web Services - AWS)
| No | Komponen Layanan AWS | Spesifikasi / Keterangan | Estimasi Biaya/Bulan | Estimasi Biaya/Tahun |
|---|---|---|---|---|
| 1.1 | Amazon EC2 (App Server) | t3.medium (2 vCPU, 4GB RAM) - Compute engine | Rp 735.000 | Rp 8.820.000 |
| 1.2 | Amazon RDS (Database) | db.t3.medium - PostgreSQL (Multi-AZ untuk keandalan) | Rp 1.415.000 | Rp 16.980.000 |
| 1.3 | Amazon S3 (Penyimpanan File)| 100 GB Storage (Untuk dokumen bukti sampah, foto, dll) | Rp 176.600 | Rp 2.119.200 |
| 1.4 | Amazon CloudFront (CDN) | Akselerasi akses website & dashboard GIS dari seluruh wilayah| Rp 264.900 | Rp 3.178.800 |
| 1.5 | Amazon Route 53 & SSL | Manajemen DNS & Keamanan (AWS Certificate Manager) | - | Rp 883.000 |
| 1.6 | AWS Backup | Pencadangan (backup) harian database otomatis | Rp 264.900 | Rp 3.178.800 |
| | **Sub-Total Infrastruktur Cloud** | | | **Rp 35.159.800** |

## 2. Lisensi & Layanan Pihak Ketiga
| No | Komponen Layanan | Spesifikasi / Keterangan | Estimasi Biaya/Tahun |
|---|---|---|---|
| 2.1 | API Pemetaan (Mapbox/Gmaps) | Kebutuhan Dashboard Analitik GIS | Rp 3.000.000 |
| 2.2 | Domain Resmi | Registrasi domain (misal: simpah.id atau simpah.namadaerah.go.id) | Rp 500.000 |
| | **Sub-Total Lisensi** | | **Rp 3.500.000** |

## 3. Layanan Profesional, Implementasi & Pemeliharaan
| No | Komponen Layanan | Spesifikasi / Keterangan | Estimasi Biaya |
|---|---|---|---|
| 3.1 | Setup & Migrasi Cloud AWS | Desain arsitektur cloud, keamanan IAM, dan deployment awal | Rp 10.000.000 |
| 3.2 | Jasa Pemeliharaan Sistem (1 Thn)| DevOps, monitoring server 24/7, perbaikan bug minor | Rp 30.000.000 |
| 3.3 | Sosialisasi & Bimbingan Teknis | Pelatihan operasional kepada admin dinas, kader, dan fasum | Rp 15.000.000 |
| 3.4 | Penyusunan Buku Panduan (Manual)| Pembuatan modul cetak & Video Tutorial Penggunaan Sistem | Rp 5.000.000 |
| | **Sub-Total Layanan Profesional**| | **Rp 60.000.000** |

---

## RINGKASAN TOTAL ANGGARAN (1 TAHUN)
- **1. Infrastruktur Cloud (AWS):** Rp 35.159.800
- **2. Lisensi Pihak Ketiga:** Rp 3.500.000
- **3. Layanan Profesional & Implementasi:** Rp 60.000.000
- **TOTAL KESELURUHAN:** **Rp 98.659.800**

*(Terbilang: Sembilan Puluh Delapan Juta Enam Ratus Lima Puluh Sembilan Ribu Delapan Ratus Rupiah)*

---
**Catatan:**
1. Estimasi biaya *Amazon Web Services (AWS)* di atas merupakan nilai pendekatan berdasarkan kalkulasi asumsi trafik standar untuk tingkat kabupaten/kota dengan pengguna aktif harian sedang. 
2. AWS menerapkan skema *Pay-As-You-Go* sehingga pengeluaran aktual bisa lebih rendah apabila penggunaan server lebih ringan.
3. Estimasi menggunakan referensi kurs konversi yang berlaku yaitu **Rp 17.660,00 / USD**.
