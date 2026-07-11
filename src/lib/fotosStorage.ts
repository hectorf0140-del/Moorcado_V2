/**
 * Fotos de anuncios en Supabase Storage (bucket `fotos-anuncios`, ver
 * supabase/migracion_storage_fotos.sql). Reemplaza el guardado anterior
 * como base64 dentro del JSONB de `anuncios`.
 */
import { supabase } from "./supabase";

const BUCKET = "fotos-anuncios";

/** Sube una foto ya comprimida (Blob JPEG) y devuelve su URL pública. */
export async function subirFotoAnuncio(
  anuncioId: string,
  blob: Blob,
  indice: number
): Promise<string | null> {
  try {
    const ruta = `${anuncioId}/${Date.now()}-${indice}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(ruta, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) {
      console.error("subirFotoAnuncio falló:", error.message);
      return null;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
    return data.publicUrl;
  } catch (error) {
    console.error("subirFotoAnuncio sin conexión:", error);
    return null;
  }
}
