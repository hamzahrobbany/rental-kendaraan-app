'use client';

import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase dari environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Inisialisasi client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload file ke Supabase Storage
 * @param file File yang akan diunggah
 * @param folder Folder tujuan di bucket (contoh: 'vehicle_images')
 * @returns URL publik dari file yang diunggah
 */
export async function uploadToSupabase(file: File, folder = 'vehicle_images'): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Hanya file gambar yang diperbolehkan');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}.${fileExt}`;

  const result = await supabase.storage
    .from('vehicle-images') // Ganti sesuai nama bucket kamu
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (result.error) {
    console.error('[Upload Error]', result.error.message);
    throw new Error(`Upload gagal: ${result.error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(fileName);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Gagal mendapatkan URL publik dari Supabase');
  }

  return publicUrlData.publicUrl;
}
