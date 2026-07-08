/**
 * Capa de datos de reseñas sobre Supabase (tabla `resenas`).
 * Cada fila es una reseña individual sobre un usuario (`objetivo_id`).
 * Si la red o la tabla fallan, degrada a null/no-op — igual que
 * usuariosDb.ts, anunciosDb.ts y mensajesDb.ts.
 */
import { supabase } from "./supabase";

const TABLA = "resenas";

export interface Resena {
  id: string;
  objetivoId: string;
  autorId: string;
  calificacion: number;
  texto: string;
  creadoEn: string;
}

interface FilaDb {
  id: string;
  objetivo_id: string;
  autor_id: string;
  calificacion: number;
  texto: string;
  creado_en: string;
}

function filaAResena(f: FilaDb): Resena {
  return {
    id: f.id,
    objetivoId: f.objetivo_id,
    autorId: f.autor_id,
    calificacion: f.calificacion,
    texto: f.texto,
    creadoEn: f.creado_en,
  };
}

export async function fetchResenasDeUsuario(objetivoId: string): Promise<Resena[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("id,objetivo_id,autor_id,calificacion,texto,creado_en")
      .eq("objetivo_id", objetivoId)
      .order("creado_en", { ascending: false });
    if (error || !data) return null;
    return (data as FilaDb[]).map(filaAResena);
  } catch {
    return null;
  }
}

export async function crearResenaDb(resena: Resena): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLA).insert({
      id: resena.id,
      objetivo_id: resena.objetivoId,
      autor_id: resena.autorId,
      calificacion: resena.calificacion,
      texto: resena.texto,
    });
    return !error;
  } catch {
    return false;
  }
}
