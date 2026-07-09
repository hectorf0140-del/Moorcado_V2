/**
 * Capa de datos de solicitudes de compra ("Busco X", tabla `solicitudes_compra`).
 * Cualquier cuenta empresa publica qué está buscando; cualquier vendedor
 * puede verla y responder por chat.
 */
import { supabase } from "./supabase";
import type { SolicitudCompra } from "./types";

const TABLA = "solicitudes_compra";

interface FilaDb {
  id: string;
  comprador_id: string;
  raza: string;
  cantidad: number;
  precio_max: number;
  departamento: string;
  descripcion: string | null;
  activa: boolean;
  creado_en: string;
}

function filaASolicitud(f: FilaDb): SolicitudCompra {
  return {
    id: f.id,
    compradorId: f.comprador_id,
    raza: f.raza,
    cantidad: f.cantidad,
    precioMax: f.precio_max,
    departamento: f.departamento,
    descripcion: f.descripcion ?? "",
    activa: f.activa,
    creadoEn: f.creado_en,
  };
}

export async function fetchSolicitudesCompra(): Promise<SolicitudCompra[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("id,comprador_id,raza,cantidad,precio_max,departamento,descripcion,activa,creado_en")
      .order("creado_en", { ascending: false });
    if (error || !data) return null;
    return (data as FilaDb[]).map(filaASolicitud);
  } catch {
    return null;
  }
}

export async function crearSolicitudCompraDb(s: SolicitudCompra): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLA).insert({
      id: s.id,
      comprador_id: s.compradorId,
      raza: s.raza,
      cantidad: s.cantidad,
      precio_max: s.precioMax,
      departamento: s.departamento,
      descripcion: s.descripcion || null,
      activa: s.activa,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function actualizarSolicitudCompraDb(id: string, activa: boolean): Promise<boolean> {
  try {
    const { error } = await supabase.from(TABLA).update({ activa }).eq("id", id);
    return !error;
  } catch {
    return false;
  }
}
