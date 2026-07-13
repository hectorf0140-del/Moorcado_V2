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

/** Extrae la ruta dentro del bucket a partir de una URL pública de Storage. */
function rutaDesdeUrlPublica(url: string): string | null {
  const marcador = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marcador);
  return i === -1 ? null : url.slice(i + marcador.length);
}

/**
 * Borra fotos de Storage que ya no pertenecen a ningún anuncio (ej. el
 * vendedor las quitó al editar). No falla el flujo que la llama: si el
 * borrado no se puede completar, las fotos quedan huérfanas en Storage en
 * vez de bloquear el guardado del anuncio.
 */
export async function borrarFotosAnuncio(urls: string[]): Promise<void> {
  const rutas = urls.map(rutaDesdeUrlPublica).filter((r): r is string => r !== null);
  if (rutas.length === 0) return;
  try {
    const { error } = await supabase.storage.from(BUCKET).remove(rutas);
    if (error) console.error("borrarFotosAnuncio falló:", error.message);
  } catch (error) {
    console.error("borrarFotosAnuncio sin conexión:", error);
  }
}
