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

  return null;
}
