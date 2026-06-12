import { supabase } from './supabase.js';
import { getAllWasteRecords } from '../db/store.js';

/**
 * Mengirim pesan ke AI Assistant via Supabase Edge Function
 * @param {string} prompt - Pertanyaan atau instruksi untuk AI
 * @returns {Promise<string>} - Respons dari AI
 */
export async function askAIAssistant(prompt) {
  try {
    // 1. Kumpulkan ringkasan data sebagai konteks (optional tapi berguna)
    const records = await getAllWasteRecords();
    
    // Hitung total sampah 30 hari terakhir untuk konteks
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    
    const recentRecords = records.filter(r => new Date(r.record_date || r.created_at) >= oneMonthAgo);
    const totalKg = recentRecords.reduce((sum, r) => sum + (Number(r.weight_kg) || 0), 0);
    const pilahCount = recentRecords.filter(r => r.type === 'pilah').length;
    
    // Build daily breakdown
    const dailyMap = {};
    recentRecords.forEach(r => {
      const d = (r.date_str || (r.created_at ? r.created_at.split('T')[0] : 'Unknown'));
      if (!dailyMap[d]) dailyMap[d] = { weight: 0, count: 0 };
      dailyMap[d].weight += (Number(r.weight_kg) || 0);
      dailyMap[d].count += 1;
    });

    const dailyText = Object.keys(dailyMap)
      .sort((a, b) => b.localeCompare(a)) // sort descending
      .map(d => `- Tanggal ${d}: ${dailyMap[d].weight.toFixed(1)} kg (${dailyMap[d].count} transaksi)`)
      .join('\n');
    
    const context = `
Statistik 30 hari terakhir (Total Berjalan):
- Total transaksi: ${recentRecords.length} kali
- Total berat sampah: ${totalKg.toFixed(2)} kg
- Transaksi terpilah: ${pilahCount} kali

Rincian Harian (30 Hari Terakhir):
${dailyText || '- Belum ada data 30 hari terakhir'}
    `.trim();

    // 2. Panggil Edge Function
    const { data, error } = await supabase.functions.invoke('simpah-ai', {
      body: { prompt, context }
    });

    if (error) {
      console.warn('Gagal memanggil Supabase Edge Function (simpah-ai):', error.message);
      // Fallback: Panggil Qwen API langsung dari client-side jika environment key tersedia
      return callQwenDirectly(prompt, context);
    }

    if (data && data.reply) {
      return data.reply;
    }

    return "Maaf, terjadi kesalahan format respons dari server.";
  } catch (err) {
    console.error('Error in askAIAssistant:', err);
    return "Maaf, sistem AI sedang mengalami gangguan koneksi.";
  }
}

// Fallback jika Edge Function tidak dapat diakses (langsung panggil API Qwen)
async function callQwenDirectly(prompt, context) {
  const QWEN_API_KEY = import.meta.env.VITE_QWEN_API_KEY;
  
  if (!QWEN_API_KEY) {
     return "Maaf, Edge Function tidak aktif dan API Key Qwen lokal tidak ditemukan.";
  }

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

  try {
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

    return data.choices?.[0]?.message?.content || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";
  } catch (error) {
    console.error('Qwen Direct API Error:', error);
    return "Maaf, terjadi kesalahan saat menghubungi server AI.";
  }
}
