import httpx, os, random, json
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# Step 1: Cek kolom yang ada di tabel
print("=== Step 1: Cek struktur tabel ===")

# Insert dengan minimal field dulu untuk lihat error
test_record = {'weight_kg': 100}
resp = httpx.post(f"{url}/rest/v1/waste_records", headers=headers, json=test_record, timeout=10)
print(f"Minimal insert status: {resp.status_code}")
print(f"Response: {resp.text[:300]}")

if resp.status_code == 201:
    # Berhasil! Lihat kolom apa saja yang dikembalikan
    data = resp.json()
    print(f"\nKolom yang ada: {list(data[0].keys()) if isinstance(data, list) else list(data.keys())}")
    
    # Hapus data test
    record_id = data[0]['id'] if isinstance(data, list) else data['id']
    del_resp = httpx.delete(
        f"{url}/rest/v1/waste_records?id=eq.{record_id}",
        headers=headers, timeout=10
    )
    print(f"Cleanup test record: {del_resp.status_code}")

print("\n=== Step 2: Insert data dummy 14 hari ===")
success_count = 0

for i in range(14):
    d = datetime.now() - timedelta(days=13 - i)
    base_weight = 150 + (i * 5)
    weight = base_weight + random.randint(-20, 30)
    
    record = {
        'weight_kg': weight,
        'type': random.choice(['masuk', 'campur', 'pilah']),
        'created_at': d.strftime('%Y-%m-%dT08:00:00+07:00'),
        'verification_status': 'approved'
    }
    
    resp = httpx.post(f"{url}/rest/v1/waste_records", headers=headers, json=record, timeout=10)
    date_str = record['created_at'][:10]
    
    if resp.status_code == 201:
        success_count += 1
        print(f"  OK  {date_str} - {weight} kg")
    else:
        print(f"  ERR {date_str} - {weight} kg - {resp.status_code}: {resp.text[:200]}")

print(f"\nSelesai! {success_count}/14 records berhasil dimasukkan.")
