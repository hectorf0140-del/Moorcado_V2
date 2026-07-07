/**
 * Módulo singleton para persistencia en localStorage.
 * Todas las funciones incluyen guard SSR y try/catch.
 */
import type { Anuncio, Transaccion, Usuario } from "./types";

// ─── Keys ────────────────────────────────────────────────────────────────────
export const KEYS = {
  usuarios: "moorcado_usuarios",
  sesion: "moorcado_sesion",
  adminSesion: "moorcado_admin_sesion",
  anuncios: "moorcado_anuncios",
  mensajes: "moorcado_mensajes",
  transacciones: "moorcado_transacciones",
} as const;

// ─── Primitives ───────────────────────────────────────────────────────────────
function leer<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function escribir<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private browsing
  }
}

// ─── Typed API ────────────────────────────────────────────────────────────────
export function getUsuarios(): Usuario[] {
  const stored = leer<Usuario[] | null>(KEYS.usuarios, null);
  return stored ?? [];
}
export function setUsuarios(v: Usuario[]) {
  escribir(KEYS.usuarios, v);
}

export interface SesionData {
  usuarioId: string;
  nombre: string;
  iniciales: string;
  avatarColor: string;
}
export function getSesion(): SesionData | null {
  return leer<SesionData | null>(KEYS.sesion, null);
}
export function setSesion(v: SesionData | null) {
  escribir(KEYS.sesion, v);
}

/**
 * Sesión de moderador — completamente separada de la sesión de usuario
 * normal (SesionData). Un usuario logueado como ganadero/empresa/etc.
 * NO tiene acceso al panel de administración por eso solamente.
 */
export interface AdminSesionData {
  moderadorId: string;
  nombre: string;
}
export function getAdminSesion(): AdminSesionData | null {
  return leer<AdminSesionData | null>(KEYS.adminSesion, null);
}
export function setAdminSesion(v: AdminSesionData | null) {
  escribir(KEYS.adminSesion, v);
}

export function getAnuncios(): Anuncio[] {
  const stored = leer<Anuncio[] | null>(KEYS.anuncios, null);
  return stored ?? [];
}
export function setAnuncios(v: Anuncio[]) {
  escribir(KEYS.anuncios, v);
}

/** mensajes: Record<conversacionId, MensajeChat[]> — cache local del chat real (Supabase). */
export type MensajesStore = Record<string, import("./mensajesDb").MensajeChat[]>;
export function getMensajes(): MensajesStore {
  return leer<MensajesStore>(KEYS.mensajes, {});
}
export function setMensajes(v: MensajesStore) {
  escribir(KEYS.mensajes, v);
}

export function getTransacciones(): Transaccion[] {
  const stored = leer<Transaccion[] | null>(KEYS.transacciones, null);
  return stored ?? [];
}
export function setTransacciones(v: Transaccion[]) {
  escribir(KEYS.transacciones, v);
}
