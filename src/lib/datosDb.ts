/**
 * Capa de datos en Supabase para mensajes, favoritos y transacciones.
 * Mismo patrón que anunciosDb/usuariosDb: si la red o la tabla fallan,
 * degrada a null/no-op y la app sigue con localStorage.
 */
import { supabase } from "./supabase";
import type { Transaccion } from "./types";
import type { MensajesStore } from "./storage";

type MensajeRow = { id: string; autorId: string; texto: string; hora: string };

// ─── Mensajes (hilos por usuario+animal) ─────────────────────────────────────
export async function fetchMensajesDb(
  usuarioId: string
): Promise<MensajesStore | null> {
  try {
    const { data, error } = await supabase
      .from("mensajes")
      .select("animal_id, data")
      .eq("usuario_id", usuarioId)
      .order("creado_en", { ascending: true });
    if (error || !data) return null;
    const store: MensajesStore = {};
    for (const r of data) {
      const msg = r.data as MensajeRow;
      (store[r.animal_id] ??= []).push(msg);
    }
    return store;
  } catch {
    return null;
  }
}

export async function insertMensajeDb(
  usuarioId: string,
  animalId: string,
  mensaje: MensajeRow
): Promise<void> {
  try {
    await supabase.from("mensajes").upsert({
      id: mensaje.id,
      usuario_id: usuarioId,
      animal_id: animalId,
      data: mensaje,
    });
  } catch {
    // sin conexión — queda en localStorage
  }
}

// ─── Favoritos (por usuario) ─────────────────────────────────────────────────
export async function fetchFavoritosDb(
  usuarioId: string
): Promise<string[] | null> {
  try {
    const { data, error } = await supabase
      .from("favoritos")
      .select("animal_id")
      .eq("usuario_id", usuarioId);
    if (error || !data) return null;
    return data.map((r) => r.animal_id as string);
  } catch {
    return null;
  }
}

export async function setFavoritoDb(
  usuarioId: string,
  animalId: string,
  favorito: boolean
): Promise<void> {
  try {
    if (favorito) {
      await supabase
        .from("favoritos")
        .upsert({ usuario_id: usuarioId, animal_id: animalId });
    } else {
      await supabase
        .from("favoritos")
        .delete()
        .eq("usuario_id", usuarioId)
        .eq("animal_id", animalId);
    }
  } catch {
    // sin conexión
  }
}

// ─── Transacciones ───────────────────────────────────────────────────────────
export async function fetchTransaccionesDb(): Promise<Transaccion[] | null> {
  try {
    const { data, error } = await supabase.from("transacciones").select("data");
    if (error || !data) return null;
    return data.map((r) => r.data as Transaccion);
  } catch {
    return null;
  }
}

export async function seedTransaccionesDb(seed: Transaccion[]): Promise<void> {
  try {
    const { count, error } = await supabase
      .from("transacciones")
      .select("id", { count: "exact", head: true });
    if (error || (count ?? 0) > 0) return;
    await supabase
      .from("transacciones")
      .upsert(seed.map((t) => ({ id: t.id, data: t })));
  } catch {
    // la tabla aún no existe
  }
}
