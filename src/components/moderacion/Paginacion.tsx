"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Paginacion({
  paginaActual,
  totalPaginas,
  onCambiar,
}: {
  paginaActual: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        onClick={() => onCambiar(Math.max(1, paginaActual - 1))}
        disabled={paginaActual === 1}
        aria-label="Página anterior"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-moorcado-gray-dark shadow-sm ring-1 ring-black/10 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {Array.from({ length: totalPaginas }, (_, i) => i + 1)
        .filter((n) => n === 1 || n === totalPaginas || Math.abs(n - paginaActual) <= 1)
        .map((n, i, arr) => (
          <span key={n} className="flex items-center gap-2">
            {i > 0 && arr[i - 1] !== n - 1 && (
              <span className="text-sm text-moorcado-gray-dark/40">…</span>
            )}
            <button
              onClick={() => onCambiar(n)}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                n === paginaActual
                  ? "bg-moorcado-green text-white"
                  : "bg-white text-moorcado-gray-dark shadow-sm ring-1 ring-black/10 hover:bg-moorcado-gray-light"
              }`}
            >
              {n}
            </button>
          </span>
        ))}

      <button
        onClick={() => onCambiar(Math.min(totalPaginas, paginaActual + 1))}
        disabled={paginaActual === totalPaginas}
        aria-label="Página siguiente"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-moorcado-gray-dark shadow-sm ring-1 ring-black/10 disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
