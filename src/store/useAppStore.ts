/**
 * Zustand store global de Moorcado.
 * No usa persist middleware — la hidratación se hace manualmente
 * desde un HydrationProvider en layout.tsx para compatibilidad SSR.
 */
import { create } from "zustand";
import type { Anuncio, NotificacionItem, Transaccion, Usuario } from "@/lib/types";
import type { AdminSesionData, SesionData, MensajesStore } from "@/lib/storage";
import {
  getSesion,
  getAdminSesion,
  getAnuncios,
  getMensajes,
  getTransacciones,
  getUsuarios,
  setSesion,
  setAdminSesion,
  setAnuncios,
  setMensajes,
  setTransacciones,
  setUsuarios,
} from "@/lib/storage";
import { UBICACION_REFERENCIA_DEFAULT } from "@/lib/geo";
import { supabase } from "@/lib/supabase";

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

/**
 * Revisa las búsquedas guardadas de otras cuentas empresa y les crea una
 * notificación cuando el anuncio recién publicado calza con su filtro.
 * Se reutiliza el tipo "animal_similar" ya existente en vez de agregar uno
 * nuevo a la tabla de notificaciones.
 */
async function notificarBusquedasCoincidentes(anuncio: Anuncio): Promise<void> {
  const { fetchTodasLasBusquedasGuardadas } = await import("@/lib/busquedasGuardadasDb");
  const busquedas = await fetchTodasLasBusquedasGuardadas();
  if (!busquedas || busquedas.length === 0) return;

  const { crearNotificacionDb } = await import("@/lib/notificacionesDb");

  for (const b of busquedas) {
    if (b.usuarioId === anuncio.vendedorId) continue;
    const f = b.filtros;
    if (f.departamento && f.departamento !== anuncio.departamento) continue;
    if (f.raza && f.raza !== anuncio.raza) continue;
    if (f.sexo && f.sexo !== anuncio.sexo) continue;
    if (f.tipo && f.tipo !== anuncio.tipo) continue;
    if (typeof f.precioMax === "number" && anuncio.precio > f.precioMax) continue;
    if (typeof f.pesoMax === "number" && anuncio.pesoKg > f.pesoMax) continue;

    void crearNotificacionDb({
      usuarioId: b.usuarioId,
      tipo: "animal_similar",
      titulo: `Nuevo animal para tu búsqueda "${b.nombre}"`,
      descripcion: `${anuncio.titulo || anuncio.nombre} — ${anuncio.departamento}`,
      referenciaId: anuncio.id,
    });
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
  enviarOferta: (destinatarioId: string, monto: number, animalId?: string) => Promise<void>;
  responderOferta: (mensajeId: string, respuesta: "aceptada" | "rechazada") => Promise<void>;
  cargarConversacion: (otroUsuarioId: string) => Promise<void>;
  cargarBandejaMensajes: () => Promise<void>;
  marcarConversacionLeida: (conversacionId: string) => Promise<void>;
  registrarTransaccionLocal: (transaccion: Transaccion) => void;
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
      // La sesión real vive en Supabase Auth, no en el objeto cacheado en
      // localStorage (que solo sirve para pintar algo antes de que esto
      // resuelva). Se reconcilia apenas se puede, y se re-chequea en cada
      // cambio de sesión (logout en otra pestaña, expiración del token).
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { asegurarPerfilUsuario, construirSesionDesdeUsuario } = await import("@/lib/auth");
        const usuario = await asegurarPerfilUsuario(session.user);
        if (usuario) {
          const sesionReal = construirSesionDesdeUsuario(usuario);
          setSesion(sesionReal);
          set({ sesion: sesionReal, favoritos: usuario.favoritos ?? [] });
        }
      } else if (get().sesion) {
        setSesion(null);
        set({ sesion: null, favoritos: [] });
      }

      supabase.auth.onAuthStateChange((_evento, sesionSupabase) => {
        if (!sesionSupabase?.user && get().sesion) {
          setSesion(null);
          set({ sesion: null, favoritos: [] });
        }
      });

      const { fetchAnunciosDb } = await import("@/lib/anunciosDb");
      const remotos = await fetchAnunciosDb();
      if (remotos && remotos.length > 0) {
        const fusionados = fusionarAnuncios(get().anuncios, remotos);
        setAnuncios(fusionados);
        set({ anuncios: fusionados });
      }

      // Usuarios: misma estrategia (BD como fuente de verdad compartida)
      const { fetchUsuariosDb } = await import("@/lib/usuariosDb");
      const usuariosRemotos = await fetchUsuariosDb();
      if (usuariosRemotos && usuariosRemotos.length > 0) {
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
        setTransacciones(transaccionesRemotas);
        set({ transacciones: transaccionesRemotas });
      }
    })();
  },

  login(sesion) {
    setSesion(sesion);
    set({ sesion });
  },

  loginAdmin(adminSesion) {
    setAdminSesion(adminSesion);
    set({ adminSesion });
  },

  logoutAdmin() {
    setAdminSesion(null);
    set({ adminSesion: null });
  },

  logout() {
    void supabase.auth.signOut();
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
    const actuales = getAnuncios();
    const nuevos = [marcado, ...actuales];
    setAnuncios(nuevos);
    set({ anuncios: nuevos });
    void upsertAnuncioConReintento(marcado);
    void notificarBusquedasCoincidentes(marcado);
  },

  actualizarAnuncio(anuncio) {
    const marcado = { ...anuncio, actualizadoEn: new Date().toISOString() };
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
    setUsuarios(get().usuarios);
    void import("@/lib/usuariosDb").then((db) => db.upsertUsuarioDb(actualizado));

    // Se notifica al vendedor solo al agregar a favoritos (no al quitar),
    // y nunca si el propio vendedor marca su publicación.
    if (seAgrega) {
      const anuncio = anuncios.find((a) => a.id === animalId);
      if (anuncio && anuncio.vendedorId !== usuario.id) {
        void import("@/lib/notificacionesDb").then(({ crearNotificacionDb }) =>
          crearNotificacionDb({
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
      tipo: "texto" as const,
    };

    // Optimista: se muestra de inmediato, se confirma en Supabase después.
    const todos = getMensajes();
    const hilo = todos[convId] ?? [];
    const nuevosMensajes = { ...todos, [convId]: [...hilo, mensaje] };
    setMensajes(nuevosMensajes);
    set({ mensajes: nuevosMensajes });

    await enviarMensajeDb(mensaje);
  },

  async enviarOferta(destinatarioId, monto, animalId) {
    const { sesion } = get();
    if (!sesion || !(monto > 0)) return;

    const { conversacionId, enviarMensajeDb, marcarOfertasAnterioresSuperadasDb } = await import(
      "@/lib/mensajesDb"
    );

    const convId = conversacionId(sesion.usuarioId, destinatarioId);
    const mensaje = {
      id: `msg-${Date.now()}`,
      conversacionId: convId,
      autorId: sesion.usuarioId,
      destinatarioId,
      animalId,
      texto: `Oferta: ${monto.toLocaleString("es-HN")} lempiras`,
      creadoEn: new Date().toISOString(),
      leido: false,
      tipo: "oferta" as const,
      ofertaMonto: monto,
      ofertaEstado: "pendiente" as const,
    };

    const todos = getMensajes();
    const hilo = (todos[convId] ?? []).map((m) =>
      m.tipo === "oferta" && m.ofertaEstado === "pendiente" ? { ...m, ofertaEstado: "superada" as const } : m
    );
    const nuevosMensajes = { ...todos, [convId]: [...hilo, mensaje] };
    setMensajes(nuevosMensajes);
    set({ mensajes: nuevosMensajes });

    const ok = await enviarMensajeDb(mensaje);
    if (ok) await marcarOfertasAnterioresSuperadasDb(convId, mensaje.id);
  },

  async responderOferta(mensajeId, respuesta) {
    const { mensajes, anuncios, actualizarAnuncio, registrarTransaccionLocal } = get();
    const { responderOfertaDb } = await import("@/lib/mensajesDb");

    const nuevosMensajes: MensajesStore = {};
    for (const [convId, hilo] of Object.entries(mensajes)) {
      nuevosMensajes[convId] = hilo.map((m) =>
        m.id === mensajeId ? { ...m, ofertaEstado: respuesta } : m
      );
    }
    setMensajes(nuevosMensajes);
    set({ mensajes: nuevosMensajes });

    await responderOfertaDb(mensajeId, respuesta);

    // Al aceptar una oferta, el anuncio pasa a "vendido" en el catálogo —
    // misma operación atómica que usa GestionarAnuncio (ver
    // migracion_venta_atomica.sql), aquí disparada desde el chat en vez
    // del panel manual.
    if (respuesta === "aceptada") {
      const mensajeOferta = Object.values(mensajes)
        .flat()
        .find((m) => m.id === mensajeId);
      const anuncio = mensajeOferta?.animalId
        ? anuncios.find((a) => a.id === mensajeOferta.animalId)
        : undefined;
      if (mensajeOferta && anuncio && !anuncio.vendido) {
        const { marcarAnuncioVendidoDb } = await import("@/lib/anunciosDb");
        // La oferta la pudo haber mandado el comprador o el vendedor (un
        // contraofrecimiento) — el comprador es quien no sea el vendedor.
        const compradorId =
          mensajeOferta.autorId === anuncio.vendedorId
            ? mensajeOferta.destinatarioId
            : mensajeOferta.autorId;
        const precioFinal = mensajeOferta.ofertaMonto ?? anuncio.precio;
        const transaccionId = await marcarAnuncioVendidoDb(anuncio.id, compradorId, precioFinal);
        if (transaccionId) {
          registrarTransaccionLocal({
            id: transaccionId,
            animalId: anuncio.id,
            compradorId,
            vendedorId: anuncio.vendedorId,
            precio: precioFinal,
            fecha: new Date().toISOString(),
          });
          actualizarAnuncio({ ...anuncio, vendido: true, enNegociacion: false, activo: false });
        }
      }
    }
  },

  async cargarConversacion(otroUsuarioId) {
    const { sesion } = get();
    if (!sesion) return;

    const { conversacionId, fetchConversacion } = await import("@/lib/mensajesDb");
    const convId = conversacionId(sesion.usuarioId, otroUsuarioId);
    const remotos = await fetchConversacion(convId);
    if (!remotos) return;

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
    setMensajes(nuevosMensajes);
    set({ mensajes: nuevosMensajes });

    const { marcarConversacionLeidaDb } = await import("@/lib/mensajesDb");
    await marcarConversacionLeidaDb(conversacionId, sesion.usuarioId);
  },

  registrarTransaccionLocal(transaccion) {
    // La transacción ya se creó del lado del servidor (ver
    // marcarAnuncioVendidoDb / marcar_anuncio_vendido) — esto solo refleja
    // el resultado en el cache local.
    const actuales = getTransacciones();
    const nuevas = [transaccion, ...actuales];
    setTransacciones(nuevas);
    set({ transacciones: nuevas });
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
