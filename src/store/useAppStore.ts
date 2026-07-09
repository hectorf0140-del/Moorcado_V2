/**
 * Zustand store global de Moorcado.
 * No usa persist middleware — la hidratación se hace manualmente
 * desde un HydrationProvider en layout.tsx para compatibilidad SSR.
 */
import { create } from "zustand";
import type { Anuncio, NotificacionItem, Transaccion, Usuario } from "@/lib/types";
import type { AdminSesionData, SesionData, MensajesStore } from "@/lib/storage";
import { UBICACION_REFERENCIA_DEFAULT } from "@/lib/geo";

// Cuánto tiempo se le da a una publicación/edición local a terminar de
// sincronizar con Supabase antes de considerarla "confirmada". Pasado este
// tiempo, si ya no aparece en la respuesta remota es porque se borró de
// verdad (en este navegador, en otro dispositivo, o manualmente en la base
// de datos) — no porque el upsert siga pendiente.
const VENTANA_GRACIA_SYNC_MS = 3 * 60 * 1000;

/**
 * Combina los anuncios locales con los que trae la sincronización de fondo,
 * usando Supabase como fuente de verdad: si algo se borró ahí, desaparece
 * también del cache local (antes se quedaba pegado para siempre porque el
 * cache local nunca se limpiaba). La única excepción es una publicación o
 * edición muy reciente que todavía no terminó de sincronizar — esa sí se
 * conserva aunque aún no aparezca en la respuesta remota.
 */
function fusionarAnuncios(locales: Anuncio[], remotos: Anuncio[]): Anuncio[] {
  const remotosPorId = new Map(remotos.map((r) => [r.id, r]));
  const ahora = Date.now();
  const resultado = new Map<string, Anuncio>(remotosPorId);

  for (const local of locales) {
    const remoto = remotosPorId.get(local.id);
    const tsLocal = new Date(local.actualizadoEn ?? local.creadoEn).getTime();

    if (!remoto) {
      if (ahora - tsLocal < VENTANA_GRACIA_SYNC_MS) {
        resultado.set(local.id, local);
      }
      continue;
    }

    const tsRemoto = new Date(remoto.actualizadoEn ?? remoto.creadoEn).getTime();
    if (tsLocal > tsRemoto) {
      resultado.set(local.id, local);
    }
  }

  return Array.from(resultado.values()).sort(
    (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
  );
}

/**
 * Guarda un anuncio en Supabase con un reintento si el primer intento
 * falla (red inestable, error transitorio del gateway). Con esto, una
 * publicación con varias fotos tiene dos oportunidades de aterrizar antes
 * de que la sincronización de fondo pueda toparse con una versión vieja.
 */
async function upsertAnuncioConReintento(anuncio: Anuncio): Promise<void> {
  const { upsertAnuncioDb } = await import("@/lib/anunciosDb");
  const ok = await upsertAnuncioDb(anuncio);
  if (!ok) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await upsertAnuncioDb(anuncio);
  }
}

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
  // Punto desde el que se calcula "distancia" en catálogo/mapa. Arranca en
  // Tegucigalpa (centro del país) y se reemplaza por la ubicación real del
  // navegador si el usuario la comparte — ver `detectarUbicacion`.
  ubicacionReferencia: { lat: number; lng: number };

  // ── Actions ───────────────────────────────────────────────────────────────
  hydrate: () => void;
  detectarUbicacion: () => void;
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
  marcarConversacionLeida: (conversacionId: string) => Promise<void>;
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
  ubicacionReferencia: UBICACION_REFERENCIA_DEFAULT,

  detectarUbicacion() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set({
          ubicacionReferencia: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        });
      },
      () => {
        // Permiso denegado o no disponible — se queda con Tegucigalpa.
      },
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  },

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

    get().detectarUbicacion();

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
        const fusionados = fusionarAnuncios(get().anuncios, remotos);
        const { setAnuncios } =
          require("@/lib/storage") as typeof import("@/lib/storage");
        setAnuncios(fusionados);
        set({ anuncios: fusionados });
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
    const marcado = { ...anuncio, actualizadoEn: new Date().toISOString() };
    const { getAnuncios, setAnuncios } =
      require("@/lib/storage") as typeof import("@/lib/storage");
    const actuales = getAnuncios();
    const nuevos = [marcado, ...actuales];
    setAnuncios(nuevos);
    set({ anuncios: nuevos });
    void upsertAnuncioConReintento(marcado);
  },

  actualizarAnuncio(anuncio) {
    const marcado = { ...anuncio, actualizadoEn: new Date().toISOString() };
    const { getAnuncios, setAnuncios } =
      require("@/lib/storage") as typeof import("@/lib/storage");
    const actuales = getAnuncios();
    const nuevos = actuales.map((a) => (a.id === marcado.id ? marcado : a));
    setAnuncios(nuevos);
    set({ anuncios: nuevos });
    void upsertAnuncioConReintento(marcado);
  },

  toggleFavorito(animalId) {
    // Solo se guarda si hay una cuenta con sesión iniciada — un visitante
    // sin cuenta no tiene dónde persistir sus favoritos.
    const { sesion, usuarios, anuncios } = get();
    if (!sesion) return;

    const usuario = usuarios.find((u) => u.id === sesion.usuarioId);
    if (!usuario) return;

    const actuales = usuario.favoritos ?? [];
    const seAgrega = !actuales.includes(animalId);
    const nuevos = seAgrega
      ? [...actuales, animalId]
      : actuales.filter((id) => id !== animalId);
    const actualizado = { ...usuario, favoritos: nuevos };

    get().actualizarUsuario(actualizado);
    const { setUsuarios } = require("@/lib/storage") as typeof import("@/lib/storage");
    setUsuarios(get().usuarios);
    void import("@/lib/usuariosDb").then((db) => db.upsertUsuarioDb(actualizado));

    // Se notifica al vendedor solo al agregar a favoritos (no al quitar),
    // y nunca si el propio vendedor marca su publicación.
    if (seAgrega) {
      const anuncio = anuncios.find((a) => a.id === animalId);
      if (anuncio && anuncio.vendedorId !== usuario.id) {
        void import("@/lib/notificacionesDb").then(({ crearNotificacionDb }) =>
          crearNotificacionDb({
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            usuarioId: anuncio.vendedorId,
            tipo: "favorito",
            titulo: "A alguien le gustó tu publicación",
            descripcion: `${usuario.nombre} marcó "${anuncio.titulo || anuncio.nombre}" como favorito.`,
            referenciaId: anuncio.id,
          })
        );
      }
    }
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
      leido: false,
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

  async marcarConversacionLeida(conversacionId) {
    const { sesion, mensajes } = get();
    if (!sesion) return;
    const hilo = mensajes[conversacionId];
    if (!hilo || !hilo.some((m) => m.destinatarioId === sesion.usuarioId && m.leido === false))
      return;

    const nuevoHilo = hilo.map((m) =>
      m.destinatarioId === sesion.usuarioId ? { ...m, leido: true } : m
    );
    const nuevosMensajes = { ...mensajes, [conversacionId]: nuevoHilo };
    const { setMensajes } = require("@/lib/storage") as typeof import("@/lib/storage");
    setMensajes(nuevosMensajes);
    set({ mensajes: nuevosMensajes });

    const { marcarConversacionLeidaDb } = await import("@/lib/mensajesDb");
    await marcarConversacionLeidaDb(conversacionId, sesion.usuarioId);
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
