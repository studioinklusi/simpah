import random
import uuid
from datetime import datetime, timedelta

SIPSN_CODES = ['SM', 'KR', 'KK', 'PL', 'LG', 'KT', 'KL', 'KC', 'LN']

def random_between(min_val, max_val):
    return min_val + random.random() * (max_val - min_val)

def generate_sql(days=60, records_per_day=2):
    now = datetime.now()
    
    sql_statements = []
    sql_statements.append("-- Seed data for waste_records")
    sql_statements.append("INSERT INTO waste_records (id, type, category_sipsn, weight_kg, lat, lng, location_id, location_name, user_id, user_name, is_incidental, notes, created_at, record_date, verification_status) VALUES")
    
    values = []
    for i in range(days):
        date = now - timedelta(days=i)
        
        for _ in range(records_per_day):
            rtype = random.choice(['masuk', 'masuk', 'masuk', 'pilah', 'pilah', 'residu'])
            category = random.choice(SIPSN_CODES)
            
            weight_ranges = {
                'masuk': (50, 800),
                'pilah': (10, 200),
                'residu': (20, 300)
            }
            min_w, max_w = weight_ranges[rtype]
            weight_kg = round(random_between(min_w, max_w), 1)
            
            date_str = date.strftime('%Y-%m-%d')
            created_at = date.replace(hour=random.randint(6, 17), minute=random.randint(0, 59)).isoformat()
            
            uid = str(uuid.uuid4())
            is_incidental = 'true' if random.random() < 0.08 else 'false'
            
            val = f"('{uid}', '{rtype}', '{category}', {weight_kg}, -7.3953, 109.6944, 'loc-01', 'TPS3R Banjarnegara', 'usr-01', 'Warga Banjarnegara', {is_incidental}, 'Generated for ML forecasting demo', '{created_at}', '{date_str}', 'approved')"
            values.append(val)
            
    sql_statements.append(",\n".join(values) + ";")
    
    with open("seed_waste_records.sql", "w") as f:
        f.write("\n".join(sql_statements))
        
    print("Generated seed_waste_records.sql")

if __name__ == "__main__":
    generate_sql()
