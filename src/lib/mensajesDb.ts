/**
 * Capa de datos del chat sobre Supabase (tabla `chat_mensajes`).
 * Cada fila es un mensaje individual, agrupado por `conversacion_id`
 * (ver conversacionId()). Si la red o la tabla fallan, degrada a
 * null/no-op — igual que usuariosDb.ts y anunciosDb.ts.
 *
 * Una oferta de negociación es un mensaje más (tipo "oferta") en la
 * misma conversación — ver migracion_ofertas_chat.sql.
 */
import { supabase } from "./supabase";

const TABLA = "mensajes";

export type OfertaEstado = "pendiente" | "aceptada" | "rechazada" | "superada";

export interface MensajeChat {
  id: string;
  conversacionId: string;
  autorId: string;
  destinatarioId: string;
  animalId?: string;
  texto: string;
  creadoEn: string;
  leido: boolean;
  tipo: "texto" | "oferta";
  ofertaMonto?: number;
  ofertaEstado?: OfertaEstado;
}

/** ID determinístico de conversación entre dos usuarios (orden no importa). */
export function conversacionId(usuarioA: string, usuarioB: string): string {
  return [usuarioA, usuarioB].sort().join("__");
}

const COLUMNAS =
  "id,conversacion_id,autor_id,destinatario_id,animal_id,texto,creado_en,leido,tipo,oferta_monto,oferta_estado";

interface FilaDb {
  id: string;
  conversacion_id: string;
  autor_id: string;
  destinatario_id: string;
  animal_id: string | null;
  texto: string;
  creado_en: string;
  leido: boolean | null;
  tipo: "texto" | "oferta" | null;
  oferta_monto: number | null;
  oferta_estado: OfertaEstado | null;
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
    tipo: f.tipo ?? "texto",
    ofertaMonto: f.oferta_monto ?? undefined,
    ofertaEstado: f.oferta_estado ?? undefined,
  };
}

/** Todos los mensajes de una conversación, ordenados del más viejo al más nuevo. */
export async function fetchConversacion(conversacionId: string): Promise<MensajeChat[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select(COLUMNAS)
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
      .select(COLUMNAS)
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
      tipo: mensaje.tipo,
      oferta_monto: mensaje.ofertaMonto ?? null,
      oferta_estado: mensaje.ofertaEstado ?? null,
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

/**
 * Responde una oferta (aceptar/rechazar). Solo el destinatario puede
 * hacerlo — la RLS ya restringe UPDATE de `mensajes` al destinatario
 * (política "marcar leido propio", reusada aquí).
 */
export async function responderOfertaDb(
  mensajeId: string,
  respuesta: "aceptada" | "rechazada"
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLA)
      .update({ oferta_estado: respuesta })
      .eq("id", mensajeId)
      .eq("tipo", "oferta");
    return !error;
  } catch {
    return false;
  }
}

/**
 * Marca como "superada" cualquier oferta pendiente previa en la
 * conversación (de cualquiera de las dos partes) al mandar una nueva —
 * en una negociación solo hay una oferta "sobre la mesa" a la vez.
 * Requiere la política "actualizar oferta propia" (autor) o "marcar leido
 * propio" (destinatario) según de quién sea la oferta vieja.
 */
export async function marcarOfertasAnterioresSuperadasDb(
  conversacionId: string,
  exceptoMensajeId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLA)
      .update({ oferta_estado: "superada" })
      .eq("conversacion_id", conversacionId)
      .eq("tipo", "oferta")
      .eq("oferta_estado", "pendiente")
      .neq("id", exceptoMensajeId);
    return !error;
  } catch {
    return false;
  }
}
