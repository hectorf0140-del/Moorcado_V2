"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

/**
 * Redirige a /login si el usuario no está autenticado.
 * Retorna { sesion, loading } para que la página decida qué renderizar.
 */
export function useAuthGuard() {
  const router = useRouter();
  const sesion = useAppStore((s) => s.sesion);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && !sesion) {
      router.replace("/login");
    }
  }, [hydrated, sesion, router]);

  return { sesion, loading: !hydrated };
}
