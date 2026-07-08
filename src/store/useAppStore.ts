/**
 * Zustand store global de Moorcado.
 * No usa persist middleware — la hidratación se hace manualmente
 * desde un HydrationProvider en layout.tsx para compatibilidad SSR.
 */
import { create } from "zustand";
import type { Anuncio, NotificacionItem, Transaccion, Usuario } from "@/lib/types";
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
  notificaciones: NotificacionItem[];
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
  cargarNotificaciones: () => Promise<void>;
  marcarNotificacionLeida: (id: string) => Promise<void>;
  marcarTodasNotificacionesLeidas: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  sesion: null,
  adminSesion: null,
  anuncios: [],
  favoritos: [],
  mensajes: {},
  transacciones: [],
  usuarios: [],
  notificaciones: [],
  hydrated: false,

  hydrate() {
    // Lazy import to avoid SSR issues with require()
    const {
      getSesion,
      getAdminSesion,
      getAnuncios,
      getFavoritos,
      getMensajes,
      getTransacciones,
      getUsuarios,
    } = require("@/lib/storage") as typeof import("@/lib/storage");

    set({
      sesion: getSesion(),
      adminSesion: getAdminSesion(),
      anuncios: getAnuncios(),
      favoritos: getFavoritos(),
      mensajes: getMensajes(),
      transacciones: getTransacciones(),
      usuarios: getUsuarios(),
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
        set({ usuarios: usuariosRemotos });
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
    set({ sesion: null });
  },

  actualizarUsuario(usuario) {
    const actuales = get().usuarios;
    const yaExiste = actuales.some((u) => u.id === usuario.id);
    const nuevos = yaExiste
      ? actuales.map((u) => (u.id === usuario.id ? usuario : u))
      : [...actuales, usuario];
    set({ usuarios: nuevos });
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
    const { getFavoritos, setFavoritos } =
      require("@/lib/storage") as typeof import("@/lib/storage");
    const actuales = getFavoritos();
    const nuevos = actuales.includes(animalId)
      ? actuales.filter((id) => id !== animalId)
      : [...actuales, animalId];
    setFavoritos(nuevos);
    set({ favoritos: nuevos });
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

  async cargarNotificaciones() {
    const { sesion } = get();
    if (!sesion) return;

    const { fetchNotificacionesDeUsuario } = await import("@/lib/notificacionesDb");
    const remotas = await fetchNotificacionesDeUsuario(sesion.usuarioId);
    if (!remotas) return;
    set({ notificaciones: remotas });
  },

  async marcarNotificacionLeida(id) {
    set({
      notificaciones: get().notificaciones.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    });
    const { marcarNotificacionLeidaDb } = await import("@/lib/notificacionesDb");
    await marcarNotificacionLeidaDb(id);
  },

  async marcarTodasNotificacionesLeidas() {
    const { sesion } = get();
    if (!sesion) return;
    set({ notificaciones: get().notificaciones.map((n) => ({ ...n, leida: true })) });
    const { marcarTodasLeidasDb } = await import("@/lib/notificacionesDb");
    await marcarTodasLeidasDb(sesion.usuarioId);
  },
}));
