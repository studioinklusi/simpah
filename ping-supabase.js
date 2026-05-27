import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';

for (const line of lines) {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
    if (key === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env.');
  process.exit(1);
}

console.log(`Pinging Supabase at: ${supabaseUrl}`);

try {
  const response = await fetch(`${supabaseUrl}/rest/v1/locations?limit=1`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Supabase is active and query succeeded!');
    console.log('Sample data fetched:', data[0]?.name || 'No locations found');
  } else {
    console.error(`❌ Request failed with status ${response.status}:`, await response.text());
  }
} catch (error) {
  console.error('❌ Network error connecting to Supabase:', error.message);
}
