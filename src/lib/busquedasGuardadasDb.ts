/**
 * Capa de datos de búsquedas guardadas (tabla `busquedas_guardadas`).
 * Exclusivo cuentas empresa: guardan un filtro del catálogo y reciben una
 * notificación cuando se publica un anuncio que calza con él.
 */
import { supabase } from "./supabase";
import type { BusquedaGuardada } from "./types";

const TABLA = "busquedas_guardadas";

interface FilaDb {
  id: string;
  usuario_id: string;
  nombre: string;
  filtros: BusquedaGuardada["filtros"];
  creado_en: string;
}

function filaABusqueda(f: FilaDb): BusquedaGuardada {
  return {
    id: f.id,
    usuarioId: f.usuario_id,
    nombre: f.nombre,
    filtros: f.filtros,
    creadoEn: f.creado_en,
  };
}

export async function fetchBusquedasGuardadas(usuarioId: string): Promise<BusquedaGuardada[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("id,usuario_id,nombre,filtros,creado_en")
      .eq("usuario_id", usuarioId)
      .order("creado_en", { ascending: false });
    if (error || !data) return null;
    return (data as FilaDb[]).map(filaABusqueda);
  } catch {
    return null;
  }
}

/** Todas las búsquedas guardadas de todos los usuarios — para chequear coincidencias al publicar. */
export async function fetchTodasLasBusquedasGuardadas(): Promise<BusquedaGuardada[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("id,usuario_id,nombre,filtros,creado_en");
    if (error || !data) return null;
    return (data as FilaDb[]).map(filaABusqueda);
  } catch {
    return null;
  }
}

export async function crearBusquedaGuardadaDb(b: BusquedaGuardada): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLA).insert({
      id: b.id,
      usuario_id: b.usuarioId,
      nombre: b.nombre,
      filtros: b.filtros,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function borrarBusquedaGuardadaDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLA).delete().eq("id", id);
    return !error;
  } catch {
    return false;
  }
}
