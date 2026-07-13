"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error no controlado:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl">🐄</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
        Algo salió mal
      </h1>
      <p className="mt-2 max-w-sm text-moorcado-gray-dark/60">
        Tuvimos un problema mostrando esta página. Puedes intentar de nuevo o
        volver al inicio.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="rounded-full bg-moorcado-green px-6 py-3 text-sm font-bold text-white transition hover:bg-moorcado-green/90"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-moorcado-gray-dark transition hover:bg-moorcado-gray-light"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
