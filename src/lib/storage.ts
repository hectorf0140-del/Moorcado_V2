/**
 * Módulo singleton para persistencia en localStorage.
 * Todas las funciones incluyen guard SSR y try/catch.
 */
import type { Anuncio, Transaccion, Usuario } from "./types";

// ─── Keys ────────────────────────────────────────────────────────────────────
export const KEYS = {
  usuarios: "moorcado_usuarios",
  sesion: "moorcado_sesion",
  anuncios: "moorcado_anuncios",
  mensajes: "moorcado_mensajes",
  favoritos: "moorcado_favoritos",
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
  // Lazy-init: import seed on first read
  const stored = leer<Usuario[] | null>(KEYS.usuarios, null);
  if (stored) return stored;
  // Import seed synchronously (safe — this is client-side only)
  const { usuariosSeed } = require("../data/usuarios") as {
    usuariosSeed: Usuario[];
  };
  escribir(KEYS.usuarios, usuariosSeed);
  return usuariosSeed;
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

export function getAnuncios(): Anuncio[] {
  const stored = leer<Anuncio[] | null>(KEYS.anuncios, null);
  if (stored) return stored;
  const { anunciosSeed } = require("../data/animales") as {
    anunciosSeed: Anuncio[];
  };
  escribir(KEYS.anuncios, anunciosSeed);
  return anunciosSeed;
}
export function setAnuncios(v: Anuncio[]) {
  escribir(KEYS.anuncios, v);
}

/** mensajes: Record<animalId, { autorId, texto, hora }[]> */
export type MensajesStore = Record<
  string,
  { id: string; autorId: string; texto: string; hora: string }[]
>;
export function getMensajes(): MensajesStore {
  return leer<MensajesStore>(KEYS.mensajes, {});
}
export function setMensajes(v: MensajesStore) {
  escribir(KEYS.mensajes, v);
}

export function getFavoritos(): string[] {
  return leer<string[]>(KEYS.favoritos, []);
}
export function setFavoritos(v: string[]) {
  escribir(KEYS.favoritos, v);
}

export function getTransacciones(): Transaccion[] {
  const stored = leer<Transaccion[] | null>(KEYS.transacciones, null);
  if (stored) return stored;
  const { transaccionesSeed } = require("../data/transacciones") as {
    transaccionesSeed: Transaccion[];
  };
  escribir(KEYS.transacciones, transaccionesSeed);
  return transaccionesSeed;
}
export function setTransacciones(v: Transaccion[]) {
  escribir(KEYS.transacciones, v);
}
