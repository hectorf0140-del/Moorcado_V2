"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * true si el viewport cumple `query` (ej. "(max-width: 767px)").
 *
 * `useSyncExternalStore` con `getServerSnapshot` fijo en `false` es el
 * patrón recomendado por React para leer un API del navegador (matchMedia)
 * sin que la primera pasada del cliente (hidratación) difiera del HTML
 * generado en el servidor — evita el warning de hydration mismatch que
 * daría un `useState` + `useEffect` a mano.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
