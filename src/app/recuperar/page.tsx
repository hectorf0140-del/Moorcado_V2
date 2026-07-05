"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/Logo";

export default function RecuperarPage() {
  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviado(true);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5 sm:p-10">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center font-display text-2xl font-bold text-moorcado-gray-dark">
          Recuperar contraseña
        </h1>

        {enviado ? (
          <div className="mt-6 text-center">
            <p className="text-4xl">📬</p>
            <p className="mt-3 text-moorcado-gray-dark/80">
              Te hemos enviado un correo a{" "}
              <span className="font-semibold">{correo}</span> con instrucciones
              para restablecer tu contraseña.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-block rounded-full bg-moorcado-green px-6 py-2.5 text-sm font-semibold text-white"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-moorcado-gray-dark/60">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu
              contraseña.
            </p>
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                  Correo electrónico
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
              <button
                type="submit"
                className="w-full rounded-full bg-moorcado-green py-3.5 text-base font-bold text-white transition hover:bg-moorcado-green/90"
              >
                Enviar instrucciones
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-moorcado-gray-dark/70">
              <Link href="/login" className="font-semibold text-moorcado-green">
                Volver al inicio de sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
