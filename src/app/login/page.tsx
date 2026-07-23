"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { asegurarPerfilUsuario, construirSesionDesdeUsuario, mensajeErrorAuth } from "@/lib/auth";
import { Spinner } from "@/components/Spinner";

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const actualizarUsuario = useAppStore((s) => s.actualizarUsuario);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const { data, error: errorAuth } = await supabase.auth.signInWithPassword({
        email: correo,
        password: contrasena,
      });

      if (errorAuth || !data.user) {
        setError(mensajeErrorAuth(errorAuth));
        return;
      }

      const usuario = await asegurarPerfilUsuario(data.user);
      if (!usuario) {
        setError(
          "No pudimos cargar tu perfil por un problema de conexión. Revisa tu internet e inténtalo de nuevo."
        );
        return;
      }

      if (usuario.estadoCuenta === "suspendido") {
        await supabase.auth.signOut();
        setError(
          `Tu cuenta ha sido suspendida${
            usuario.estadoCuentaMotivo ? `: ${usuario.estadoCuentaMotivo}` : "."
          } Contacta a soporte si crees que es un error.`
        );
        return;
      }

      const sesion = construirSesionDesdeUsuario(usuario);
      login(sesion);
      actualizarUsuario(usuario);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error en login:", error);
      setError(
        "Ocurrió un error al iniciar sesión. Por favor inténtalo de nuevo más tarde."
      );
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
          Bienvenido de nuevo
        </h1>
        <p className="mt-1 text-center text-sm text-moorcado-gray-dark/60">
          Ingresa a tu cuenta para continuar
        </p>

        <p className="mt-3 rounded-xl bg-moorcado-green/5 px-4 py-2.5 text-center text-xs text-moorcado-gray-dark/70">
          Ingresa con tu correo electrónico y contraseña. Si aún no tienes cuenta,
          crea una gratis en el formulario de registro.
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
            className="flex w-full items-center justify-center gap-2 rounded-full bg-moorcado-green py-3.5 text-base font-bold text-white transition hover:bg-moorcado-green/90 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            {cargando && <Spinner tamano="sm" color="blanco" />}
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
