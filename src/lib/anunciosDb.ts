/**
 * Capa de datos de anuncios sobre Supabase.
 * La tabla `anuncios` guarda cada anuncio como JSONB (ver
 * supabase/tabla_anuncios.sql). Si la red o la tabla fallan, todas las
 * funciones degradan silenciosamente a null/no-op y la app sigue
 * funcionando con el cache de localStorage.
 */
import { supabase } from "./supabase";
import type { Anuncio } from "./types";

const TABLA = "anuncios";

export async function fetchAnunciosDb(): Promise<Anuncio[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("data")
      .order("creado_en", { ascending: false });
    if (error || !data) return null;
    return data.map((r) => r.data as Anuncio);
  } catch {
    return null;
  }
}

export async function fetchAnuncioDbPorId(id: string): Promise<Anuncio | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("data")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data.data as Anuncio;
  } catch {
    return null;
  }
}

export async function upsertAnuncioDb(anuncio: Anuncio): Promise<void> {
  try {
    // `vendedor_id` también se guarda como columna real para que la
    // llave foránea hacia usuarios se mantenga correcta. Los campos de
    // retiro por moderación también se promueven a columnas reales para
    // que el tab de apelaciones pueda filtrar/hacer join sin depender del
    // JSONB.
    await supabase.from(TABLA).upsert({
      id: anuncio.id,
      vendedor_id: anuncio.vendedorId,
      retirado_por_moderacion: anuncio.retiradoPorModeracion ?? false,
      retirado_motivo: anuncio.retiradoMotivo ?? null,
      retirado_reporte_id: anuncio.retiradoReporteId ?? null,
      data: anuncio,
    });
  } catch {
    // sin conexión — el anuncio queda en localStorage
  }
}

/** Siembra los 12 anuncios iniciales si la tabla está vacía. */
export async function seedAnunciosDb(seed: Anuncio[]): Promise<void> {
  try {
    const { count, error } = await supabase
      .from(TABLA)
      .select("id", { count: "exact", head: true });
    if (error || (count ?? 0) > 0) return;
    await supabase
      .from(TABLA)
      .upsert(seed.map((a) => ({ id: a.id, data: a })));
  } catch {
    // la tabla aún no existe — no pasa nada
  }
}
