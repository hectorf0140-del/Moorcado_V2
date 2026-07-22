/**
 * Límites y validadores de campos de formulario, compartidos entre
 * registro, publicar y edición de anuncio/perfil — para que un campo de
 * texto no pueda usarse para meter basura (miles de caracteres, símbolos
 * donde solo van dígitos, etc.).
 */
import type { KeyboardEvent } from "react";

export const MAX_NOMBRE = 200;
export const MAX_TEXTO_CORTO = 120;
export const MAX_DESCRIPCION = 2000;
export const MAX_MENSAJE = 1000;
export const MAX_CORREO = 254; // tope real del estándar de email (RFC 5321)
export const MAX_TELEFONO = 20; // formato mostrado en el sitio incluye código de país: "+504 9999-8888"
export const MAX_RTN = 14; // RTN de Honduras: 14 dígitos

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Dígitos, espacios, guiones y un "+" opcional al inicio — cubre el
// formato "+504 9999-8888" ya usado como placeholder en el sitio, sin
// dejar pasar letras u otros símbolos.
const REGEX_TELEFONO = /^\+?[\d\s-]{7,20}$/;

export function esCorreoValido(correo: string): boolean {
  return correo.length <= MAX_CORREO && REGEX_CORREO.test(correo.trim());
}

export function esTelefonoValido(telefono: string): boolean {
  return REGEX_TELEFONO.test(telefono.trim());
}

/** Deja pasar solo dígitos — usar en el onChange de RTN/documento/etc. */
export function soloDigitos(valor: string, maxLargo?: number): string {
  const limpio = valor.replace(/\D/g, "");
  return maxLargo ? limpio.slice(0, maxLargo) : limpio;
}

/** Deja pasar dígitos, espacios, guiones y un "+" — usar en el onChange de teléfono. */
export function filtrarTelefono(valor: string, maxLargo = MAX_TELEFONO): string {
  const limpio = valor.replace(/[^\d\s+-]/g, "");
  return limpio.slice(0, maxLargo);
}

export const MAX_DOCUMENTO = 20;

/** Deja pasar dígitos y guiones — DNI/RTN hondureños se escriben con guiones (0801-1990-12345). */
export function filtrarDocumento(valor: string, maxLargo = MAX_DOCUMENTO): string {
  const limpio = valor.replace(/[^\d-]/g, "");
  return limpio.slice(0, maxLargo);
}

/** Bloquea teclas no numéricas en un <input type="number"> (e, +, -, coma). */
export function bloquearTeclasNoNumericas(e: KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-", ","].includes(e.key)) {
    e.preventDefault();
  }
}
