import { supabase } from './supabase.js';

/**
 * Mengonversi string Data URL (Base64) ke Blob
 * @param {string} dataurl - Data URL (data:image/jpeg;base64,...)
 * @returns {Blob}
 */
export function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Mengunggah file Base64 ke Supabase Storage
 * @param {string} bucket - Nama bucket (misal: 'simpah_media')
 * @param {string} path - Path tujuan (misal: 'waste_records/123/foto.jpg')
 * @param {string} base64Data - Data URL
 * @returns {Promise<string|null>} - Public URL dari gambar yang diunggah
 */
export async function uploadBase64Image(bucket, path, base64Data) {
  if (!base64Data || !base64Data.startsWith('data:image')) {
    return null;
  }
  
  try {
    const blob = dataURLtoBlob(base64Data);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        contentType: blob.type,
        upsert: true
      });
      
    if (error) {
      console.error('[Storage] Upload gagal:', error);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
      
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('[Storage] Exception saat upload:', err);
    return null;
  }
}
