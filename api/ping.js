export const config = {
  runtime: 'edge', // Use lightweight Edge runtime
};

export default async function handler(request) {
  // Try to read Supabase credentials from environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase credentials in environment variables' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    // Perform a lightweight query on the locations table
    const res = await fetch(`${supabaseUrl}/rest/v1/locations?limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      return new Response(JSON.stringify({ 
        status: 'success', 
        message: 'Database is awake and active!',
        sample: data[0]?.name || 'No records found'
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    } else {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: `Ping failed: ${errText}` }), {
        status: res.status,
        headers: { 'content-type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
