/**
 * Capa de datos de notificaciones sobre Supabase (tabla `notificaciones`).
 * Cada fila pertenece a un usuario (usuario_id). Mismo patrón try/catch
 * degradado que el resto de *Db.ts.
 */
import { supabase } from "./supabase";
import type { NotificacionItem } from "./types";

const TABLA = "notificaciones";

interface FilaDb {
  id: string;
  tipo: NotificacionItem["tipo"];
  titulo: string;
  descripcion: string | null;
  referencia_id: string | null;
  leida: boolean;
  creado_en: string;
}

function filaANotificacion(f: FilaDb): NotificacionItem {
  return {
    id: f.id,
    tipo: f.tipo,
    titulo: f.titulo,
    descripcion: f.descripcion ?? "",
    hora: f.creado_en,
    leida: f.leida,
    referenciaId: f.referencia_id ?? undefined,
  };
}

export async function fetchNotificacionesDeUsuario(
  usuarioId: string
): Promise<NotificacionItem[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("id,tipo,titulo,descripcion,referencia_id,leida,creado_en")
      .eq("usuario_id", usuarioId)
      .order("creado_en", { ascending: false });
    if (error || !data) return null;
    return (data as FilaDb[]).map(filaANotificacion);
  } catch {
    return null;
  }
}

export async function crearNotificacionDb(n: {
  id: string;
  usuarioId: string;
  tipo: NotificacionItem["tipo"];
  titulo: string;
  descripcion?: string;
  referenciaId?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLA).insert({
      id: n.id,
      usuario_id: n.usuarioId,
      tipo: n.tipo,
      titulo: n.titulo,
      descripcion: n.descripcion ?? null,
      referencia_id: n.referenciaId ?? null,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function marcarNotificacionLeidaDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLA).update({ leida: true }).eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

export async function marcarTodasLeidasDb(usuarioId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLA)
      .update({ leida: true })
      .eq("usuario_id", usuarioId)
      .eq("leida", false);
    return !error;
  } catch {
    return false;
  }
}
