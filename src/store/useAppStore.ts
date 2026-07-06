/**
 * Zustand store global de Moorcado.
 * No usa persist middleware — la hidratación se hace manualmente
 * desde un HydrationProvider en layout.tsx para compatibilidad SSR.
 */
import { create } from "zustand";
import type { Anuncio, Transaccion, Usuario } from "@/lib/types";
import type { SesionData, MensajesStore } from "@/lib/storage";

interface AppState {
  // ── Data ─────────────────────────────────────────────────────────────────
  sesion: SesionData | null;
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
}

export const useAppStore = create<AppState>((set, get) => ({
  sesion: null,
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
      getAnuncios,
      getFavoritos,
      getMensajes,
      getTransacciones,
      getUsuarios,
    } = require("@/lib/storage") as typeof import("@/lib/storage");

    set({
      sesion: getSesion(),
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
    })();
  },

  login(sesion) {
    const { setSesion } = require("@/lib/storage") as typeof import("@/lib/storage");
    setSesion(sesion);
    set({ sesion });
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
}));
