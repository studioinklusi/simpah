# Implementation Plan — SIMPAH v2
## Dari Prototype ke Full-Stack Supabase + AI

**Referensi:** PRD v2.2 (`PRD_SIMPAH_v2_Supabase.md`)
**Tanggal:** 5 Mei 2026
**Total Durasi:** ~14 Minggu (7 Sprint × 2 Minggu)

---

## Struktur Folder

```
U:\Project\
├── simpah/                  ← PROTOTYPE (read-only, referensi saja)
└── simpah-rilis v1/         ← PROJECT AKTIF (semua kode baru di sini)
    ├── docs/
    ├── src/
    │   ├── lib/supabase.js           ← [BARU] Supabase client
    │   ├── db/
    │   │   ├── schema.js             ← tetap (offline cache)
    │   │   ├── store.js              ← tetap (fallback offline)
    │   │   ├── supabase-store.js     ← [BARU] data layer Supabase
    │   │   └── sync-engine.js        ← [BARU] offline sync
    │   └── ...
    ├── supabase/
    │   ├── migrations/               ← [BARU] SQL schema files
    │   └── functions/                ← [BARU] Edge Functions
    ├── .env                          ← [BARU] credentials (git-ignored)
    └── .gitignore                    ← [UPDATE] tambah .env
```

---

## SPRINT 1 — Setup Project & Supabase (Minggu 1-2)

**Goal:** Project rilis siap, Supabase terhubung, schema terbuat.

### 1.1 Copy Prototype → Project Rilis

```powershell
robocopy "U:\Project\simpah" "U:\Project\simpah-rilis v1" /E /XD node_modules .git .github
cd "U:\Project\simpah-rilis v1"
del "Catatan kritis system monitoring.docx"
npm install
npm install @supabase/supabase-js
```

### 1.2 Setup Git & .gitignore

```gitignore
node_modules/
dist/
.env
.env.local
.env.*.local
*.log
```

```powershell
git init
git add -A
git commit -m "Initial: SIMPAH v2 based on prototype"
```

### 1.3 Perbaiki vite.config.js

```js
// UBAH base path dari prototype ke production
base: '/',
// UBAH scope dan start_url di manifest PWA juga
```

### 1.4 Buat Akun & Project Supabase

```
1. Daftar di supabase.com (gratis)
2. New Project → "simpah-dev" → Region: Singapore
3. Catat dari Settings > API:
   - Project URL
   - anon public key
```

### 1.5 Buat .env & Supabase Client

File `.env`:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

File `src/lib/supabase.js`:
```js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 1.6 Jalankan SQL Schema

Buka Supabase Dashboard → SQL Editor → jalankan **berurutan** sesuai PRD v2.2:

```
 1. locations          (3.1)
 2. fleet              (3.3)
 3. profiles           (3.4) — ref: auth.users, locations
 4. waste_records      (3.5) — ref: profiles, locations, fleet
 5. sorted_waste       (3.6) — ref: waste_records
 6. mou                (3.7)
 7. mou_fleet          (3.7) — junction table
 8. complaints         (3.8) — ref: profiles
 9. incidental_events  (3.9) — ref: profiles
10. audit_log          (3.10) — ref: profiles
11. notifications      (9.6) — ref: profiles
12. activity_feed      (9.6) — ref: profiles
13. ai_predictions     (10.6)
14. anomaly_alerts     (10.6) — ref: profiles
15. ai_chat_history    (10.6) — ref: profiles
```

### 1.7 Setup RLS + Profile Trigger

Jalankan semua RLS policies dari PRD v2.2 Section 4, lalu:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'),
    COALESCE(new.raw_user_meta_data->>'role', 'warga')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 1.8 Buat 7 Akun Demo

Via Supabase Dashboard → Authentication → Add User:

| Email | Password | Update di `profiles` |
|---|---|---|
| `warga1@simpah.dev` | `warga123` | role:`warga` |
| `kader1@simpah.dev` | `kader123` | role:`petugas`, job_type:`kader` |
| `petugas1@simpah.dev` | `petugas123` | role:`petugas`, job_type:`angkut` |
| `operator1@simpah.dev` | `operator123` | role:`petugas`, job_type:`operator_tps` |
| `koordinator1@simpah.dev` | `koordinator123` | role:`petugas`, job_type:`koordinator` |
| `eksekutif1@simpah.dev` | `eksekutif123` | role:`eksekutif` |
| `admin1@simpah.dev` | `admin123` | role:`admin` |

### 1.9 Seed Data Demo

Konversi `src/db/seed.js` → SQL INSERT: 10 lokasi, 4 armada, 3 MoU + relasi `mou_fleet`.

### Checklist Sprint 1

- [ ] Folder `simpah-rilis v1` berisi source code
- [ ] `npm run dev` berjalan
- [ ] `.env` ada, `.gitignore` include `.env`
- [ ] `vite.config.js` base path = `'/'`
- [ ] Git repo + commit pertama
- [ ] 15 tabel terbuat di Supabase
- [ ] RLS policies aktif
- [ ] Profile trigger berfungsi
- [ ] 7 akun demo terdaftar
- [ ] Seed data terisi
- [ ] Test: `supabase.from('locations').select('*')` OK di console

---

## SPRINT 2 — Migrasi Auth Login (Minggu 3-4)

**Goal:** Login/logout via Supabase Auth.

### 2.1 Modifikasi Login

File: `src/pages/login.js`

```js
import { supabase } from '../lib/supabase.js';

async function handleLogin(username, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${username}@simpah.dev`,
    password: password
  });
  if (error) { showToast('Login gagal', 'error'); return null; }

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', data.user.id).single();

  sessionStorage.setItem('simpah_user', JSON.stringify(profile));
  return profile;
}
```

### 2.2 Session Management

```js
// src/utils/helpers.js
export async function getCurrentUser() {
  const cached = sessionStorage.getItem('simpah_user');
  if (cached) return JSON.parse(cached);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  if (profile) sessionStorage.setItem('simpah_user', JSON.stringify(profile));
  return profile;
}

export async function logout() {
  await supabase.auth.signOut();
  sessionStorage.removeItem('simpah_user');
  window.location.hash = '/login';
}
```

### Checklist Sprint 2

- [ ] Login semua 7 akun berhasil
- [ ] Quick login buttons berfungsi
- [ ] Session persist setelah refresh
- [ ] Logout bersih + redirect
- [ ] Halaman protected → redirect jika belum login

---

## SPRINT 3 — Data Layer: Tabel Simpel (Minggu 5-6)

**Goal:** locations, fleet, mou dari Supabase.

### 3.1 Buat supabase-store.js

API identik `store.js`: `getAllLocations`, `addLocation`, `updateLocation`, `deleteLocation`, `getAllFleet`, `addFleet`, `getAllMou`, `addMou`, `getAllUsers`.

### 3.2 Update Import

Ganti import di `masterdata.js`, `mou.js`, `gis.js` dari `store.js` → `supabase-store.js`.

### Checklist Sprint 3

- [ ] Peta GIS menampilkan lokasi dari Supabase
- [ ] Master Data CRUD → Supabase
- [ ] MoU CRUD → Supabase

---

## SPRINT 4 — Waste Records + Offline Sync (Minggu 7-8)

**Goal:** Input lapangan → dual-write + sync engine.

### 4.1 Dual-Write Strategy

```js
// 1. SELALU simpan ke IndexedDB (instant)
// 2. Kirim ke Supabase jika online
// 3. Jika offline → sync nanti via sync-engine.js
```

### 4.2 Sync Engine

```js
// src/db/sync-engine.js
// - syncPendingRecords(): upsert unsynced records ke Supabase
// - Auto-trigger saat: online event, setiap 30 detik
```

### 4.3 Validasi

```js
// updateWasteRecordStatus(id, 'approved'|'rejected', notes, userId)
```

### Checklist Sprint 4

- [ ] Input masuk/pilah/olah/residu → Supabase
- [ ] Offline input → queue → sync saat online
- [ ] Validasi approve/reject → Supabase
- [ ] Dashboard baca dari Supabase

---

## SPRINT 5 — Complaints, Storage & Realtime (Minggu 9-10)

**Goal:** Aduan + foto + live dashboard.

### 5.1 Storage Buckets

| Bucket | Access |
|---|---|
| `complaint-photos` | Public |
| `waste-photos` | Authenticated |
| `event-photos` | Authenticated |
| `exports` | Authenticated |

### 5.2 Realtime Subscriptions

- `waste_records` pending → notifikasi validasi
- `complaints` baru → notifikasi admin

### Checklist Sprint 5

- [ ] Aduan tersimpan ke Supabase
- [ ] Foto terupload ke Storage
- [ ] Cek tracking via Edge Function
- [ ] Dashboard live update

---

## SPRINT 6 — Edge Functions & AI (Minggu 11-12)

**Goal:** Export SIPSN, deteksi anomali, chatbot.

### 6.1 Edge Functions

| Function | Deskripsi |
|---|---|
| `check-tracking` | Cek aduan by tracking number (publik) |
| `export-sipsn-csv` | Generate CSV format SIPSN |
| `cron-mou-expiry` | Auto-update MoU expired |
| `ai-detect-anomaly` | GPS drift, spike, zero input |
| `ai-chat` | Chatbot Gemini NL → SQL → jawaban |

### 6.2 Deploy

```powershell
supabase secrets set GEMINI_API_KEY=AIzaSy...
supabase functions deploy <function-name>
```

### Checklist Sprint 6

- [ ] Export SIPSN CSV berjalan
- [ ] Deteksi anomali berjalan
- [ ] Chatbot jawab 3 pertanyaan
- [ ] Cron MoU expiry otomatis

---

## SPRINT 7 — Forecasting & Deploy (Minggu 13-14)

**Goal:** Forecasting, polish, deploy production.

### 7.1 Forecasting

File `src/utils/forecasting.js`: Moving average 7 hari + seasonal adjustment (Senin +20%, Minggu -20%).

### 7.2 Deploy ke Vercel

```powershell
cd "U:\Project\simpah-rilis v1"
npm run build
vercel --prod
```

### 7.3 Final Testing

| Test | Metode |
|---|---|
| Login 7 role | Manual |
| Offline → sync | Chrome: Network Offline |
| PWA install | Mobile Chrome |
| Realtime | 2 tab bersamaan |
| SIPSN export | Download + verifikasi CSV |
| AI chatbot | 5 pertanyaan berbeda |
| Forecasting | Grafik prediksi 7 hari |

### Checklist Sprint 7

- [ ] Forecasting tampil di dashboard
- [ ] Anomali alert di admin panel
- [ ] Chatbot terintegrasi
- [ ] Build production OK
- [ ] Deploy Vercel berhasil
- [ ] 7 akun berfungsi di production
- [ ] Offline mode OK di mobile
- [ ] PWA installable

---

## Ringkasan

| Sprint | Minggu | Deliverable |
|---|---|---|
| 1 | 1-2 | Setup project + Supabase schema + 7 akun |
| 2 | 3-4 | Auth login/logout via Supabase |
| 3 | 5-6 | locations, fleet, mou dari Supabase |
| 4 | 7-8 | Waste records + offline sync |
| 5 | 9-10 | Aduan + foto + realtime |
| 6 | 11-12 | Edge Functions + AI dasar |
| 7 | 13-14 | Forecasting + deploy |

---

## Checklist Hari Pertama (~3-4 jam)

```
[ ] 1. robocopy prototype → simpah-rilis v1
[ ] 2. npm install + npm install @supabase/supabase-js
[ ] 3. Buat .gitignore
[ ] 4. Perbaiki vite.config.js (base: '/')
[ ] 5. git init && commit
[ ] 6. Buat akun Supabase → new project
[ ] 7. Buat .env + src/lib/supabase.js
[ ] 8. Jalankan 15 SQL schema
[ ] 9. Buat 7 akun demo + update profiles
[ ] 10. npm run dev → test koneksi
```
