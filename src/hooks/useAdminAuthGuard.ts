"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

/**
 * Redirige a /admin/login si no hay sesión de moderador activa.
 * Independiente de useAuthGuard: un usuario normal logueado NO cuenta
 * como moderador solo por eso.
 *
 * `requiredRole` restringe el acceso a un rol específico: "super_admin"
 * es exclusivo del panel /admin; el panel /moderador no exige rol porque
 * un super_admin también puede moderar (ver useAdminAuthGuard() sin
 * argumentos en ModeradorClient).
 */
export function useAdminAuthGuard(requiredRole?: "super_admin" | "moderador") {
  const router = useRouter();
  const adminSesion = useAppStore((s) => s.adminSesion);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!adminSesion) {
      router.replace("/admin/login");
      return;
    }
    if (requiredRole === "super_admin" && adminSesion.rol !== "super_admin") {
      router.replace("/moderador");
    }
  }, [hydrated, adminSesion, requiredRole, router]);

  return { adminSesion, loading: !hydrated };
}
