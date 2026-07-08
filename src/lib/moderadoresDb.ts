/**
 * Capa de datos del módulo de administración.
 * A diferencia de usuariosDb/anunciosDb, aquí NO hay fetch directo a una
 * tabla — la tabla `moderadores` no tiene políticas de lectura para
 * el cliente. La única forma de verificar credenciales es a través de
 * la función `verificar_moderador` (ver supabase/migracion_esquema.sql),
 * que corre en el servidor de Supabase y nunca expone la contraseña.
 */
import { supabase } from "./supabase";

export interface ModeradorSesion {
  moderadorId: string;
  nombre: string;
  rol: "super_admin" | "moderador";
}

export async function verificarModerador(
  correo: string,
  contrasena: string
): Promise<ModeradorSesion | null> {
  try {
    const { data, error } = await supabase.rpc("verificar_moderador", {
      p_correo: correo,
      p_password: contrasena,
    });
    if (error || !data || data.length === 0) return null;
    const [fila] = data as { id: string; nombre: string; rol: "super_admin" | "moderador" }[];
    return { moderadorId: fila.id, nombre: fila.nombre, rol: fila.rol };
  } catch {
    return null;
  }
}
