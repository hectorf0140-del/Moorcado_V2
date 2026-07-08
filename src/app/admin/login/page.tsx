"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const loginAdmin = useAppStore((s) => s.loginAdmin);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const { verificarModerador } = await import("@/lib/moderadoresDb");
      const sesion = await verificarModerador(correo, contrasena);

      if (!sesion) {
        setError("Correo o contraseña incorrectos.");
        return;
      }

      loginAdmin(sesion);
      router.push(sesion.rol === "super_admin" ? "/admin" : "/moderador");
    } catch (error) {
      console.error("Error en login de administración:", error);
      setError("Ocurrió un error al iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 sm:p-10">
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-moorcado-gray-dark text-white">
            <ShieldCheck className="h-6 w-6" />
          </span>
        </div>
        <h1 className="mt-6 text-center font-display text-2xl font-bold text-moorcado-gray-dark">
          Acceso de administración
        </h1>
        <p className="mt-1 text-center text-sm text-moorcado-gray-dark/60">
          Solo para moderadores autorizados de Moorcado.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Correo
            </span>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="moderador@moorcado.hn"
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-3 text-sm outline-none focus:border-moorcado-gray-dark focus:ring-2 focus:ring-black/10"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Contraseña
            </span>
            <input
              type="password"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-3 text-sm outline-none focus:border-moorcado-gray-dark focus:ring-2 focus:ring-black/10"
            />
          </label>

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-full bg-moorcado-gray-dark py-3.5 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-70"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
