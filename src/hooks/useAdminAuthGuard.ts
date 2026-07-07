"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

/**
 * Redirige a /admin/login si no hay sesión de moderador activa.
 * Independiente de useAuthGuard: un usuario normal logueado NO cuenta
 * como moderador solo por eso.
 */
export function useAdminAuthGuard() {
  const router = useRouter();
  const adminSesion = useAppStore((s) => s.adminSesion);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && !adminSesion) {
      router.replace("/admin/login");
    }
  }, [hydrated, adminSesion, router]);

  return { adminSesion, loading: !hydrated };
}
