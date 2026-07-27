"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

// Cuánto esperar entre dos refrescos automáticos aunque se disparen varios
// triggers casi juntos (cambio de página + foco de la pestaña, por
// ejemplo) — evita golpear Supabase con pedidos redundantes.
const REFRESCO_MIN_MS = 15 * 1000;
// Sondeo de respaldo mientras la pestaña sigue abierta y visible, para que
// algo publicado/aprobado por otra persona (u otra pestaña) aparezca sin
// que el usuario tenga que navegar o recargar.
const REFRESCO_INTERVALO_MS = 60 * 1000;

/**
 * Hidrata el store Zustand desde localStorage al montar.
 * Debe ser Client Component y vivir en el layout.
 */
export default function HydrationProvider() {
  const hydrate = useAppStore((s) => s.hydrate);
  const refrescar = useAppStore((s) => s.refrescar);
  const hydrated = useAppStore((s) => s.hydrated);
  const pathname = usePathname();
  const ultimoRefrescoRef = useRef(0);
  const primerPathnameRef = useRef(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Registra el service worker solo en producción — su único fin es que el
  // sitio sea instalable como app; en dev estorbaría más de lo que ayuda.
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Antes, la sincronización con Supabase solo corría una vez al cargar la
  // app: si alguien aprobaba una publicación, verificaba una cuenta, o
  // llegaba un mensaje nuevo, había que recargar la página entera (F5) para
  // verlo — la navegación normal entre secciones (un SPA) nunca volvía a
  // pedir datos frescos. Estos tres triggers cubren los casos reales sin
  // sondear todo el tiempo: cambiar de página, volver a la pestaña, y un
  // respaldo periódico mientras se queda quieto en una sola pantalla.
  function refrescarConThrottle() {
    const ahora = Date.now();
    if (ahora - ultimoRefrescoRef.current < REFRESCO_MIN_MS) return;
    ultimoRefrescoRef.current = ahora;
    void refrescar();
  }

  useEffect(() => {
    if (!hydrated) return;
    // La primera vez que `hydrated` pasa a true ya dispara su propia
    // sincronización de fondo (ver hydrate() en el store) — este efecto
    // solo debe reaccionar a cambios de página posteriores.
    if (primerPathnameRef.current) {
      primerPathnameRef.current = false;
      return;
    }
    refrescarConThrottle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hydrated]);

  useEffect(() => {
    function alVolverVisible() {
      if (document.visibilityState === "visible") refrescarConThrottle();
    }
    document.addEventListener("visibilitychange", alVolverVisible);
    window.addEventListener("focus", alVolverVisible);
    return () => {
      document.removeEventListener("visibilitychange", alVolverVisible);
      window.removeEventListener("focus", alVolverVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refrescarConThrottle();
    }, REFRESCO_INTERVALO_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
