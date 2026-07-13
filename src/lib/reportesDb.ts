/**
 * Capa de datos de reportes sobre Supabase (tabla `reportes_mvp`).
 * Cada fila es un reporte individual (de una publicación, un chat o un
 * usuario). Si la red o la tabla fallan, degrada a null/no-op — igual
 * que el resto de *Db.ts.
 */
import { supabase } from "./supabase";
import { formatearCodigoReporte } from "./format";

const TABLA = "reportes";

export type TipoReporte = "publicacion" | "chat" | "usuario";
export type EstadoReporte = "pendiente" | "resuelto" | "descartado";

export interface Reporte {
  id: string;
  numero: number;
  codigo: string;
  tipo: TipoReporte;
  objetivoId: string;
  autorId: string;
  motivo: string;
  detalle: string;
  estado: EstadoReporte;
  creadoEn: string;
  moderadorId?: string;
  moderadorNombre?: string;
  resolucionDetalle?: string;
}

interface FilaDb {
  id: string;
  numero: number;
  tipo: TipoReporte;
  objetivo_id: string;
  autor_id: string;
  motivo: string;
  detalle: string;
  estado: EstadoReporte;
  creado_en: string;
  moderador_id: string | null;
  moderador_nombre: string | null;
  resolucion_detalle: string | null;
}

const SELECT_COLUMNAS =
  "id,numero,tipo,objetivo_id,autor_id,motivo,detalle,estado,creado_en,moderador_id,moderador_nombre,resolucion_detalle";

function filaAReporte(f: FilaDb): Reporte {
  return {
    id: f.id,
    numero: f.numero,
    codigo: formatearCodigoReporte(f.numero),
    tipo: f.tipo,
    objetivoId: f.objetivo_id,
    autorId: f.autor_id,
    motivo: f.motivo,
    detalle: f.detalle,
    estado: f.estado,
    creadoEn: f.creado_en,
    moderadorId: f.moderador_id ?? undefined,
    moderadorNombre: f.moderador_nombre ?? undefined,
    resolucionDetalle: f.resolucion_detalle ?? undefined,
  };
}

export async function fetchReportes(): Promise<Reporte[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select(SELECT_COLUMNAS)
      .order("creado_en", { ascending: false });
    if (error || !data) return null;
    return (data as unknown as FilaDb[]).map(filaAReporte);
  } catch {
    return null;
  }
}

export async function fetchReportePorId(id: string): Promise<Reporte | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select(SELECT_COLUMNAS)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return filaAReporte(data as unknown as FilaDb);
  } catch {
    return null;
  }
}

export type NuevoReporte = Pick<
  Reporte,
  "id" | "tipo" | "objetivoId" | "autorId" | "motivo" | "detalle" | "estado"
>;

/**
 * Crea el reporte y devuelve la fila completa (con `numero`/`codigo`
 * asignados por la base de datos), para poder mostrarle al usuario su
 * identificador de seguimiento apenas lo envía.
 */
export async function crearReporteDb(reporte: NuevoReporte): Promise<Reporte | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .insert({
        id: reporte.id,
        tipo: reporte.tipo,
        objetivo_id: reporte.objetivoId,
        autor_id: reporte.autorId,
        motivo: reporte.motivo,
        detalle: reporte.detalle,
        estado: reporte.estado,
      })
      .select(SELECT_COLUMNAS)
      .single();
    if (error || !data) return null;
    return filaAReporte(data as unknown as FilaDb);
  } catch {
    return null;
  }
}
