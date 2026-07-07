/**
 * Zustand store global de Moorcado.
 * No usa persist middleware — la hidratación se hace manualmente
 * desde un HydrationProvider en layout.tsx para compatibilidad SSR.
 */
import { create } from "zustand";
import type { Anuncio, Transaccion, Usuario } from "@/lib/types";
import type { AdminSesionData, SesionData, MensajesStore } from "@/lib/storage";

interface AppState {
  // ── Data ─────────────────────────────────────────────────────────────────
  sesion: SesionData | null;
  adminSesion: AdminSesionData | null; // sesión de moderador — independiente de `sesion`
  anuncios: Anuncio[];
  favoritos: string[]; // IDs de anuncios
  mensajes: MensajesStore; // mensajes de chat por animalId
  transacciones: Transaccion[];
  usuarios: Usuario[];
  hydrated: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  hydrate: () => void;
  login: (sesion: SesionData) => void;
  logout: () => void;
  loginAdmin: (sesion: AdminSesionData) => void;
  logoutAdmin: () => void;
  actualizarUsuario: (usuario: Usuario) => void;
  agregarAnuncio: (anuncio: Anuncio) => void;
  actualizarAnuncio: (anuncio: Anuncio) => void;
  toggleFavorito: (animalId: string) => void;
  enviarMensaje: (
    destinatarioId: string,
    texto: string,
    animalId?: string
  ) => Promise<void>;
  cargarConversacion: (otroUsuarioId: string) => Promise<void>;
  cargarBandejaMensajes: () => Promise<void>;
  crearTransaccion: (transaccion: Transaccion) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  sesion: null,
  adminSesion: null,
  anuncios: [],
  favoritos: [],
  mensajes: {},
  transacciones: [],
  usuarios: [],
  hydrated: false,

  hydrate() {
    // Lazy import to avoid SSR issues with require()
    const {
      getSesion,
      getAdminSesion,
      getAnuncios,
      getMensajes,
      getTransacciones,
      getUsuarios,
    } = require("@/lib/storage") as typeof import("@/lib/storage");

    const sesion = getSesion();
    const usuariosLocales = getUsuarios();
    const usuarioActual = sesion
      ? usuariosLocales.find((u) => u.id === sesion.usuarioId)
      : null;

    set({
      sesion,
      adminSesion: getAdminSesion(),
      anuncios: getAnuncios(),
      favoritos: usuarioActual?.favoritos ?? [],
      mensajes: getMensajes(),
      transacciones: getTransacciones(),
      usuarios: usuariosLocales,
      hydrated: true,
    });

    // Sincronización con Supabase en segundo plano: la BD es la fuente
    // de verdad compartida; localStorage queda como cache/fallback.
    void (async () => {
      const { fetchAnunciosDb } = await import("@/lib/anunciosDb");
      const remotos = await fetchAnunciosDb();
      if (remotos && remotos.length > 0) {
        const { setAnuncios } =
          require("@/lib/storage") as typeof import("@/lib/storage");
        setAnuncios(remotos);
        set({ anuncios: remotos });
      }

      // Usuarios: misma estrategia (BD como fuente de verdad compartida)
      const { fetchUsuariosDb } = await import("@/lib/usuariosDb");
      const usuariosRemotos = await fetchUsuariosDb();
      if (usuariosRemotos && usuariosRemotos.length > 0) {
        const { setUsuarios } =
          require("@/lib/storage") as typeof import("@/lib/storage");
        setUsuarios(usuariosRemotos);
        const { sesion: sesionActual } = get();
        const usuarioActual = sesionActual
          ? usuariosRemotos.find((u) => u.id === sesionActual.usuarioId)
          : null;
        set({
          usuarios: usuariosRemotos,
          favoritos: usuarioActual?.favoritos ?? get().favoritos,
        });
      }

      // Transacciones: misma estrategia (antes solo vivían en localStorage)
      const { fetchTransaccionesDb } = await import("@/lib/transaccionesDb");
      const transaccionesRemotas = await fetchTransaccionesDb();
      if (transaccionesRemotas) {
        const { setTransacciones } =
          require("@/lib/storage") as typeof import("@/lib/storage");
        setTransacciones(transaccionesRemotas);
        set({ transacciones: transaccionesRemotas });
      }
    })();
  },

  login(sesion) {
    const { setSesion } = require("@/lib/storage") as typeof import("@/lib/storage");
    setSesion(sesion);
    set({ sesion });
  },

  loginAdmin(adminSesion) {
    const { setAdminSesion } = require("@/lib/storage") as typeof import("@/lib/storage");
    setAdminSesion(adminSesion);
    set({ adminSesion });
  },

  logoutAdmin() {
    const { setAdminSesion } = require("@/lib/storage") as typeof import("@/lib/storage");
    setAdminSesion(null);
    set({ adminSesion: null });
  },

  logout() {
    const { setSesion } = require("@/lib/storage") as typeof import("@/lib/storage");
    setSesion(null);
    set({ sesion: null, favoritos: [] });
  },

  actualizarUsuario(usuario) {
    const { usuarios: actuales, sesion } = get();
    const yaExiste = actuales.some((u) => u.id === usuario.id);
    const nuevos = yaExiste
      ? actuales.map((u) => (u.id === usuario.id ? usuario : u))
      : [...actuales, usuario];
    const favoritos =
      sesion?.usuarioId === usuario.id ? usuario.favoritos ?? [] : get().favoritos;
    set({ usuarios: nuevos, favoritos });
  },

  agregarAnuncio(anuncio) {
    const { getAnuncios, setAnuncios } =
      require("@/lib/storage") as typeof import("@/lib/storage");
    const actuales = getAnuncios();
    const nuevos = [anuncio, ...actuales];
    setAnuncios(nuevos);
    set({ anuncios: nuevos });
    void import("@/lib/anunciosDb").then((db) => db.upsertAnuncioDb(anuncio));
  },

  actualizarAnuncio(anuncio) {
    const { getAnuncios, setAnuncios } =
      require("@/lib/storage") as typeof import("@/lib/storage");
    const actuales = getAnuncios();
    const nuevos = actuales.map((a) => (a.id === anuncio.id ? anuncio : a));
    setAnuncios(nuevos);
    set({ anuncios: nuevos });
    void import("@/lib/anunciosDb").then((db) => db.upsertAnuncioDb(anuncio));
  },

  toggleFavorito(animalId) {
    // Solo se guarda si hay una cuenta con sesión iniciada — un visitante
    // sin cuenta no tiene dónde persistir sus favoritos.
    const { sesion, usuarios } = get();
    if (!sesion) return;

    const usuario = usuarios.find((u) => u.id === sesion.usuarioId);
    if (!usuario) return;

    const actuales = usuario.favoritos ?? [];
    const nuevos = actuales.includes(animalId)
      ? actuales.filter((id) => id !== animalId)
      : [...actuales, animalId];
    const actualizado = { ...usuario, favoritos: nuevos };

    get().actualizarUsuario(actualizado);
    const { setUsuarios } = require("@/lib/storage") as typeof import("@/lib/storage");
    setUsuarios(get().usuarios);
    void import("@/lib/usuariosDb").then((db) => db.upsertUsuarioDb(actualizado));
  },

  async enviarMensaje(destinatarioId, texto, animalId) {
    const { sesion } = get();
    if (!sesion) return;

    const { getMensajes, setMensajes } =
      require("@/lib/storage") as typeof import("@/lib/storage");
    const { conversacionId, enviarMensajeDb } = await import("@/lib/mensajesDb");

    const convId = conversacionId(sesion.usuarioId, destinatarioId);
    const mensaje = {
      id: `msg-${Date.now()}`,
      conversacionId: convId,
      autorId: sesion.usuarioId,
      destinatarioId,
      animalId,
      texto,
      creadoEn: new Date().toISOString(),
    };

    // Optimista: se muestra de inmediato, se confirma en Supabase después.
    const todos = getMensajes();
    const hilo = todos[convId] ?? [];
    const nuevosMensajes = { ...todos, [convId]: [...hilo, mensaje] };
    setMensajes(nuevosMensajes);
    set({ mensajes: nuevosMensajes });

    await enviarMensajeDb(mensaje);
  },

  async cargarConversacion(otroUsuarioId) {
    const { sesion } = get();
    if (!sesion) return;

    const { conversacionId, fetchConversacion } = await import("@/lib/mensajesDb");
    const convId = conversacionId(sesion.usuarioId, otroUsuarioId);
    const remotos = await fetchConversacion(convId);
    if (!remotos) return;

    const { getMensajes, setMensajes } =
      require("@/lib/storage") as typeof import("@/lib/storage");
    const todos = getMensajes();
    const nuevosMensajes = { ...todos, [convId]: remotos };
    setMensajes(nuevosMensajes);
    set({ mensajes: nuevosMensajes });
  },

  async cargarBandejaMensajes() {
    const { sesion } = get();
    if (!sesion) return;

    const { fetchMensajesDeUsuario } = await import("@/lib/mensajesDb");
    const remotos = await fetchMensajesDeUsuario(sesion.usuarioId);
    if (!remotos) return;

    const agrupados: MensajesStore = {};
    for (const m of remotos) {
      (agrupados[m.conversacionId] ??= []).push(m);
    }

    const { setMensajes } = require("@/lib/storage") as typeof import("@/lib/storage");
    setMensajes(agrupados);
    set({ mensajes: agrupados });
  },

  async crearTransaccion(transaccion) {
    const { getTransacciones, setTransacciones } =
      require("@/lib/storage") as typeof import("@/lib/storage");
    const actuales = getTransacciones();
    const nuevas = [transaccion, ...actuales];
    setTransacciones(nuevas);
    set({ transacciones: nuevas });

    const { crearTransaccionDb } = await import("@/lib/transaccionesDb");
    await crearTransaccionDb(transaccion);
  },
}));
