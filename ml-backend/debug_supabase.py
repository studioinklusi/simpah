import httpx, os
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

# Try inserting one record with more fields and see the error
import json

record = {
    'weight_kg': 100,
    'type': 'masuk',
    'created_at': '2026-05-01T08:00:00+07:00',
    'created_by': 'system-seed',
    'synced': True,
    'verification_status': 'approved'
}

resp = httpx.post(f"{url}/rest/v1/waste_records", headers=headers, json=record, timeout=10)
print(f"Status: {resp.status_code}")
print(f"Response: {resp.text}")

# Also try to get current columns
print("\n--- Checking existing data ---")
resp2 = httpx.get(f"{url}/rest/v1/waste_records?limit=1", headers=headers, timeout=10)
print(f"GET Status: {resp2.status_code}")
print(f"GET Response: {resp2.text[:500]}")
