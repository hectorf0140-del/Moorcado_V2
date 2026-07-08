"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Gavel, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Apelacion } from "@/lib/apelacionesDb";
import type { NotificacionItem } from "@/lib/types";
import { reactivarAnuncioPorApelacion } from "@/lib/moderacionHelpers";
import BuscadorInput from "../BuscadorInput";
import Paginacion from "./Paginacion";
import AnuncioResumenModeracion from "./AnuncioResumenModeracion";

const POR_PAGINA = 10;

export default function ApelacionesTab({
  moderadorId,
  moderadorNombre,
}: {
  moderadorId: string;
  moderadorNombre: string;
}) {
  const usuarios = useAppStore((s) => s.usuarios);
  const anuncios = useAppStore((s) => s.anuncios);
  const actualizarAnuncio = useAppStore((s) => s.actualizarAnuncio);

  const [apelaciones, setApelaciones] = useState<Apelacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [notaResolucion, setNotaResolucion] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelado = false;
    import("@/lib/apelacionesDb").then(({ fetchApelaciones }) =>
      fetchApelaciones().then((a) => {
        if (!cancelado) {
          setApelaciones(a ?? []);
          setCargando(false);
        }
      })
    );
    return () => {
      cancelado = true;
    };
  }, []);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return apelaciones;
    return apelaciones.filter((ap) => {
      const anuncio = anuncios.find((a) => a.id === ap.anuncioId);
      const vendedor = usuarios.find((u) => u.id === ap.vendedorId);
      return (
        (anuncio?.titulo ?? "").toLowerCase().includes(q) ||
        (vendedor?.nombre ?? "").toLowerCase().includes(q) ||
        ap.motivo.toLowerCase().includes(q)
      );
    });
  }, [apelaciones, anuncios, usuarios, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  async function notificar(
    usuarioId: string,
    tipo: NotificacionItem["tipo"],
    titulo: string,
    descripcion: string,
    referenciaId?: string
  ) {
    const { crearNotificacionDb } = await import("@/lib/notificacionesDb");
    void crearNotificacionDb({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      usuarioId,
      tipo,
      titulo,
      descripcion,
      referenciaId,
    });
  }

  async function resolverApelacion(ap: Apelacion, estado: "aceptada" | "rechazada") {
    const detalle = notaResolucion[ap.id]?.trim();
    const { actualizarEstadoApelacionDb } = await import("@/lib/apelacionesDb");
    await actualizarEstadoApelacionDb(ap.id, estado, {
      moderadorId,
      moderadorNombre,
      resolucionDetalle: detalle,
    });
    setApelaciones((prev) =>
      prev.map((x) =>
        x.id === ap.id
          ? { ...x, estado, moderadorId, moderadorNombre, resolucionDetalle: detalle }
          : x
      )
    );

    if (estado === "aceptada") {
      const anuncio = anuncios.find((a) => a.id === ap.anuncioId);
      if (anuncio) {
        const reactivado = reactivarAnuncioPorApelacion(anuncio);
        actualizarAnuncio(reactivado);
        const { upsertAnuncioDb } = await import("@/lib/anunciosDb");
        void upsertAnuncioDb(reactivado);
      }
      void notificar(
        ap.vendedorId,
        "apelacion_aceptada",
        "Tu apelación fue aceptada",
        detalle || "Tu publicación fue reactivada.",
        ap.anuncioId
      );
    } else {
      void notificar(
        ap.vendedorId,
        "apelacion_rechazada",
        "Tu apelación fue rechazada",
        detalle || "La publicación sigue retirada.",
        ap.anuncioId
      );
    }

    setNotaResolucion((prev) => ({ ...prev, [ap.id]: "" }));
  }

  return (
    <section className="space-y-4">
      <BuscadorInput
        value={busqueda}
        onChange={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        placeholder="Buscar por publicación, vendedor o motivo..."
      />
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="flex items-center gap-2 font-display font-bold text-moorcado-gray-dark">
          <Gavel className="h-5 w-5 text-moorcado-brown" />
          Apelaciones ({filtradas.length})
        </h2>
        <p className="mt-1 text-xs text-moorcado-gray-dark/50">
          Publicaciones que un vendedor apeló tras ser retiradas por un reporte.
        </p>

        {cargando ? (
          <p className="mt-3 text-sm text-moorcado-gray-dark/50">Cargando apelaciones...</p>
        ) : visibles.length === 0 ? (
          <p className="mt-3 text-sm text-moorcado-gray-dark/50">No hay apelaciones.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {visibles.map((ap) => {
              const anuncio = anuncios.find((a) => a.id === ap.anuncioId);
              const vendedor = usuarios.find((u) => u.id === ap.vendedorId);
              const expandidoActual = expandido === ap.id;
              return (
                <li key={ap.id} className="rounded-xl bg-moorcado-gray-light">
                  <button
                    onClick={() => setExpandido(expandidoActual ? null : ap.id)}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left"
                  >
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-moorcado-gray-dark">
                        {anuncio?.titulo ?? ap.anuncioId}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            ap.estado === "pendiente"
                              ? "bg-moorcado-gold/20 text-moorcado-brown"
                              : ap.estado === "aceptada"
                                ? "bg-moorcado-green/10 text-moorcado-green"
                                : "bg-red-100 text-red-600"
                          }`}
                        >
                          {ap.estado}
                        </span>
                      </p>
                      <p className="text-xs text-moorcado-gray-dark/50">
                        Apelado por {vendedor?.nombre ?? ap.vendedorId} ·{" "}
                        {new Date(ap.creadoEn).toLocaleDateString("es-HN")}
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
                      {anuncio && <AnuncioResumenModeracion anuncio={anuncio} vendedor={vendedor} />}
                      <p className="rounded-lg bg-white p-2.5 text-xs text-moorcado-gray-dark/70">
                        <span className="font-semibold text-moorcado-gray-dark">Motivo de la apelación: </span>
                        {ap.motivo}
                      </p>

                      {ap.estado !== "pendiente" ? (
                        <p className="rounded-lg bg-white p-2.5 text-xs text-moorcado-gray-dark/70">
                          Resuelta por {ap.moderadorNombre ?? "un moderador"}
                          {ap.resolucionDetalle ? `: ${ap.resolucionDetalle}` : "."}
                        </p>
                      ) : (
                        <>
                          <textarea
                            value={notaResolucion[ap.id] ?? ""}
                            onChange={(e) =>
                              setNotaResolucion((prev) => ({ ...prev, [ap.id]: e.target.value }))
                            }
                            placeholder="Nota de resolución (opcional)..."
                            className="w-full resize-none rounded-lg border border-black/10 p-2 text-xs outline-none focus:border-moorcado-gray-dark"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => resolverApelacion(ap, "aceptada")}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moorcado-green/10 py-2 text-xs font-bold text-moorcado-green hover:bg-moorcado-green/20"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Aceptar y reactivar
                            </button>
                            <button
                              onClick={() => resolverApelacion(ap, "rechazada")}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-100 py-2 text-xs font-bold text-red-600 hover:bg-red-200"
                            >
                              <X className="h-3.5 w-3.5" />
                              Rechazar
                            </button>
                          </div>
                        </>
                      )}
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
