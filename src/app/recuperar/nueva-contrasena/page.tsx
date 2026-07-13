"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";

/**
 * Destino del enlace de recuperación de contraseña (ver
 * src/app/recuperar/page.tsx). Al abrir el enlace, Supabase ya deja una
 * sesión de recuperación activa en este navegador — aquí solo se pide la
 * contraseña nueva.
 */
export default function NuevaContrasenaPage() {
  const router = useRouter();
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (contrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    try {
      const { error: errorAuth } = await supabase.auth.updateUser({ password: contrasena });
      if (errorAuth) {
        setError(
          "No pudimos actualizar tu contraseña. El enlace puede haber expirado — solicita uno nuevo."
        );
        return;
      }
      await supabase.auth.signOut();
      setListo(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("Ocurrió un error. Por favor inténtalo de nuevo más tarde.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 sm:p-10">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center font-display text-2xl font-bold text-moorcado-gray-dark">
          Elige una nueva contraseña
        </h1>

        {listo ? (
          <div className="mt-6 text-center">
            <p className="text-4xl">✅</p>
            <p className="mt-3 text-moorcado-gray-dark/80">
              Tu contraseña se actualizó. Ya puedes iniciar sesión con ella.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-block rounded-full bg-moorcado-green px-6 py-2.5 text-sm font-semibold text-white"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Contraseña nueva
              </span>
              <input
                type="password"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-3 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Confirmar contraseña
              </span>
              <input
                type="password"
                required
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-3 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
              />
            </label>
            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-full bg-moorcado-green py-3.5 text-base font-bold text-white transition hover:bg-moorcado-green/90 disabled:opacity-70"
            >
              {cargando ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
