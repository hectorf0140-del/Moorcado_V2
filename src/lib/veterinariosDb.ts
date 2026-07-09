/**
 * Capa de datos del directorio de veterinarios (tabla `veterinarios`).
 * Directorio curado de solo lectura — exclusivo Rumi Pro.
 */
import { supabase } from "./supabase";
import type { Veterinario } from "./types";

const TABLA = "veterinarios";

interface FilaDb {
  id: string;
  nombre: string;
  especialidad: string;
  departamento: string;
  telefono: string;
  correo: string | null;
  verificado: boolean;
}

function filaAVeterinario(f: FilaDb): Veterinario {
  return {
    id: f.id,
    nombre: f.nombre,
    especialidad: f.especialidad,
    departamento: f.departamento,
    telefono: f.telefono,
    correo: f.correo ?? undefined,
    verificado: f.verificado,
  };
}

export async function fetchVeterinarios(): Promise<Veterinario[] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("id,nombre,especialidad,departamento,telefono,correo,verificado")
      .order("nombre", { ascending: true });
    if (error || !data) return null;
    return (data as FilaDb[]).map(filaAVeterinario);
  } catch {
    return null;
  }
}
