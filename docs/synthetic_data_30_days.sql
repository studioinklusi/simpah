-- Script Generator Data Sintetis (Pastikan tidak ada tanggal kosong sampai hari ini)
-- Copas dan jalankan ini di Supabase SQL Editor.

DO $$
DECLARE
  v_loc_id UUID;
  v_user_id UUID;
  v_date DATE;
  v_weight NUMERIC;
  v_type TEXT;
  v_cat TEXT;
  v_rand INT;
  v_record_id UUID;
  v_day_offset INT;
  v_records_per_day INT;
BEGIN
  -- (Opsional) Hapus data dummy lama jika ingin membuat data benar-benar bersih dari awal.
  -- DELETE FROM sorted_waste;
  -- DELETE FROM waste_records;

  -- Looping dari 59 hari yang lalu sampai hari ini (total 60 hari)
  FOR v_day_offset IN REVERSE 59..0 LOOP
    v_date := CURRENT_DATE - v_day_offset;
    
    -- Generate 25 - 35 transaksi per hari secara acak
    v_records_per_day := floor(random() * 10 + 25);
    
    FOR i IN 1..v_records_per_day LOOP
      -- 1. Berat acak antara 500 kg hingga 1200 kg per transaksi (supaya total harian capai 20rb - 30rb kg)
      v_weight := floor(random() * 700 + 500);
      
      -- 2. Tipe acak dengan pembobotan
      v_rand := floor(random() * 100);
      IF v_rand < 50 THEN
        v_type := 'campur';
        v_cat := 'SM'; -- Sisa Makanan
      ELSIF v_rand < 65 THEN
        v_type := 'pilah';
        v_cat := 'PL'; -- Plastik
      ELSIF v_rand < 80 THEN
        v_type := 'pilah';
        v_cat := 'KK'; -- Kertas
      ELSIF v_rand < 90 THEN
        v_type := 'residu';
        v_cat := 'LN'; -- Lainnya
      ELSE
        v_type := 'olah';
        v_cat := 'KR'; -- Kayu Ranting
      END IF;
      
      -- 3. Pilih Lokasi TPS secara acak
      SELECT id INTO v_loc_id FROM locations ORDER BY random() LIMIT 1;
      
      -- 4. Pilih Petugas secara acak (atau gunakan fallback jika profile belum ada)
      SELECT id INTO v_user_id FROM profiles WHERE role = 'petugas' ORDER BY random() LIMIT 1;
      IF v_user_id IS NULL THEN
         SELECT id INTO v_user_id FROM profiles ORDER BY random() LIMIT 1;
      END IF;

      -- 5. Insert data ke tabel utama
      INSERT INTO waste_records (location_id, type, category_sipsn, weight_kg, record_date, user_id, verification_status, created_at)
      VALUES (v_loc_id, v_type, v_cat, v_weight, v_date, v_user_id, 'approved', v_date + (random() * interval '12 hours') + interval '6 hours')
      RETURNING id INTO v_record_id;

      -- 6. Jika jenisnya "pilah", distribusikan ke tabel komposisi
      IF v_type = 'pilah' THEN
        INSERT INTO sorted_waste (waste_record_id, category_sipsn, weight_kg)
        VALUES 
          (v_record_id, 'KK', v_weight * 0.4),
          (v_record_id, 'PL', v_weight * 0.3),
          (v_record_id, 'LG', v_weight * 0.2),
          (v_record_id, 'KC', v_weight * 0.1);
      END IF;

    END LOOP;
  END LOOP;
END $$;
