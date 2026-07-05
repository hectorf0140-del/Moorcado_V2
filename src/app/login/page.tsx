"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { useAppStore } from "@/store/useAppStore";
import { getUsuarios, setSesion } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    const usuarios = getUsuarios();
    const usuario = usuarios.find(
      (u) => u.correo.toLowerCase() === correo.toLowerCase()
    );

    if (!usuario || usuario.password !== contrasena) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }

    const sesion = {
      usuarioId: usuario.id,
      nombre: usuario.nombre,
      iniciales: usuario.iniciales,
      avatarColor: usuario.avatarColor,
    };
    setSesion(sesion);
    login(sesion);
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 sm:p-10">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center font-display text-2xl font-bold text-moorcado-gray-dark">
          Bienvenido de nuevo
        </h1>
        <p className="mt-1 text-center text-sm text-moorcado-gray-dark/60">
          Ingresa a tu cuenta para continuar
        </p>

        <p className="mt-3 rounded-xl bg-moorcado-green/5 px-4 py-2.5 text-center text-xs text-moorcado-gray-dark/70">
          Demo: usa cualquier correo de los usuarios seed con contraseña{" "}
          <span className="font-mono font-semibold">demo1234</span>
          <br />
          Ej: <span className="font-mono">jose.martinez@example.com</span>
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
              placeholder="tucorreo@ejemplo.com"
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-3 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
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
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-3 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
            />
          </label>

          <div className="text-right">
            <Link href="/recuperar" className="text-sm font-medium text-moorcado-green">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-full bg-moorcado-green py-3.5 text-base font-bold text-white transition hover:bg-moorcado-green/90 disabled:opacity-70"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-moorcado-gray-dark/70">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-moorcado-green">
            Crea una gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
