/**
 * Capa de datos de apelaciones sobre Supabase (tabla `apelaciones`).
 * Un vendedor apela una publicación que un moderador retiró por un
 * reporte. Mismo patrón try/catch que reportesDb.ts: degrada a null/no-op
 * si la red o la tabla fallan.
 */
import { supabase } from "./supabase";

const TABLA = "apelaciones";

export type EstadoApelacion = "pendiente" | "aceptada" | "rechazada";

export interface Apelacion {
  id: string;
  anuncioId: string;
  reporteId?: string;
  vendedorId: string;
  motivo: string;
  estado: EstadoApelacion;
  moderadorId?: string;
  moderadorNombre?: string;
  resolucionDetalle?: string;
  creadoEn: string;
  resueltoEn?: string;
}

interface FilaDb {
  id: string;
  anuncio_id: string;
  reporte_id: string | null;
  vendedor_id: string;
  motivo: string;
  estado: EstadoApelacion;
  moderador_id: string | null;
  moderador_nombre: string | null;
  resolucion_detalle: string | null;
  creado_en: string;
  resuelto_en: string | null;
}

const SELECT_COLUMNAS =
  "id,anuncio_id,reporte_id,vendedor_id,motivo,estado,moderador_id,moderador_nombre,resolucion_detalle,creado_en,resuelto_en";

function filaAApelacion(f: FilaDb): Apelacion {
  return {
    id: f.id,
    anuncioId: f.anuncio_id,
    reporteId: f.reporte_id ?? undefined,
    vendedorId: f.vendedor_id,
    motivo: f.motivo,
    estado: f.estado,
    moderadorId: f.moderador_id ?? undefined,
    moderadorNombre: f.moderador_nombre ?? undefined,
    resolucionDetalle: f.resolucion_detalle ?? undefined,
    creadoEn: f.creado_en,
    resueltoEn: f.resuelto_en ?? undefined,
  };
}

export async function fetchApelaciones(): Promise<Apelacion[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select(SELECT_COLUMNAS)
      .order("creado_en", { ascending: false });
    if (error || !data) return null;
    return (data as unknown as FilaDb[]).map(filaAApelacion);
  } catch {
    return null;
  }
}

export async function fetchApelacionPorAnuncio(anuncioId: string): Promise<Apelacion | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select(SELECT_COLUMNAS)
      .eq("anuncio_id", anuncioId)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return filaAApelacion(data as unknown as FilaDb);
  } catch {
    return null;
  }
}

export async function crearApelacionDb(apelacion: Apelacion): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLA).insert({
      id: apelacion.id,
      anuncio_id: apelacion.anuncioId,
      reporte_id: apelacion.reporteId ?? null,
      vendedor_id: apelacion.vendedorId,
      motivo: apelacion.motivo,
      estado: apelacion.estado,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function actualizarEstadoApelacionDb(
  id: string,
  estado: "aceptada" | "rechazada",
  opts: { moderadorId: string; moderadorNombre: string; resolucionDetalle?: string }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLA)
      .update({
        estado,
        moderador_id: opts.moderadorId,
        moderador_nombre: opts.moderadorNombre,
        resolucion_detalle: opts.resolucionDetalle ?? null,
        resuelto_en: new Date().toISOString(),
      })
      .eq("id", id);
    return !error;
  } catch {
    return false;
  }
}
