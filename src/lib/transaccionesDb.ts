/**
 * Capa de datos de transacciones (ventas reales) sobre Supabase.
 *
 * Ojo: la tabla `transacciones` ya existía en la base de datos compartida
 * (creada por otro entorno/sesión que trabaja en paralelo sobre el mismo
 * proyecto de Supabase), usando el patrón JSONB viejo ({id, data,
 * creado_en}). En vez de reemplazarla, se le agregaron columnas reales
 * (animal_id, comprador_id, vendedor_id, precio, fecha) sin tocar `data`
 * — ver supabase/migracion_transacciones_patch.sql. Por eso este archivo
 * escribe en AMBOS lados en cada insert, y al leer usa las columnas
 * reales si están pobladas y si no cae de vuelta a `data`, para
 * funcionar sin importar cuál de los dos lados escribió la fila.
 */
import { supabase } from "./supabase";
import type { Transaccion } from "./types";

const TABLA = "transacciones";

interface FilaDb {
  id: string;
  animal_id: string | null;
  comprador_id: string | null;
  vendedor_id: string | null;
  precio: number | null;
  fecha: string | null;
  data: Partial<Transaccion> | null;
  creado_en: string;
}

function filaATransaccion(f: FilaDb): Transaccion {
  return {
    id: f.id,
    animalId: f.animal_id ?? f.data?.animalId ?? "",
    compradorId: f.comprador_id ?? f.data?.compradorId ?? "",
    vendedorId: f.vendedor_id ?? f.data?.vendedorId ?? "",
    precio: f.precio ?? f.data?.precio ?? 0,
    fecha: f.fecha ?? f.data?.fecha ?? f.creado_en,
  };
}

export async function fetchTransaccionesDb(): Promise<Transaccion[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("id,animal_id,comprador_id,vendedor_id,precio,fecha,data,creado_en");
    if (error || !data) return null;
    return (data as FilaDb[])
      .map(filaATransaccion)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  } catch {
    return null;
  }
}
