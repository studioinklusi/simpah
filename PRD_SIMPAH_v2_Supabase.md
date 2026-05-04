# PRD v2 — SIMPAH (Sistem Informasi Monitoring Pengelolaan Sampah)
## Migrasi ke Supabase Backend

**Versi:** 2.1  
**Tanggal:** 5 Mei 2026  
**Status:** Draft — Menunggu Review  

---

## 1. Executive Summary

SIMPAH saat ini adalah prototype frontend-only (Vite + Vanilla JS) yang menyimpan seluruh data di **IndexedDB browser**. Dokumen ini mendefinisikan rencana migrasi ke **Supabase** (PostgreSQL + Auth + Storage + Realtime + Edge Functions) sebagai backend terpusat, sambil mempertahankan kemampuan **offline-first PWA** yang sudah ada.

### Mengapa Supabase?

| Kriteria | Keuntungan Supabase |
|---|---|
| **PostgreSQL Native** | Relational DB yang mature, mendukung GIS (PostGIS), JSON, dan full-text search |
| **Auth Built-in** | Email/password, OTP SMS, dan RBAC via RLS tanpa perlu menulis auth server |
| **Row Level Security** | Keamanan data di level database — setiap query otomatis difilter berdasarkan role user |
| **Realtime** | WebSocket subscription untuk live dashboard tanpa polling |
| **Storage** | Object storage untuk foto aduan & lampiran lapangan |
| **Edge Functions** | Serverless Deno functions untuk logika bisnis kompleks (export SIPSN, PDF intervensi) |
| **Biaya** | Free tier generous (500MB DB, 1GB storage, 50K MAU auth) — cukup untuk pilot kabupaten |

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vite PWA)                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  │
│  │ PWA Mobile│  │Dashboard │  │  Portal   │  │ AI/Forecas│  │
│  │ (Kader)  │  │ (Dinas)  │  │  (Publik) │  │  -ting UI │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └─────┬─────┘  │
│       │              │              │              │         │
│  ┌────▼──────────────▼──────────────▼──────────────▼──────┐  │
│  │              IndexedDB (Offline Cache)                  │  │
│  └────────────────────────┬────────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────┘
                            │ Sync (Online)
┌───────────────────────────▼─────────────────────────────────┐
│                     SUPABASE CLOUD                           │
│  ┌────────┐ ┌─────┐ ┌─────────┐ ┌──────────────────────┐    │
│  │  Auth  │ │ DB  │ │ Storage │ │    Edge Functions      │    │
│  │ (RBAC) │ │(PG) │ │ (Foto)  │ │ Export/PDF/Cron/AI    │    │
│  └────────┘ └──┬──┘ └─────────┘ └──────────────────────┘    │
│                │                          │                   │
│         ┌──────▼───────┐    ┌─────────────▼──────────────┐   │
│         │   Realtime   │    │     AI/ML Layer             │   │
│         │  (WebSocket) │    │  Google Gemini API          │   │
│         └──────────────┘    │  Forecasting (Time-Series)  │   │
│                             └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Strategi Offline-First

1. **Write ke IndexedDB dulu** → tampilkan data ke user secara instan
2. **Background sync** → ketika online, push ke Supabase via `supabase-js`
3. **Conflict resolution** → server timestamp wins (last-write-wins with server `updated_at`)
4. **Pull changes** → Realtime subscription atau periodic polling untuk dashboard

---

## 3. Database Schema (PostgreSQL / Supabase)

### 3.1 Tabel `profiles` (extends Supabase Auth)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('warga','petugas','eksekutif','admin')),
  job_type TEXT CHECK (job_type IN ('koordinator','angkut','operator_tps','kader')),
  phone TEXT,
  location_id UUID REFERENCES locations(id),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 Tabel `locations`

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tps','tps3r','bank_sampah','pengepul','tpa')),
  address TEXT,
  wilayah TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  capacity_kg NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Tabel `waste_records` (Tabel Inti)

```sql
CREATE TABLE waste_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id TEXT, -- ID dari IndexedDB untuk sync matching
  type TEXT NOT NULL CHECK (type IN ('masuk','campur','pilah','olah','residu')),
  category_sipsn TEXT NOT NULL,
  weight_kg NUMERIC(10,2) NOT NULL CHECK (weight_kg > 0),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location_id UUID REFERENCES locations(id),
  location_name TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  user_name TEXT,
  fleet_id UUID REFERENCES fleet(id),
  fleet_plate TEXT,
  source_type TEXT DEFAULT 'langsung' CHECK (source_type IN ('langsung','fasilitas_lain')),
  source_location_id UUID REFERENCES locations(id),
  is_batch BOOLEAN DEFAULT false,
  batch_start_date DATE,
  batch_end_date DATE,
  batch_days INTEGER,
  treatment_method TEXT,
  is_incidental BOOLEAN DEFAULT false,
  notes TEXT,
  photo_url TEXT,
  verification_status TEXT DEFAULT 'pending' 
    CHECK (verification_status IN ('pending','approved','rejected')),
  verification_notes TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now(),
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index untuk query performa
CREATE INDEX idx_waste_records_date ON waste_records(record_date);
CREATE INDEX idx_waste_records_type ON waste_records(type);
CREATE INDEX idx_waste_records_location ON waste_records(location_id);
CREATE INDEX idx_waste_records_user ON waste_records(user_id);
CREATE INDEX idx_waste_records_status ON waste_records(verification_status);
CREATE INDEX idx_waste_records_category ON waste_records(category_sipsn);
```

### 3.4 Tabel `sorted_waste` (Detail Pilah)

```sql
CREATE TABLE sorted_waste (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waste_record_id UUID REFERENCES waste_records(id) ON DELETE CASCADE,
  category_sipsn TEXT NOT NULL,
  weight_kg NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.5 Tabel `fleet` (Armada)

```sql
CREATE TABLE fleet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL,
  driver_name TEXT,
  capacity_kg NUMERIC(10,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','maintenance','retired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.6 Tabel `mou` (Perjanjian Transporter)

```sql
CREATE TABLE mou (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_name TEXT NOT NULL,
  contract_number TEXT UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expiring','expired','terminated')),
  fleet_ids UUID[],
  contact_person TEXT,
  phone TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.7 Tabel `complaints` (Aduan Warga)

```sql
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT UNIQUE NOT NULL,
  reporter_user_id UUID REFERENCES profiles(id),
  reporter_name TEXT NOT NULL,
  reporter_phone TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'baru' 
    CHECK (status IN ('baru','diterima','diproses','ditindaklanjuti','selesai','ditolak')),
  admin_response TEXT,
  responded_by UUID REFERENCES profiles(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_tracking ON complaints(tracking_number);
```

### 3.8 Tabel `incidental_events`

```sql
CREATE TABLE incidental_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('kerja_bakti','edukasi','pembersihan','lainnya')),
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  participants INTEGER DEFAULT 0,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photo_url TEXT,
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.9 Tabel `audit_log`

```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
```

---

## 4. Row Level Security (RLS)

> [!IMPORTANT]
> RLS adalah fitur kunci Supabase — setiap query otomatis difilter berdasarkan role user yang login. Ini menggantikan middleware permission check di backend tradisional.

### Contoh Policy untuk `waste_records`:

```sql
-- Enable RLS
ALTER TABLE waste_records ENABLE ROW LEVEL SECURITY;

-- Petugas: bisa INSERT data sendiri
CREATE POLICY "petugas_insert" ON waste_records
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('petugas','admin'))
  );

-- Petugas: bisa READ data sendiri
CREATE POLICY "petugas_read_own" ON waste_records
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('eksekutif','admin'))
  );

-- Admin: full access
CREATE POLICY "admin_full" ON waste_records
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Eksekutif: read-only semua data approved
CREATE POLICY "eksekutif_read" ON waste_records
  FOR SELECT TO authenticated
  USING (
    verification_status = 'approved' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'eksekutif')
  );
```

### Policy untuk `complaints` (Publik tanpa login):

```sql
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Siapapun bisa membuat aduan (termasuk anon via Edge Function)
CREATE POLICY "public_insert" ON complaints
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Siapapun bisa cek status aduan via tracking number (via Edge Function)
CREATE POLICY "public_read_tracking" ON complaints
  FOR SELECT TO anon
  USING (true); -- Filtered via Edge Function
```

---

## 5. Supabase Storage Buckets

```
simpah-storage/
├── complaint-photos/     ← foto aduan warga (public read)
├── waste-photos/         ← foto lampiran input lapangan (authenticated)
├── event-photos/         ← foto kegiatan insidental (authenticated)
├── mou-documents/        ← dokumen MoU PDF (admin only)
└── exports/              ← file export sementara (authenticated, auto-delete 24h)
```

### Storage Policy:
```sql
-- complaint-photos: siapapun bisa upload, semua bisa lihat
CREATE POLICY "complaint_photos_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'complaint-photos');

CREATE POLICY "complaint_photos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'complaint-photos');

-- waste-photos: hanya authenticated
CREATE POLICY "waste_photos_auth" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'waste-photos')
  WITH CHECK (bucket_id = 'waste-photos');
```

---

## 6. Edge Functions (Serverless Logic)

### 6.1 `generate-tracking-number`
Membuat nomor resi aduan unik (format: `ADU-YYMMDD-XXXX`).

### 6.2 `export-sipsn-csv`  
Generate file CSV yang formatnya sesuai standar upload SIPSN Kementerian LHK.

### 6.3 `export-intervention-pdf`
Generate PDF rekomendasi intervensi desa menggunakan library seperti `jsPDF`.

### 6.4 `batch-distribute`
Logika pembagian rata berat per hari untuk input akumulasi (batch).

### 6.5 `cron-mou-expiry`
Cron job harian untuk cek MoU yang akan expired dan update statusnya.

### 6.6 `sync-waste-records`
Endpoint untuk bulk upsert dari IndexedDB → Supabase saat device online.

---

## 7. Strategi Migrasi (Fase)

### Fase 1: Setup Fondasi (Minggu 1-2)
- [ ] Buat project Supabase baru
- [ ] Jalankan semua SQL schema di atas
- [ ] Setup RLS policies
- [ ] Setup Storage buckets
- [ ] Install `@supabase/supabase-js` di project Vite
- [ ] Buat `src/lib/supabase.js` (client init)

### Fase 2: Auth & Profiles (Minggu 2-3)
- [ ] Migrasi login dari IndexedDB ke Supabase Auth
- [ ] Buat flow sign-up / sign-in (email + password)
- [ ] Auto-create profile record via Database Trigger
- [ ] Migrasi RBAC permission check ke RLS
- [ ] Pertahankan akun demo untuk simulasi

### Fase 3: Data Layer Migration (Minggu 3-5)
- [ ] Buat `src/db/supabase-store.js` — API wrapper yang mirror `store.js`
- [ ] Implementasi dual-write: IndexedDB + Supabase
- [ ] Implementasi sync engine (`sync.js` → real Supabase sync)
- [ ] Migrasi per-modul: waste_records → locations → fleet → mou → complaints
- [ ] Upload foto ke Supabase Storage (ganti photo_url)

### Fase 4: Dashboard Realtime (Minggu 5-6)
- [ ] Subscribe Realtime untuk dashboard eksekutif
- [ ] Live update validasi data (status pending → approved)
- [ ] Live notification aduan baru masuk

### Fase 5: Edge Functions & Polish (Minggu 6-7)
- [ ] Deploy Edge Functions (export CSV, PDF, tracking number)
- [ ] Setup cron job MoU expiry
- [ ] End-to-end testing semua role
- [ ] Seed data demo di Supabase

---

## 8. Perubahan pada Frontend

### File yang Perlu Dimodifikasi:

| File | Perubahan |
|---|---|
| `package.json` | Tambah `@supabase/supabase-js` |
| `src/db/schema.js` | Tetap (untuk offline cache) |
| `src/db/store.js` | Buat versi baru `supabase-store.js` dengan API sama |
| `src/db/sync.js` | Ganti simulasi → real Supabase upsert |
| `src/pages/login.js` | Ganti IndexedDB auth → `supabase.auth.signInWithPassword()` |
| `src/utils/permissions.js` | Tambah helper `getCurrentUser()` dari Supabase session |
| Semua halaman input | Dual-write ke IndexedDB + queue sync ke Supabase |

### File Baru yang Dibuat:

| File | Fungsi |
|---|---|
| `src/lib/supabase.js` | Supabase client init |
| `src/db/supabase-store.js` | Data access layer untuk Supabase |
| `src/db/sync-engine.js` | Offline queue + conflict resolution |
| `supabase/migrations/*.sql` | SQL migration files |
| `supabase/functions/*` | Edge Functions |

---

## 9. Saran Strategis untuk Memaksimalkan Produk

> [!TIP]
> Berikut saran-saran yang saya rekomendasikan berdasarkan analisis prototype:

### 9.1 🔐 Keamanan & Autentikasi
- **OTP SMS Login** untuk petugas lapangan (Supabase Auth mendukung Twilio/MessageBird). Kader di pedesaan lebih familiar dengan SMS daripada email.
- **Session timeout** otomatis 8 jam untuk device mobile lapangan.
- **Device binding** — catat device ID saat login untuk audit trail yang lebih kuat.

### 9.2 📊 Database Views untuk Performa Dashboard
Buat **Materialized Views** di PostgreSQL untuk query dashboard yang berat:

```sql
-- View: Statistik harian per lokasi (untuk dashboard eksekutif)
CREATE MATERIALIZED VIEW mv_daily_stats AS
SELECT 
  record_date,
  location_id,
  type,
  category_sipsn,
  SUM(weight_kg) as total_weight,
  COUNT(*) as record_count
FROM waste_records
WHERE verification_status = 'approved'
GROUP BY record_date, location_id, type, category_sipsn;

-- Refresh via cron setiap 15 menit
```

### 9.3 🗺️ PostGIS untuk GIS yang Lebih Powerful
Aktifkan extension PostGIS di Supabase untuk:
- Query spatial: "Tampilkan semua TPS dalam radius 5km"
- Heatmap yang lebih akurat berbasis clustering geospasial
- Validasi otomatis: tolak input jika GPS user > 500m dari lokasi TPS terdaftar

```sql
-- Aktifkan PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tambah kolom geometry
ALTER TABLE locations ADD COLUMN geom GEOMETRY(Point, 4326);
UPDATE locations SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326);
```

### 9.4 📱 Push Notifications (Supabase + FCM)
- Notifikasi ke Admin saat ada aduan baru masuk
- Notifikasi ke Kader saat data mereka di-reject (perlu perbaikan)
- Reminder harian untuk Kader yang belum input data

### 9.5 🧮 Database Functions untuk Anti-Double-Counting
Buat PostgreSQL function yang menghitung total tonnase kabupaten dengan otomatis mengecualikan `source_type = 'fasilitas_lain'`:

```sql
CREATE OR REPLACE FUNCTION get_kabupaten_stats(start_date DATE, end_date DATE)
RETURNS TABLE (total_masuk NUMERIC, total_pilah NUMERIC, total_olah NUMERIC, 
               total_residu NUMERIC, recycle_rate NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(CASE WHEN type = 'masuk' AND source_type = 'langsung' THEN weight_kg ELSE 0 END),
    SUM(CASE WHEN type = 'pilah' THEN weight_kg ELSE 0 END),
    SUM(CASE WHEN type = 'olah' THEN weight_kg ELSE 0 END),
    SUM(CASE WHEN type = 'residu' THEN weight_kg ELSE 0 END),
    CASE WHEN SUM(CASE WHEN type = 'masuk' THEN weight_kg ELSE 0 END) > 0
      THEN ROUND((SUM(CASE WHEN type IN ('pilah','olah') THEN weight_kg ELSE 0 END) / 
            SUM(CASE WHEN type = 'masuk' THEN weight_kg ELSE 0 END)) * 100, 1)
      ELSE 0 END
  FROM waste_records 
  WHERE verification_status = 'approved' 
    AND record_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;
```

### 9.6 📋 Tambahan Tabel untuk Fitur Masa Depan

```sql
-- Notifikasi in-app
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity log (lebih ringan dari audit_log, untuk feed user)
CREATE TABLE activity_feed (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'input_sampah', 'aduan_baru', 'validasi', etc.
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 10. Modul AI & Forecasting (SIMPAH Intelligence)

> [!IMPORTANT]
> Ini adalah modul **nilai jual tertinggi** SIMPAH saat pitching ke Dinas. Mengubah SIMPAH dari sekadar "aplikasi pencatatan" menjadi **Sistem Pendukung Keputusan Cerdas**.

### 10.1 🔮 Fitur Forecasting Volume Sampah

**Tujuan:** Memprediksi volume sampah yang akan masuk ke TPS/TPA dalam 7, 14, dan 30 hari ke depan berdasarkan data historis.

**Metode:** Time-series forecasting menggunakan algoritma **Linear Regression + Seasonal Decomposition** yang berjalan di Edge Function (ringan, tidak perlu server ML khusus).

**Input data:**
- Data `waste_records` historis minimal 30 hari
- Variabel musiman: hari raya, hari pasar, hari libur nasional
- Tren pertumbuhan per wilayah

**Output yang ditampilkan di Dashboard:**

```
┌─────────────────────────────────────────────────┐
│  📊 Prediksi Volume Sampah — 30 Hari ke Depan   │
│                                                  │
│  Hari Ini:      432 kg  ████████████             │
│  Besok:         ~445 kg ████████████░            │
│  Minggu ini:  ~3.2 ton  ████████████░░░          │
│  Bulan ini:  ~13.8 ton  (proyeksi)               │
│                                                  │
│  ⚠️  Prediksi Lonjakan: Lebaran +2 hari          │
│  Estimasi volume: 2.1x normal (890 kg/hari)      │
│                                                  │
│  Rekomendasi: Siapkan armada tambahan H-1         │
└─────────────────────────────────────────────────┘
```

### 10.2 🤖 AI Chatbot Asisten Dinas (Gemini-powered)

**Tujuan:** Admin/Eksekutif bisa bertanya ke sistem menggunakan bahasa natural, tanpa perlu buka laporan satu per satu.

**Contoh pertanyaan yang bisa dijawab:**

| Pertanyaan User | Jawaban AI |
|---|---|
| *"Desa mana yang paling banyak timbulan bulan ini?"* | Langsung query DB + tampilkan ranking |
| *"Kapan jadwal MoU CV Bersih Lestari habis?"* | Cek tabel `mou` + beri peringatan |
| *"Berapa recycle rate Banjarnegara minggu ini?"* | Hitung dari `waste_records` + bandingkan tren |
| *"TPS mana yang datanya belum divalidasi?"* | Query `verification_status = pending` |
| *"Buat ringkasan laporan bulan April"* | Generate teks ringkasan otomatis |

**Arsitektur:**
```
User input (teks)
       ↓
Edge Function: ai-chat
       ↓
1. Parse intent (Gemini API)
2. Generate SQL query yang aman (read-only)
3. Jalankan query ke Supabase
4. Format hasil → Gemini API untuk narasi
       ↓
Jawaban dalam Bahasa Indonesia
```

**API yang digunakan:** Google Gemini 1.5 Flash (gratis hingga batas tertentu, sangat hemat biaya)

### 10.3 🚨 Deteksi Anomali Data Otomatis

**Tujuan:** Sistem secara otomatis mendeteksi data yang tidak wajar dan memberi alert ke Admin/Koordinator.

**Jenis anomali yang dideteksi:**

| Tipe Anomali | Contoh | Action |
|---|---|---|
| **Spike volume** | TPS tiba-tiba lapor 10x lipat dari biasanya | Flag untuk re-validasi |
| **Zero input** | Kader tidak input sama sekali selama 3 hari | Notifikasi ke koordinator |
| **GPS drift** | Input dari koordinat >2km dari TPS terdaftar | Auto-reject + alert |
| **Duplicate entry** | Input berat identik dalam 5 menit | Block + warning |
| **Ratio anomali** | Residu > Sampah Masuk (tidak mungkin secara fisik) | Flag otomatis |

**Implementasi:** Cron Edge Function yang berjalan setiap malam pukul 23:00 WIB.

### 10.4 📈 Analitik Prediktif Kapasitas TPA

**Tujuan:** Prediksi kapan TPA akan mencapai kapasitas maksimal berdasarkan tren pertumbuhan.

```
Capacity TPA Winong: 50.000 ton
Terisi saat ini:     38.200 ton (76.4%)
Laju masuk rata-rata: 42 ton/bulan

⚠️  Estimasi PENUH: ± 28 bulan (September 2028)

Rekomendasi:
→ Tingkatkan target pengolahan mandiri 15%
→ Evaluasi kapasitas TPS3R Purwareja
→ Pertimbangkan site TPA cadangan
```

### 10.5 🗺️ Optimasi Rute Pengangkutan (Smart Routing)

**Tujuan:** Rekomendasi rute optimal untuk armada truk berdasarkan prioritas TPS yang paling penuh.

**Input:**
- Volume sampah tiap TPS hari ini
- Jumlah armada tersedia
- Kapasitas tiap kendaraan
- Jarak antar TPS (via PostGIS)

**Output:** Daftar urutan TPS yang harus dikunjungi tiap truk, diurutkan by prioritas volume + efisiensi jarak.

---

### 10.6 Database Schema untuk AI/Forecasting

```sql
-- Tabel hasil prediksi (cache dari Edge Function)
CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type TEXT NOT NULL 
    CHECK (prediction_type IN ('volume_forecast','tpa_capacity','recycle_rate','anomaly_score')),
  target_entity TEXT, -- 'kabupaten', location_id, atau wilayah
  target_date DATE NOT NULL,
  predicted_value NUMERIC(12,2),
  confidence_score NUMERIC(5,4), -- 0.00 - 1.00
  model_version TEXT DEFAULT 'v1',
  input_summary JSONB, -- parameter yang dipakai
  generated_at TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ -- kapan prediksi ini kadaluarsa
);

CREATE INDEX idx_predictions_type_date ON ai_predictions(prediction_type, target_date);

-- Tabel log anomali terdeteksi
CREATE TABLE anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  entity_type TEXT NOT NULL, -- 'waste_record', 'location', 'user'
  entity_id UUID,
  description TEXT NOT NULL,
  detected_value NUMERIC,
  expected_range_min NUMERIC,
  expected_range_max NUMERIC,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_anomaly_severity ON anomaly_alerts(severity, is_resolved);

-- Tabel riwayat percakapan chatbot
CREATE TABLE ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  sql_executed TEXT, -- SQL yang dijalankan AI (untuk audit)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 10.7 Edge Functions AI

| Function | Trigger | Deskripsi |
|---|---|---|
| `ai-forecast-volume` | Cron harian 06:00 WIB | Generate prediksi volume 30 hari ke depan per lokasi |
| `ai-detect-anomaly` | Cron malam 23:00 WIB | Scan semua record hari ini, flag anomali |
| `ai-chat` | On-demand (user input) | NL query ke Gemini → SQL → hasil |
| `ai-tpa-capacity` | Cron mingguan | Update proyeksi kapasitas TPA |
| `ai-routing` | On-demand | Generate rekomendasi rute armada |

### 10.8 Estimasi Biaya AI

| Layanan | Volume/bulan | Estimasi Biaya |
|---|---|---|
| **Gemini 1.5 Flash** | ~5.000 query chatbot | **Gratis** (hingga 15 RPM di free tier) |
| **Edge Functions** | ~3.000 invocations cron | **Gratis** (500K/bulan di Supabase free) |
| **Total AI Cost** | | **~$0 untuk fase testing** |

> [!TIP]
> Mulai dengan Gemini 1.5 Flash yang gratis untuk chatbot dan forecasting sederhana. Upgrade ke Gemini Pro atau model ML khusus hanya ketika data historis sudah cukup banyak (>6 bulan data produksi).

### 10.9 Roadmap Implementasi AI

```
Phase A (setelah backend stabil, ~Bulan 3):
  ✓ Tabel ai_predictions & anomaly_alerts
  ✓ Deteksi anomali dasar (GPS drift, duplicate, zero input)
  ✓ Forecasting sederhana (moving average 7 hari)

Phase B (~Bulan 4-5):
  ✓ Chatbot Gemini (NL → SQL → jawaban)
  ✓ Forecasting seasonal (hari raya, hari pasar)
  ✓ Dashboard visualisasi prediksi

Phase C (~Bulan 6+):
  ✓ Proyeksi kapasitas TPA
  ✓ Smart routing rekomendasi armada
  ✓ AI summary laporan bulanan otomatis
```

### 9.7 💰 Estimasi Biaya Supabase

| Tier | Harga/bulan | Cocok Untuk |
|---|---|---|
| **Free** | $0 | Development & pilot (1 kabupaten, <50 user aktif) |
| **Pro** | $25 | Production (8GB DB, 100GB storage, daily backups) |
| **Team** | $599 | Multi-kabupaten, SLA, SOC2 compliance |

> [!NOTE]
> Untuk pilot Kabupaten Banjarnegara dengan ~50 petugas dan ~10 lokasi TPS, **tier Pro ($25/bulan ≈ Rp400.000/bulan)** sudah sangat cukup. Ini jauh lebih hemat daripada menyewa VPS + manage PostgreSQL sendiri.

### 9.8 💰 Total Estimasi Biaya (Termasuk AI)

| Komponen | Fase Testing (Free) | Fase Produksi |
|---|---|---|
| Supabase DB + Auth | $0 | $25/bulan |
| Google Gemini API | $0 | $0–$10/bulan |
| Vercel/Netlify (hosting) | $0 | $0 (free tier) |
| **Total** | **$0/bulan** | **~$25–35/bulan** |

---

## 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Koneksi internet tidak stabil di lapangan | Data hilang | Offline-first: IndexedDB sebagai primary, sync saat online |
| Conflict data saat sync | Data tidak konsisten | Last-write-wins + audit log untuk traceability |
| Supabase downtime | Sistem tidak bisa diakses | Offline mode tetap jalan, data di-queue |
| Biaya membengkak | Budget overrun | Monitor usage di Supabase dashboard, set alert |
| Migrasi data demo | Kehilangan konteks simulasi | Buat SQL seed script terpisah untuk data demo |

---

## 11. Kriteria Sukses (Definition of Done)

### Core Backend
- [ ] Semua 5 role (warga, kader, petugas angkut, eksekutif, admin) bisa login via Supabase Auth
- [ ] Input data sampah dari PWA mobile tersimpan ke Supabase (atau queue offline)
- [ ] Dashboard eksekutif menampilkan data real dari PostgreSQL
- [ ] Peta GIS menampilkan lokasi TPS dari database
- [ ] Aduan warga tersimpan + foto terupload ke Storage
- [ ] Export CSV SIPSN mengambil data dari Supabase
- [ ] Validasi data (approve/reject) bekerja dengan RLS
- [ ] Audit log mencatat semua perubahan data
- [ ] Aplikasi tetap berfungsi saat offline (degraded mode)

### AI & Forecasting
- [ ] Dashboard menampilkan prediksi volume 7 hari ke depan
- [ ] Anomali terdeteksi otomatis + muncul di panel admin
- [ ] Chatbot Gemini bisa menjawab minimal 5 jenis pertanyaan operasional
- [ ] Proyeksi kapasitas TPA tersedia di dashboard eksekutif
- [ ] Semua AI query tercatat di `ai_chat_history` untuk audit

---

## 12. Ringkasan Nilai Jual (Pitch Points)

> Gunakan ini saat presentasi ke Dinas:

| Fitur | Nilai untuk Dinas |
|---|---|
| **Backend Supabase** | Data terpusat, aman, tidak bisa dimanipulasi |
| **Offline-first PWA** | Kader di blank-spot tetap bisa input data |
| **RLS + Audit Log** | Setiap perubahan data tercatat siapa, kapan, di mana |
| **AI Forecasting** | Dinas bisa antisipasi lonjakan sampah sebelum terjadi |
| **AI Chatbot** | Tanya-jawab data tanpa perlu buka laporan satu-satu |
| **Deteksi Anomali** | Fraud prevention otomatis — data manipulasi langsung ketahuan |
| **Export SIPSN** | Laporan ke Kementerian LHK tinggal klik, tanpa entri ulang |
| **Biaya rendah** | Hanya ~Rp400.000/bulan untuk produksi penuh |

---

*Dokumen v2.1 — Diperbarui dengan modul AI & Forecasting. Silakan berikan feedback sebelum implementasi dimulai.*
