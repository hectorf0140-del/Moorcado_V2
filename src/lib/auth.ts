/**
 * Helpers de autenticación sobre Supabase Auth. Las credenciales viven en
 * auth.users (Supabase); la tabla `usuarios` solo guarda el perfil, con
 * id = auth.uid().
 */
import type { AuthUser } from "@supabase/supabase-js";
import type { SesionData } from "./storage";
import type { Usuario, UserType } from "./types";
import { fetchUsuarioPorIdDb, upsertUsuarioDb } from "./usuariosDb";

const COLORES_AVATAR = ["#1F4D2C", "#8B5E3C", "#7FA05E", "#D9A441", "#424242"];

export function generarInicialesYColor(nombre: string): {
  iniciales: string;
  avatarColor: string;
} {
  const iniciales = nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const avatarColor = COLORES_AVATAR[Math.floor(Math.random() * COLORES_AVATAR.length)];
  return { iniciales, avatarColor };
}

export function construirSesionDesdeUsuario(usuario: Usuario): SesionData {
  return {
    usuarioId: usuario.id,
    nombre: usuario.nombre,
    iniciales: usuario.iniciales,
    avatarColor: usuario.avatarColor,
  };
}

interface MetadataRegistro {
  nombre?: string;
  tipo?: UserType;
  telefono?: string;
  departamento?: string;
  nombreEmpresa?: string;
  rtn?: string;
}

/**
 * Dado un usuario ya autenticado en Supabase Auth, garantiza que exista su
 * perfil en `usuarios` (id = auth.uid()). Si es su primer ingreso (recién
 * confirmó el correo, o el proyecto no exige confirmación), lo crea a
 * partir de lo que `signUp` guardó en `user_metadata`.
 */
export async function asegurarPerfilUsuario(authUser: AuthUser): Promise<Usuario | null> {
  const existente = await fetchUsuarioPorIdDb(authUser.id);
  if (existente) return existente;

  const meta = authUser.user_metadata as MetadataRegistro;
  const nombre = meta.nombre?.trim() || authUser.email?.split("@")[0] || "Usuario de Moorcado";
  const { iniciales, avatarColor } = generarInicialesYColor(nombre);
  const tipo = meta.tipo ?? "vendedor";

  const nuevoUsuario: Usuario = {
    id: authUser.id,
    nombre,
    tipo,
    avatarColor,
    iniciales,
    verificado: false,
    calificacion: 0,
    numeroVentas: 0,
    publicacionesActivas: 0,
    resenas: 0,
    plan: "gratuito",
    telefono: meta.telefono ?? "",
    correo: authUser.email ?? "",
    departamento: meta.departamento ?? "",
    creadoEn: new Date().toISOString(),
    terminosAceptados: true,
    fechaAceptacionTerminos: new Date().toISOString(),
    ...(tipo === "empresa" ? { nombreEmpresa: meta.nombreEmpresa, rtn: meta.rtn } : {}),
  };

  await upsertUsuarioDb(nuevoUsuario);
  return nuevoUsuario;
}

/** Mapea los mensajes de error de Supabase Auth a español, para las pantallas de login/registro. */
export function mensajeErrorAuth(error: { message: string } | null | undefined): string {
  const msg = error?.message ?? "";
  if (/already registered|already exists/i.test(msg)) {
    return "Este correo ya está registrado.";
  }
  if (/invalid login credentials/i.test(msg)) {
    return "Correo o contraseña incorrectos.";
  }
  if (/email not confirmed/i.test(msg)) {
    return "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.";
  }
  if (/password.*(least|character|short)/i.test(msg)) {
    return "La contraseña no cumple los requisitos mínimos.";
  }
  if (/email rate limit/i.test(msg)) {
    return "Se alcanzó el límite de correos que podemos enviar por ahora. Espera unos minutos e inténtalo de nuevo.";
  }
  if (/rate limit|too many requests/i.test(msg)) {
    return "Demasiados intentos en poco tiempo. Espera unos minutos e inténtalo de nuevo.";
  }
  return "Ocurrió un error. Por favor inténtalo de nuevo más tarde.";
}
