/**
 * Funciones puras de transición de estado para el módulo de moderación.
 * No hacen fetch ni persistencia — el llamador sigue haciendo su propio
 * actualizarX() (store en memoria) + upsertXDb() (Supabase), igual que en
 * el resto de la app.
 */
import type { Anuncio, Usuario } from "./types";
import type { Reporte } from "./reportesDb";

export function marcarAnuncioRetiradoPorReporte(
  anuncio: Anuncio,
  reporte: Reporte,
  motivo: string
): Anuncio {
  return {
    ...anuncio,
    activo: false,
    retiradoPorModeracion: true,
    retiradoMotivo: motivo,
    retiradoReporteId: reporte.id,
  };
}

export function reactivarAnuncioPorApelacion(anuncio: Anuncio): Anuncio {
  return {
    ...anuncio,
    activo: true,
    retiradoPorModeracion: false,
    retiradoMotivo: undefined,
    retiradoReporteId: undefined,
  };
}

export function suspenderUsuario(usuario: Usuario, motivo: string): Usuario {
  return { ...usuario, estadoCuenta: "suspendido", estadoCuentaMotivo: motivo };
}

/** Publicaciones activas de un vendedor que quedan desactivadas al suspender su cuenta. */
export function anunciosADesactivarPorSuspension(anuncios: Anuncio[], vendedorId: string): Anuncio[] {
  return anuncios
    .filter((a) => a.vendedorId === vendedorId && a.activo !== false)
    .map((a) => ({ ...a, activo: false }));
}

export function reactivarUsuario(usuario: Usuario): Usuario {
  return { ...usuario, estadoCuenta: "activo", estadoCuentaMotivo: undefined };
}
