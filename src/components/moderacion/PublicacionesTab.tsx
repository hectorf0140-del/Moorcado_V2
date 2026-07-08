"use client";

import { useMemo, useState } from "react";
import { Ban, Check, ChevronDown } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Anuncio } from "@/lib/types";
import { formatLempiras } from "@/lib/format";
import BuscadorInput from "../BuscadorInput";
import Paginacion from "./Paginacion";
import AnuncioResumenModeracion from "./AnuncioResumenModeracion";

const POR_PAGINA = 10;

export default function PublicacionesTab() {
  const usuarios = useAppStore((s) => s.usuarios);
  const anuncios = useAppStore((s) => s.anuncios);
  const actualizarAnuncio = useAppStore((s) => s.actualizarAnuncio);

  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [expandido, setExpandido] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return anuncios;
    return anuncios.filter((a) => {
      const vendedor = usuarios.find((u) => u.id === a.vendedorId);
      return (
        (a.nombre ?? "").toLowerCase().includes(q) ||
        (a.titulo ?? "").toLowerCase().includes(q) ||
        (a.raza ?? "").toLowerCase().includes(q) ||
        (vendedor?.nombre ?? "").toLowerCase().includes(q)
      );
    });
  }, [anuncios, usuarios, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  async function toggleActivoAnuncio(anuncio: Anuncio) {
    const actualizado = { ...anuncio, activo: anuncio.activo === false };
    actualizarAnuncio(actualizado);
    const { upsertAnuncioDb } = await import("@/lib/anunciosDb");
    void upsertAnuncioDb(actualizado);
  }

  return (
    <section className="space-y-4">
      <BuscadorInput
        value={busqueda}
        onChange={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        placeholder="Buscar por nombre, raza o vendedor..."
      />
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-display font-bold text-moorcado-gray-dark">
          Publicaciones ({filtrados.length})
        </h2>
        {visibles.length === 0 ? (
          <p className="mt-3 text-sm text-moorcado-gray-dark/50">
            No se encontraron publicaciones.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {visibles.map((a) => {
              const expandidoActual = expandido === a.id;
              const vendedor = usuarios.find((u) => u.id === a.vendedorId);
              const desactivada = a.activo === false;
              return (
                <li key={a.id} className="rounded-xl bg-moorcado-gray-light">
                  <button
                    onClick={() => setExpandido(expandidoActual ? null : a.id)}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left"
                  >
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-moorcado-gray-dark">
                        {a.nombre} · {a.raza}
                        {desactivada && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            {a.retiradoPorModeracion ? "Retirada por reporte" : "Desactivada"}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-moorcado-gray-dark/60">
                        {formatLempiras(a.precio)} · {a.departamento} · {vendedor?.nombre ?? a.vendedorId}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-moorcado-gray-dark/40 transition-transform ${
                        expandidoActual ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandidoActual && (
                    <div className="space-y-3 border-t border-black/5 px-3 pb-3 pt-3">
                      <AnuncioResumenModeracion anuncio={a} vendedor={vendedor} />
                      <button
                        onClick={() => toggleActivoAnuncio(a)}
                        className={`flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold ${
                          desactivada
                            ? "bg-moorcado-green/10 text-moorcado-green hover:bg-moorcado-green/20"
                            : "bg-red-100 text-red-600 hover:bg-red-200"
                        }`}
                      >
                        {desactivada ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Reactivar publicación
                          </>
                        ) : (
                          <>
                            <Ban className="h-3.5 w-3.5" />
                            Desactivar publicación
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <Paginacion paginaActual={paginaActual} totalPaginas={totalPaginas} onCambiar={setPagina} />
      </div>
    </section>
  );
}
