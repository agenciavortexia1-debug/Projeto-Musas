
import { createClient } from '@supabase/supabase-js';

// Removendo qualquer possível espaço em branco das chaves
export const supabaseUrl = 'https://fzxydpzottoanygtshpe.supabase.co'.trim();
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eHlkcHpvdHRvYW55Z3RzaHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjgxMTAsImV4cCI6MjA4NjQwNDExMH0.wG7zh9wOQ7TRJmge6OE0_lzMyC0Ri876rdK2pM7Xcbw'.trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Upload de imagem para o Supabase Storage.
 */
export async function uploadImage(bucket: string, path: string, base64Data: string): Promise<string> {
  try {
    const base64Content = base64Data.split(',')[1];
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error("Erro no upload da imagem:", err);
    throw new Error("Falha ao salvar imagem no servidor.");
  }
}
