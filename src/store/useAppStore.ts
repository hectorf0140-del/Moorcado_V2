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
  agregarAnuncio: (anuncio: Anuncio) => void;
  actualizarAnuncio: (anuncio: Anuncio) => void;
  toggleFavorito: (animalId: string) => void;
  enviarMensaje: (
    animalId: string,
    vendedorId: string,
    texto: string
  ) => void;
  /** Trae de la BD los mensajes y favoritos del usuario (multi-dispositivo). */
  sincronizarDatosUsuario: (usuarioId: string) => Promise<void>;
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
      const { seedAnunciosDb, fetchAnunciosDb } = await import(
        "@/lib/anunciosDb"
      );
      const { anunciosSeed } = await import("@/data/animales");
      await seedAnunciosDb(anunciosSeed);
      const remotos = await fetchAnunciosDb();
      if (remotos && remotos.length > 0) {
        const { setAnuncios } =
          require("@/lib/storage") as typeof import("@/lib/storage");
        setAnuncios(remotos);
        set({ anuncios: remotos });
      }

      // Usuarios: misma estrategia (BD como fuente de verdad compartida)
      const { seedUsuariosDb, fetchUsuariosDb } = await import(
        "@/lib/usuariosDb"
      );
      const { usuariosSeed } = await import("@/data/usuarios");
      await seedUsuariosDb(usuariosSeed);
      const usuariosRemotos = await fetchUsuariosDb();
      if (usuariosRemotos && usuariosRemotos.length > 0) {
        const { setUsuarios } =
          require("@/lib/storage") as typeof import("@/lib/storage");
        setUsuarios(usuariosRemotos);
        set({ usuarios: usuariosRemotos });
      }

      // Transacciones: siembra y lee desde la BD
      const { seedTransaccionesDb, fetchTransaccionesDb } = await import(
        "@/lib/datosDb"
      );
      const { transaccionesSeed } = await import("@/data/transacciones");
      await seedTransaccionesDb(transaccionesSeed);
      const txRemotas = await fetchTransaccionesDb();
      if (txRemotas && txRemotas.length > 0) {
        const { setTransacciones } =
          require("@/lib/storage") as typeof import("@/lib/storage");
        setTransacciones(txRemotas);
        set({ transacciones: txRemotas });
      }

      // Mensajes y favoritos del usuario con sesión activa
      const sesionActual = get().sesion;
      if (sesionActual) {
        void get().sincronizarDatosUsuario(sesionActual.usuarioId);
      }
    })();
  },

  login(sesion) {
    const { setSesion } = require("@/lib/storage") as typeof import("@/lib/storage");
    setSesion(sesion);
    set({ sesion });
    void get().sincronizarDatosUsuario(sesion.usuarioId);
  },

  async sincronizarDatosUsuario(usuarioId) {
    const { fetchMensajesDb, fetchFavoritosDb } = await import("@/lib/datosDb");
    const { setMensajes, setFavoritos } =
      require("@/lib/storage") as typeof import("@/lib/storage");
    const [mensajesDb, favoritosDb] = await Promise.all([
      fetchMensajesDb(usuarioId),
      fetchFavoritosDb(usuarioId),
    ]);
    if (mensajesDb) {
      setMensajes(mensajesDb);
      set({ mensajes: mensajesDb });
    }
    if (favoritosDb) {
      setFavoritos(favoritosDb);
      set({ favoritos: favoritosDb });
    }
  },

  logout() {
    const { setSesion, setMensajes, setFavoritos } =
      require("@/lib/storage") as typeof import("@/lib/storage");
    setSesion(null);
    setMensajes({});
    setFavoritos([]);
    set({ sesion: null, mensajes: {}, favoritos: [] });
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
    const esFavorito = !actuales.includes(animalId);
    const nuevos = esFavorito
      ? [...actuales, animalId]
      : actuales.filter((id) => id !== animalId);
    setFavoritos(nuevos);
    set({ favoritos: nuevos });
    const { sesion } = get();
    if (sesion) {
      void import("@/lib/datosDb").then((db) =>
        db.setFavoritoDb(sesion.usuarioId, animalId, esFavorito)
      );
    }
  },

  enviarMensaje(animalId, vendedorId, texto) {
    const { getMensajes, setMensajes } =
      require("@/lib/storage") as typeof import("@/lib/storage");
    const { sesion } = get();
    if (!sesion) return;

    const todos = getMensajes();
    const hilo = todos[animalId] ?? [];
    const ahora = new Date().toLocaleTimeString("es-HN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const msgUsuario = {
      id: `msg-${Date.now()}`,
      autorId: sesion.usuarioId,
      texto,
      hora: ahora,
    };

    const nuevoHilo = [...hilo, msgUsuario];
    const nuevosMensajes = { ...todos, [animalId]: nuevoHilo };
    setMensajes(nuevosMensajes);
    set({ mensajes: nuevosMensajes });
    void import("@/lib/datosDb").then((db) =>
      db.insertMensajeDb(sesion.usuarioId, animalId, msgUsuario)
    );

    // Respuesta automática del vendedor después de 1.2s
    const respuestasMock = [
      "Sí, el animal sigue disponible. ¿Le interesa pasar a verlo esta semana?",
      "Buenos días. El precio incluye traslado hasta 50 km. ¿Dónde está ubicado usted?",
      "Gracias por su interés. Tiene todas las vacunas al día y puedo compartirle los documentos.",
      "Claro, podemos negociar el precio si lleva más de un animal. ¿Cuántos está buscando?",
      "El animal tiene registro SAG y está listo para moverse. ¿Cuándo le quedaría bien la visita?",
    ];
    const respuesta =
      respuestasMock[Math.floor(Math.random() * respuestasMock.length)];

    setTimeout(() => {
      const todosActualizados = getMensajes();
      const hiloActualizado = todosActualizados[animalId] ?? [];
      const msgVendedor = {
        id: `msg-${Date.now() + 1}`,
        autorId: vendedorId,
        texto: respuesta,
        hora: new Date().toLocaleTimeString("es-HN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      const hiloFinal = [...hiloActualizado, msgVendedor];
      const mensajesFinales = { ...todosActualizados, [animalId]: hiloFinal };
      setMensajes(mensajesFinales);
      set({ mensajes: mensajesFinales });
      void import("@/lib/datosDb").then((db) =>
        db.insertMensajeDb(sesion.usuarioId, animalId, msgVendedor)
      );
    }, 1200);
  },
}));
