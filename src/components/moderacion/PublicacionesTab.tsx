"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Bot, Check, ChevronDown, FileWarning, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Anuncio } from "@/lib/types";
import { formatLempiras } from "@/lib/format";
import type { Reporte } from "@/lib/reportesDb";
import BuscadorInput from "../BuscadorInput";
import Paginacion from "./Paginacion";
import AnuncioResumenModeracion from "./AnuncioResumenModeracion";
import { Spinner } from "../Spinner";

const POR_PAGINA = 10;

type Vista = "aprobadas" | "en_proceso" | "reportadas";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "en_proceso", label: "En proceso de aprobación" },
  { id: "aprobadas", label: "Aprobadas" },
  { id: "reportadas", label: "Con reportes" },
];

function aprobada(a: Anuncio) {
  return a.estadoModeracion === "aprobado" || a.estadoModeracion === undefined;
}

export default function PublicacionesTab({ token }: { token: string }) {
  const usuarios = useAppStore((s) => s.usuarios);
  const anuncios = useAppStore((s) => s.anuncios);
  const actualizarAnuncio = useAppStore((s) => s.actualizarAnuncio);

  const [vista, setVista] = useState<Vista>("en_proceso");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [alternandoId, setAlternandoId] = useState<string | null>(null);
  const [errorAlternar, setErrorAlternar] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState<Record<string, string>>({});
  const [reportes, setReportes] = useState<Reporte[]>([]);

  useEffect(() => {
    let cancelado = false;
    import("@/lib/reportesDb").then(({ fetchReportes }) =>
      fetchReportes().then((r) => {
        if (!cancelado) setReportes((r ?? []).filter((rep) => rep.tipo === "publicacion" && rep.estado === "pendiente"));
      })
    );
    return () => {
      cancelado = true;
    };
  }, []);

  const idsReportados = useMemo(() => new Set(reportes.map((r) => r.objetivoId)), [reportes]);

  const base = useMemo(() => {
    if (vista === "aprobadas") return anuncios.filter(aprobada);
    if (vista === "en_proceso") return anuncios.filter((a) => !aprobada(a));
    return anuncios.filter((a) => idsReportados.has(a.id));
  }, [anuncios, vista, idsReportados]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return base;
    return base.filter((a) => {
      const vendedor = usuarios.find((u) => u.id === a.vendedorId);
      return (
        (a.nombre ?? "").toLowerCase().includes(q) ||
        (a.titulo ?? "").toLowerCase().includes(q) ||
        (a.raza ?? "").toLowerCase().includes(q) ||
        (vendedor?.nombre ?? "").toLowerCase().includes(q)
      );
    });
  }, [base, usuarios, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  function cambiarVista(v: Vista) {
    setVista(v);
    setBusqueda("");
    setPagina(1);
    setExpandido(null);
  }

  async function toggleActivoAnuncio(anuncio: Anuncio) {
    const nuevoActivo = anuncio.activo === false;
    setAlternandoId(anuncio.id);
    setErrorAlternar(null);
    const { alternarActivoAnuncioRpc } = await import("@/lib/moderadoresDb");
    const ok = await alternarActivoAnuncioRpc(token, anuncio.id, nuevoActivo);
    setAlternandoId(null);
    if (!ok) {
      setErrorAlternar("No se pudo actualizar la publicación. Intenta de nuevo.");
      return;
    }
    actualizarAnuncio({ ...anuncio, activo: nuevoActivo });
  }

  async function moderarAnuncio(anuncio: Anuncio, aprobado: boolean) {
    const motivo = aprobado ? "" : (motivoRechazo[anuncio.id] ?? "").trim();
    if (!aprobado && !motivo) return;
    setAlternandoId(anuncio.id);
    setErrorAlternar(null);
    const { moderarAnuncioManualRpc } = await import("@/lib/moderadoresDb");
    const ok = await moderarAnuncioManualRpc(token, anuncio.id, aprobado, motivo);
    setAlternandoId(null);
    if (!ok) {
      setErrorAlternar("No se pudo aplicar la decisión. Intenta de nuevo.");
      return;
    }
    actualizarAnuncio({
      ...anuncio,
      estadoModeracion: aprobado ? "aprobado" : "rechazado",
      moderacionMotivo: motivo || undefined,
      activo: aprobado,
    });
    if (!aprobado) {
      const { crearNotificacionDb } = await import("@/lib/notificacionesDb");
      void crearNotificacionDb({
        usuarioId: anuncio.vendedorId,
        tipo: "publicacion_rechazada",
        titulo: "Tu publicación no fue aprobada",
        descripcion: motivo,
        referenciaId: anuncio.id,
      });
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {VISTAS.map((v) => {
          const cantidad =
            v.id === "aprobadas"
              ? anuncios.filter(aprobada).length
              : v.id === "en_proceso"
                ? anuncios.filter((a) => !aprobada(a)).length
                : idsReportados.size;
          return (
            <button
              key={v.id}
              onClick={() => cambiarVista(v.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                vista === v.id
                  ? "bg-moorcado-gray-dark text-white"
                  : "bg-white text-moorcado-gray-dark ring-1 ring-black/10"
              }`}
            >
              {v.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  vista === v.id ? "bg-white/20" : "bg-moorcado-gray-light"
                }`}
              >
                {cantidad}
              </span>
            </button>
          );
        })}
      </div>

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
          {VISTAS.find((v) => v.id === vista)?.label} ({filtrados.length})
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
              const reporte = reportes.find((r) => r.objetivoId === a.id);
              return (
                <li key={a.id} className="rounded-xl bg-moorcado-gray-light">
                  <button
                    onClick={() => setExpandido(expandidoActual ? null : a.id)}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left"
                  >
                    <div>
                      <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-moorcado-gray-dark">
                        {a.nombre} · {a.raza}
                        {a.retiradoPorModeracion && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            Retirada por reporte
                          </span>
                        )}
                        {!a.retiradoPorModeracion && a.estadoModeracion === "en_revision" && (
                          <span className="flex items-center gap-1 rounded-full bg-moorcado-gold/20 px-2 py-0.5 text-[10px] font-bold text-moorcado-brown">
                            <Bot className="h-3 w-3" /> En revisión
                          </span>
                        )}
                        {!a.retiradoPorModeracion && a.estadoModeracion === "rechazado" && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            Rechazada por IA
                          </span>
                        )}
                        {!a.retiradoPorModeracion && a.estadoModeracion !== "en_revision" && a.estadoModeracion !== "rechazado" && desactivada && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            Desactivada
                          </span>
                        )}
                        {reporte && (
                          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            <FileWarning className="h-3 w-3" /> {reporte.codigo}
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

                      {a.estadoModeracion === "rechazado" && a.moderacionMotivo && (
                        <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
                          Motivo del rechazo: {a.moderacionMotivo}
                        </p>
                      )}

                      {reporte && (
                        <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
                          Reporte {reporte.codigo} · {reporte.motivo}
                          {reporte.detalle ? ` — ${reporte.detalle}` : ""}. Se resuelve desde la
                          pestaña Reportes.
                        </p>
                      )}

                      {errorAlternar && (
                        <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{errorAlternar}</p>
                      )}

                      {vista === "en_proceso" ? (
                        <div className="space-y-2">
                          <textarea
                            value={motivoRechazo[a.id] ?? ""}
                            onChange={(e) =>
                              setMotivoRechazo((prev) => ({ ...prev, [a.id]: e.target.value }))
                            }
                            placeholder="Motivo si vas a rechazar (obligatorio para rechazar)..."
                            className="w-full resize-none rounded-lg border border-black/10 bg-white p-2 text-xs outline-none focus:border-moorcado-gray-dark"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => moderarAnuncio(a, true)}
                              disabled={alternandoId === a.id}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moorcado-green/10 py-2 text-xs font-bold text-moorcado-green transition hover:bg-moorcado-green/20 disabled:opacity-50"
                            >
                              {alternandoId === a.id ? (
                                <Spinner tamano="sm" color="verde" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Aprobar
                            </button>
                            <button
                              onClick={() => moderarAnuncio(a, false)}
                              disabled={alternandoId === a.id || !(motivoRechazo[a.id] ?? "").trim()}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-100 py-2 text-xs font-bold text-red-600 transition hover:bg-red-200 disabled:opacity-50"
                            >
                              {alternandoId === a.id ? (
                                <Spinner tamano="sm" color="gris" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                              Rechazar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleActivoAnuncio(a)}
                          disabled={alternandoId === a.id}
                          className={`flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold transition disabled:opacity-50 ${
                            desactivada
                              ? "bg-moorcado-green/10 text-moorcado-green hover:bg-moorcado-green/20"
                              : "bg-red-100 text-red-600 hover:bg-red-200"
                          }`}
                        >
                          {alternandoId === a.id ? (
                            <Spinner tamano="sm" color={desactivada ? "verde" : "gris"} />
                          ) : desactivada ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Ban className="h-3.5 w-3.5" />
                          )}
                          {alternandoId === a.id
                            ? "Actualizando..."
                            : desactivada
                              ? "Reactivar publicación"
                              : "Desactivar publicación"}
                        </button>
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
