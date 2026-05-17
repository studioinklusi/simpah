import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, context } = await req.json();

    // Pastikan prompt dikirim
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Ambil API Key dari environment variables Supabase atau gunakan default
    const QWEN_API_KEY = Deno.env.get('QWEN_API_KEY') || 'sk-80106e319b5e48e88f08044d462ec056';
    
    if (!QWEN_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'AI API Key is not configured in Edge Function.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Bangun payload untuk Qwen API
    const systemInstruction = `Kamu adalah Asisten AI untuk SIMPAH (Sistem Informasi Manajemen Pengelolaan Sampah). 
Tugasmu adalah membantu Kepala Dinas / Eksekutif untuk mendapatkan ringkasan data sampah.
ATURAN SANGAT PENTING:
1. JANGAN PERNAH menyarankan kode SQL, database, atau hal teknis programming lainnya kepada pengguna!
2. Jika pengguna meminta data yang tidak ada di konteks, katakan dengan sopan bahwa Anda hanya memiliki akses ke ringkasan 30 hari terakhir, lalu sarankan mereka menggunakan menu "Laporan & Export" di sistem SIMPAH.
3. FOKUS PADA TOPIK: HANYA JAWAB pertanyaan yang berkaitan dengan pengelolaan sampah, lingkungan, aplikasi SIMPAH, atau analisis data yang diberikan. Jika ditanya hal di luar topik (seperti coding, matematika umum, dll), tolaklah dengan sangat sopan, empati, dan minta maaf bahwa Anda dirancang khusus hanya untuk membantu operasional SIMPAH.
4. Gunakan bahasa yang mudah dimengerti, non-teknis, sopan, dan ringkas.`;

    const requestBody = {
      model: "qwen-plus",
      messages: [
        {
          role: "system",
          content: systemInstruction
        },
        {
          role: "user",
          content: `[Konteks Data Saat Ini]:\n${context || 'Tidak ada konteks tambahan.'}\n\n[Pertanyaan]:\n${prompt}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    };

    // Panggil Qwen API
    const response = await fetch('https://llm-sewnoscimg4kxumk.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal memanggil API AI');
    }

    // Ekstrak teks balasan dari struktur respons Qwen
    const replyText = data.choices?.[0]?.message?.content || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";

    return new Response(JSON.stringify({ reply: replyText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
