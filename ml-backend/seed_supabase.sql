-- ============================================================
-- SEED DATA untuk SIMPAH Prophet ML Testing
-- ============================================================

INSERT INTO waste_records (id, type, weight_kg, category_sipsn, created_at, verification_status, user_id)
SELECT 
    gen_random_uuid(),
    v.type,
    v.weight_kg::numeric,
    v.category_sipsn,
    v.created_at::timestamptz,
    'approved',
    (SELECT id FROM profiles WHERE username = 'kader1' LIMIT 1)
FROM (VALUES
    ('masuk',  '185.5', 'SM',  (NOW() - INTERVAL '30 days')::text),
    ('campur', '210.0', 'CMP', (NOW() - INTERVAL '29 days')::text),
    ('masuk',  '175.2', 'SM',  (NOW() - INTERVAL '28 days')::text),
    ('campur', '195.8', 'CMP', (NOW() - INTERVAL '27 days')::text),
    ('masuk',  '220.0', 'SM',  (NOW() - INTERVAL '26 days')::text),
    ('pilah',  '45.5',  'KK',  (NOW() - INTERVAL '26 days')::text),
    ('campur', '190.0', 'CMP', (NOW() - INTERVAL '25 days')::text),
    ('masuk',  '230.0', 'SM',  (NOW() - INTERVAL '23 days')::text),
    ('campur', '215.5', 'CMP', (NOW() - INTERVAL '22 days')::text),
    ('masuk',  '200.0', 'SM',  (NOW() - INTERVAL '21 days')::text),
    ('pilah',  '52.0',  'PLH', (NOW() - INTERVAL '21 days')::text),
    ('campur', '225.0', 'CMP', (NOW() - INTERVAL '20 days')::text),
    ('masuk',  '240.8', 'SM',  (NOW() - INTERVAL '19 days')::text),
    ('olah',   '38.5',  'KR',  (NOW() - INTERVAL '19 days')::text),
    ('campur', '205.0', 'CMP', (NOW() - INTERVAL '18 days')::text),
    ('masuk',  '255.0', 'SM',  (NOW() - INTERVAL '16 days')::text),
    ('campur', '230.5', 'CMP', (NOW() - INTERVAL '15 days')::text),
    ('masuk',  '245.0', 'SM',  (NOW() - INTERVAL '14 days')::text),
    ('pilah',  '60.0',  'KK',  (NOW() - INTERVAL '14 days')::text),
    ('campur', '218.0', 'CMP', (NOW() - INTERVAL '13 days')::text),
    ('masuk',  '265.5', 'SM',  (NOW() - INTERVAL '12 days')::text),
    ('olah',   '42.0',  'KR',  (NOW() - INTERVAL '12 days')::text),
    ('campur', '235.0', 'CMP', (NOW() - INTERVAL '11 days')::text),
    ('residu', '15.5',  'LN',  (NOW() - INTERVAL '11 days')::text),
    ('masuk',  '270.0', 'SM',  (NOW() - INTERVAL '9 days')::text),
    ('campur', '248.0', 'CMP', (NOW() - INTERVAL '8 days')::text),
    ('masuk',  '260.5', 'SM',  (NOW() - INTERVAL '7 days')::text),
    ('pilah',  '68.5',  'PLH', (NOW() - INTERVAL '7 days')::text),
    ('campur', '255.0', 'CMP', (NOW() - INTERVAL '6 days')::text),
    ('masuk',  '275.0', 'SM',  (NOW() - INTERVAL '5 days')::text),
    ('olah',   '50.0',  'KR',  (NOW() - INTERVAL '5 days')::text),
    ('campur', '265.0', 'CMP', (NOW() - INTERVAL '4 days')::text),
    ('masuk',  '280.8', 'SM',  (NOW() - INTERVAL '3 days')::text),
    ('residu', '18.0',  'LN',  (NOW() - INTERVAL '3 days')::text),
    ('masuk',  '290.0', 'SM',  (NOW() - INTERVAL '2 days')::text),
    ('campur', '270.5', 'CMP', (NOW() - INTERVAL '2 days')::text),
    ('pilah',  '75.0',  'KK',  (NOW() - INTERVAL '1 day')::text),
    ('masuk',  '295.0', 'SM',  (NOW() - INTERVAL '1 day')::text)
) AS v(type, weight_kg, category_sipsn, created_at);

-- Verifikasi hasil
SELECT 
    DATE(created_at) as tanggal,
    COUNT(*) as records,
    ROUND(SUM(weight_kg)::numeric, 1) as total_kg
FROM waste_records 
WHERE created_at >= NOW() - INTERVAL '35 days'
GROUP BY tanggal 
ORDER BY tanggal ASC;
