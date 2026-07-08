/**
 * Capa de datos del chat sobre Supabase (tabla `chat_mensajes`).
 * Cada fila es un mensaje individual, agrupado por `conversacion_id`
 * (ver conversacionId()). Si la red o la tabla fallan, degrada a
 * null/no-op — igual que usuariosDb.ts y anunciosDb.ts.
 */
import { supabase } from "./supabase";

const TABLA = "mensajes";

export interface MensajeChat {
  id: string;
  conversacionId: string;
  autorId: string;
  destinatarioId: string;
  animalId?: string;
  texto: string;
  creadoEn: string;
  leido: boolean;
}

/** ID determinístico de conversación entre dos usuarios (orden no importa). */
export function conversacionId(usuarioA: string, usuarioB: string): string {
  return [usuarioA, usuarioB].sort().join("__");
}

interface FilaDb {
  id: string;
  conversacion_id: string;
  autor_id: string;
  destinatario_id: string;
  animal_id: string | null;
  texto: string;
  creado_en: string;
  leido: boolean | null;
}

function filaAMensaje(f: FilaDb): MensajeChat {
  return {
    id: f.id,
    conversacionId: f.conversacion_id,
    autorId: f.autor_id,
    destinatarioId: f.destinatario_id,
    animalId: f.animal_id ?? undefined,
    texto: f.texto,
    creadoEn: f.creado_en,
    leido: f.leido ?? true,
  };
}

/** Todos los mensajes de una conversación, ordenados del más viejo al más nuevo. */
export async function fetchConversacion(conversacionId: string): Promise<MensajeChat[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("id,conversacion_id,autor_id,destinatario_id,animal_id,texto,creado_en,leido")
      .eq("conversacion_id", conversacionId)
      .order("creado_en", { ascending: true });
    if (error || !data) return null;
    return (data as FilaDb[]).map(filaAMensaje);
  } catch {
    return null;
  }
}

/**
 * Todos los mensajes donde el usuario participa (como autor o destinatario).
 * Se usa para armar la bandeja de entrada (lista de conversaciones).
 */
export async function fetchMensajesDeUsuario(usuarioId: string): Promise<MensajeChat[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("id,conversacion_id,autor_id,destinatario_id,animal_id,texto,creado_en,leido")
      .or(`autor_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`)
      .order("creado_en", { ascending: true });
    if (error || !data) return null;
    return (data as FilaDb[]).map(filaAMensaje);
  } catch {
    return null;
  }
}

export async function enviarMensajeDb(mensaje: MensajeChat): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLA).insert({
      id: mensaje.id,
      conversacion_id: mensaje.conversacionId,
      autor_id: mensaje.autorId,
      destinatario_id: mensaje.destinatarioId,
      animal_id: mensaje.animalId ?? null,
      texto: mensaje.texto,
      leido: false,
    });
    return !error;
  } catch {
    return false;
  }
}

/** Marca como leídos todos los mensajes de una conversación dirigidos a `usuarioId`. */
export async function marcarConversacionLeidaDb(
  conversacionId: string,
  usuarioId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLA)
      .update({ leido: true })
      .eq("conversacion_id", conversacionId)
      .eq("destinatario_id", usuarioId)
      .eq("leido", false);
    return !error;
  } catch {
    return false;
  }
}
