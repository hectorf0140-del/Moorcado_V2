/**
 * Capa de datos de usuarios sobre Supabase.
 * La tabla `usuarios` guarda cada usuario como JSONB (ver
 * supabase/tabla_usuarios.sql). Mismo patrón que anunciosDb: si la red
 * o la tabla fallan, degrada a null/no-op y la app usa localStorage.
 *
 * Nota de producción: aquí las contraseñas viajan en texto plano porque
 * es un MVP académico. En producción esto se reemplaza por Supabase Auth
 * (hash bcrypt, JWT, RLS por usuario) como está modelado en schema.sql.
 */
import { supabase } from "./supabase";
import type { Usuario } from "./types";

const TABLA = "usuarios";

export async function fetchUsuariosDb(): Promise<Usuario[] | null> {
  try {
    const { data, error } = await supabase.from(TABLA).select("data");
    if (error || !data) return null;
    return data.map((r) => r.data as Usuario);
  } catch {
    return null;
  }
}

export async function upsertUsuarioDb(usuario: Usuario): Promise<void> {
  try {
    await supabase.from(TABLA).upsert({ id: usuario.id, data: usuario });
  } catch {
    // sin conexión — el usuario queda en localStorage
  }
}

/** Siembra los 5 usuarios iniciales si la tabla está vacía. */
export async function seedUsuariosDb(seed: Usuario[]): Promise<void> {
  try {
    const { count, error } = await supabase
      .from(TABLA)
      .select("id", { count: "exact", head: true });
    if (error || (count ?? 0) > 0) return;
    await supabase
      .from(TABLA)
      .upsert(seed.map((u) => ({ id: u.id, data: u })));
  } catch {
    // la tabla aún no existe — no pasa nada
  }
}
