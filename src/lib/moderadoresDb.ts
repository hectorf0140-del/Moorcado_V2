/**
 * Capa de datos del módulo de administración.
 * A diferencia de usuariosDb/anunciosDb, aquí NO hay fetch directo a una
 * tabla — la tabla `moderadores` no tiene políticas de lectura para
 * el cliente. La única forma de verificar credenciales es a través de
 * la función `verificar_moderador` (ver supabase/migracion_rls_dueno.sql),
 * que corre en el servidor de Supabase y nunca expone la contraseña.
 *
 * Los moderadores no usan Supabase Auth (no tienen auth.uid()), así que
 * `verificar_moderador` también entrega un token de sesión propio — cada
 * acción de moderador de abajo es un RPC `security definer` que exige ese
 * token, en vez de un `update` directo a la tabla (que ya no está permitido
 * por RLS).
 */
import { supabase } from "./supabase";

export interface ModeradorSesion {
  moderadorId: string;
  nombre: string;
  rol: "super_admin" | "moderador";
  token: string;
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
    const [fila] = data as {
      id: string;
      nombre: string;
      rol: "super_admin" | "moderador";
      token: string;
    }[];
    return { moderadorId: fila.id, nombre: fila.nombre, rol: fila.rol, token: fila.token };
  } catch {
    return null;
  }
}

async function llamarRpcModerador(nombre: string, args: Record<string, unknown>): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc(nombre, args);
    return !error && data === true;
  } catch {
    return false;
  }
}

export function suspenderUsuarioRpc(token: string, usuarioId: string, motivo: string) {
  return llamarRpcModerador("moderador_suspender_usuario", {
    p_token: token,
    p_usuario_id: usuarioId,
    p_motivo: motivo,
  });
}

export function reactivarUsuarioRpc(token: string, usuarioId: string) {
  return llamarRpcModerador("moderador_reactivar_usuario", {
    p_token: token,
    p_usuario_id: usuarioId,
  });
}

export function verificarUsuarioRpc(token: string, usuarioId: string) {
  return llamarRpcModerador("moderador_verificar_usuario", {
    p_token: token,
    p_usuario_id: usuarioId,
  });
}

export function rechazarVerificacionRpc(token: string, usuarioId: string) {
  return llamarRpcModerador("moderador_rechazar_verificacion", {
    p_token: token,
    p_usuario_id: usuarioId,
  });
}

export function resolverReporteRpc(
  token: string,
  reporteId: string,
  estado: "resuelto" | "descartado",
  resolucionDetalle?: string
) {
  return llamarRpcModerador("moderador_resolver_reporte", {
    p_token: token,
    p_reporte_id: reporteId,
    p_estado: estado,
    p_resolucion_detalle: resolucionDetalle ?? null,
  });
}

export function resolverApelacionRpc(
  token: string,
  apelacionId: string,
  estado: "aceptada" | "rechazada",
  resolucionDetalle?: string
) {
  return llamarRpcModerador("moderador_resolver_apelacion", {
    p_token: token,
    p_apelacion_id: apelacionId,
    p_estado: estado,
    p_resolucion_detalle: resolucionDetalle ?? null,
  });
}

export function retirarAnuncioRpc(
  token: string,
  anuncioId: string,
  motivo: string,
  reporteId?: string
) {
  return llamarRpcModerador("moderador_retirar_anuncio", {
    p_token: token,
    p_anuncio_id: anuncioId,
    p_motivo: motivo,
    p_reporte_id: reporteId ?? null,
  });
}

export function reactivarAnuncioRpc(token: string, anuncioId: string) {
  return llamarRpcModerador("moderador_reactivar_anuncio", {
    p_token: token,
    p_anuncio_id: anuncioId,
  });
}

export function alternarActivoAnuncioRpc(token: string, anuncioId: string, activo: boolean) {
  return llamarRpcModerador("moderador_alternar_activo_anuncio", {
    p_token: token,
    p_anuncio_id: anuncioId,
    p_activo: activo,
  });
}
