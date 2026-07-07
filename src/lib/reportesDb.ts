/**
 * Capa de datos de reportes sobre Supabase (tabla `reportes_mvp`).
 * Cada fila es un reporte individual (de una publicación, un chat o un
 * usuario). Si la red o la tabla fallan, degrada a null/no-op — igual
 * que el resto de *Db.ts.
 */
import { supabase } from "./supabase";

const TABLA = "reportes";

export type TipoReporte = "publicacion" | "chat" | "usuario";
export type EstadoReporte = "pendiente" | "resuelto" | "descartado";

export interface Reporte {
  id: string;
  tipo: TipoReporte;
  objetivoId: string;
  autorId: string;
  motivo: string;
  detalle: string;
  estado: EstadoReporte;
  creadoEn: string;
}

interface FilaDb {
  id: string;
  tipo: TipoReporte;
  objetivo_id: string;
  autor_id: string;
  motivo: string;
  detalle: string;
  estado: EstadoReporte;
  creado_en: string;
}

function filaAReporte(f: FilaDb): Reporte {
  return {
    id: f.id,
    tipo: f.tipo,
    objetivoId: f.objetivo_id,
    autorId: f.autor_id,
    motivo: f.motivo,
    detalle: f.detalle,
    estado: f.estado,
    creadoEn: f.creado_en,
  };
}

export async function fetchReportes(): Promise<Reporte[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("id,tipo,objetivo_id,autor_id,motivo,detalle,estado,creado_en")
      .order("creado_en", { ascending: false });
    if (error || !data) return null;
    return (data as FilaDb[]).map(filaAReporte);
  } catch {
    return null;
  }
}

export async function crearReporteDb(reporte: Reporte): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLA).insert({
      id: reporte.id,
      tipo: reporte.tipo,
      objetivo_id: reporte.objetivoId,
      autor_id: reporte.autorId,
      motivo: reporte.motivo,
      detalle: reporte.detalle,
      estado: reporte.estado,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function actualizarEstadoReporteDb(
  id: string,
  estado: EstadoReporte
): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLA).update({ estado }).eq("id", id);
    return !error;
  } catch {
    return false;
  }
}
