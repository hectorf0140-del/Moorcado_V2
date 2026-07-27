/**
 * Límites y validadores de campos de formulario, compartidos entre
 * registro, publicar y edición de anuncio/perfil — para que un campo de
 * texto no pueda usarse para meter basura (miles de caracteres, símbolos
 * donde solo van dígitos, etc.).
 */
import type { KeyboardEvent } from "react";
import { isValidPhoneNumber } from "libphonenumber-js";

export const MAX_NOMBRE = 200;
export const MAX_TEXTO_CORTO = 120;
export const MAX_DESCRIPCION = 2000;
export const MAX_MENSAJE = 1000;
export const MAX_CORREO = 254; // tope real del estándar de email (RFC 5321)
export const MAX_TELEFONO = 20; // formato mostrado en el sitio incluye código de país: "+504 9999-8888"
export const MAX_RTN = 14; // RTN de Honduras: 14 dígitos

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esCorreoValido(correo: string): boolean {
  return correo.length <= MAX_CORREO && REGEX_CORREO.test(correo.trim());
}

/**
 * Un número sin código de país se valida como hondureño (+504, 8 dígitos
 * reales) — la mayoría de la base de usuarios. Si el usuario escribe su
 * propio "+" de otro país, se valida contra las reglas reales de ESE país
 * (libphonenumber-js las conoce todas; inventar un regex por país a mano
 * sería arriesgarse a reglas equivocadas).
 */
export function esTelefonoValido(telefono: string): boolean {
  try {
    return isValidPhoneNumber(telefono.trim(), "HN");
  } catch {
    return false;
  }
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

/** Máximo de dígitos reales de un DNI/RTN hondureño (los guiones no cuentan). */
export const MAX_DIGITOS_DOCUMENTO = 14;

/** Valida solo por cantidad de dígitos (ignora guiones) — 1 a `maxDigitos`. */
export function esDocumentoValido(valor: string, maxDigitos = MAX_DIGITOS_DOCUMENTO): boolean {
  const digitos = soloDigitos(valor);
  return digitos.length > 0 && digitos.length <= maxDigitos;
}

/** Bloquea teclas no numéricas en un <input type="number"> (e, +, -, coma). */
export function bloquearTeclasNoNumericas(e: KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-", ","].includes(e.key)) {
    e.preventDefault();
  }
}
