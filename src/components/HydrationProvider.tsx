"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

/**
 * Hidrata el store Zustand desde localStorage al montar.
 * Debe ser Client Component y vivir en el layout.
 */
export default function HydrationProvider() {
  const hydrate = useAppStore((s) => s.hydrate);

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

  return null;
}
