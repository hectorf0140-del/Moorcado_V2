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
  const usuarios = useAppStore((s) => s.usuarios);
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    if (!hydrated) return;
    if (!sesion) {
      router.replace("/login");
      return;
    }
    // Si la cuenta fue suspendida después de iniciar sesión (localStorage
    // ya tenía la sesión guardada), se cierra sesión en el próximo acceso
    // a una página protegida, no solo al intentar volver a iniciar sesión.
    const usuario = usuarios.find((u) => u.id === sesion.usuarioId);
    if (usuario?.estadoCuenta === "suspendido") {
      logout();
      router.replace("/login");
    }
  }, [hydrated, sesion, usuarios, logout, router]);

  return { sesion, loading: !hydrated };
}
