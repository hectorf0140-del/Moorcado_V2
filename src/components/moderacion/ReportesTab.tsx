"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Check, ChevronDown, FileWarning, ShieldOff, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Reporte, EstadoReporte } from "@/lib/reportesDb";
import type { Anuncio, NotificacionItem } from "@/lib/types";
import {
  marcarAnuncioRetiradoPorReporte,
  suspenderUsuario,
  anunciosADesactivarPorSuspension,
} from "@/lib/moderacionHelpers";
import BuscadorInput from "../BuscadorInput";
import Paginacion from "./Paginacion";
import AnuncioResumenModeracion from "./AnuncioResumenModeracion";

const POR_PAGINA = 10;

const FILTROS_ESTADO: { id: EstadoReporte | "todos"; label: string }[] = [
  { id: "pendiente", label: "Pendientes" },
  { id: "resuelto", label: "Resueltos" },
  { id: "descartado", label: "Descartados" },
  { id: "todos", label: "Todos" },
];

export default function ReportesTab({
  moderadorId,
  moderadorNombre,
}: {
  moderadorId: string;
  moderadorNombre: string;
}) {
  const usuarios = useAppStore((s) => s.usuarios);
  const anuncios = useAppStore((s) => s.anuncios);
  const actualizarUsuario = useAppStore((s) => s.actualizarUsuario);
  const actualizarAnuncio = useAppStore((s) => s.actualizarAnuncio);

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoReporte | "todos">("pendiente");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [detalleResolucion, setDetalleResolucion] = useState<Record<string, string>>({});
  const [anunciosCache, setAnunciosCache] = useState<Record<string, Anuncio | null>>({});
  const [suspendiendoAutorDe, setSuspendiendoAutorDe] = useState<string | null>(null);
  const [motivoSuspension, setMotivoSuspension] = useState("");

  useEffect(() => {
    let cancelado = false;
    import("@/lib/reportesDb").then(({ fetchReportes }) =>
      fetchReportes().then((r) => {
        if (!cancelado) {
          setReportes(r ?? []);
          setCargando(false);
        }
      })
    );
    return () => {
      cancelado = true;
    };
  }, []);

  const filtrados = useMemo(() => {
    return reportes
      .filter((r) => (filtroEstado === "todos" ? true : r.estado === filtroEstado))
      .filter((r) => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return true;
        const autor = usuarios.find((u) => u.id === r.autorId);
        return (
          r.codigo.toLowerCase().includes(q) ||
          r.motivo.toLowerCase().includes(q) ||
          (autor?.nombre ?? "").toLowerCase().includes(q)
        );
      });
  }, [reportes, filtroEstado, busqueda, usuarios]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  function targetAnuncio(r: Reporte): Anuncio | null | undefined {
    if (r.tipo !== "publicacion") return undefined;
    return anuncios.find((a) => a.id === r.objetivoId) ?? anunciosCache[r.objetivoId];
  }

  useEffect(() => {
    const faltantes = visibles.filter(
      (r) =>
        r.tipo === "publicacion" &&
        !anuncios.some((a) => a.id === r.objetivoId) &&
        !(r.objetivoId in anunciosCache)
    );
    if (faltantes.length === 0) return;
    let cancelado = false;
    import("@/lib/anunciosDb").then(({ fetchAnuncioDbPorId }) => {
      faltantes.forEach((r) => {
        fetchAnuncioDbPorId(r.objetivoId).then((a) => {
          if (!cancelado) setAnunciosCache((prev) => ({ ...prev, [r.objetivoId]: a }));
        });
      });
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibles]);

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

  async function resolverReporte(
    r: Reporte,
    estado: "resuelto" | "descartado",
    retirarPublicacion: boolean
  ) {
    const detalle = detalleResolucion[r.id]?.trim();
    const { actualizarEstadoReporteDb } = await import("@/lib/reportesDb");
    await actualizarEstadoReporteDb(r.id, estado, {
      moderadorId,
      moderadorNombre,
      resolucionDetalle: detalle,
    });
    setReportes((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? { ...x, estado, moderadorId, moderadorNombre, resolucionDetalle: detalle }
          : x
      )
    );

    if (retirarPublicacion && r.tipo === "publicacion") {
      const anuncio = targetAnuncio(r);
      if (anuncio) {
        const { upsertAnuncioDb } = await import("@/lib/anunciosDb");
        const retirado = marcarAnuncioRetiradoPorReporte(anuncio, r, detalle || r.motivo);
        actualizarAnuncio(retirado);
        void upsertAnuncioDb(retirado);
        void notificar(
          anuncio.vendedorId,
          "publicacion_retirada",
          "Tu publicación fue retirada",
          detalle || r.motivo,
          anuncio.id
        );
      }
    }

    void notificar(
      r.autorId,
      "reporte_resuelto",
      `Tu reporte ${r.codigo} fue revisado`,
      detalle ||
        (estado === "resuelto" ? "Se tomó acción sobre tu reporte." : "Se descartó tu reporte."),
      r.id
    );

    setDetalleResolucion((prev) => ({ ...prev, [r.id]: "" }));
  }

  async function confirmarSuspensionAutor(r: Reporte) {
    const motivo = motivoSuspension.trim();
    const usuario = usuarios.find((u) => u.id === r.objetivoId);
    if (!motivo || !usuario) return;

    const actualizado = suspenderUsuario(usuario, motivo);
    actualizarUsuario(actualizado);
    const { upsertUsuarioDb } = await import("@/lib/usuariosDb");
    void upsertUsuarioDb(actualizado);

    const { upsertAnuncioDb } = await import("@/lib/anunciosDb");
    for (const desactivado of anunciosADesactivarPorSuspension(anuncios, usuario.id)) {
      actualizarAnuncio(desactivado);
      void upsertAnuncioDb(desactivado);
    }

    void notificar(usuario.id, "cuenta_suspendida", "Tu cuenta fue suspendida", motivo);

    setSuspendiendoAutorDe(null);
    setMotivoSuspension("");
  }

  return (
    <section className="space-y-4">
      <BuscadorInput
        value={busqueda}
        onChange={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        placeholder="Buscar por código, motivo o autor..."
      />
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {FILTROS_ESTADO.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => {
              setFiltroEstado(id);
              setPagina(1);
            }}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
              filtroEstado === id
                ? "bg-moorcado-gray-dark text-white"
                : "bg-white text-moorcado-gray-dark ring-1 ring-black/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="flex items-center gap-2 font-display font-bold text-moorcado-gray-dark">
          <FileWarning className="h-5 w-5 text-red-500" />
          Reportes de la comunidad ({filtrados.length})
        </h2>
        <p className="mt-1 text-xs text-moorcado-gray-dark/50">
          Cada reporte tiene un código de seguimiento — úsalo para dar seguimiento si te
          equivocas al resolverlo.
        </p>

        {cargando ? (
          <p className="mt-3 text-sm text-moorcado-gray-dark/50">Cargando reportes...</p>
        ) : visibles.length === 0 ? (
          <p className="mt-3 text-sm text-moorcado-gray-dark/50">No hay reportes en este filtro.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {visibles.map((r) => {
              const autor = usuarios.find((u) => u.id === r.autorId);
              const expandidoActual = expandido === r.id;
              const anuncio = targetAnuncio(r);
              const usuarioReportado = r.tipo === "usuario" ? usuarios.find((u) => u.id === r.objetivoId) : undefined;
              const resuelto = r.estado !== "pendiente";

              return (
                <li key={r.id} className="rounded-xl bg-moorcado-gray-light">
                  <button
                    onClick={() => setExpandido(expandidoActual ? null : r.id)}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left"
                  >
                    <div>
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-moorcado-gray-dark">
                        <span className="rounded-full bg-moorcado-gray-dark/10 px-2 py-0.5 font-mono text-[10px] font-bold text-moorcado-gray-dark">
                          {r.codigo}
                        </span>
                        {r.motivo}
                        <span className="rounded-full bg-moorcado-gray-dark/10 px-2 py-0.5 text-[10px] font-bold capitalize text-moorcado-gray-dark/70">
                          {r.tipo}
                        </span>
                        {resuelto && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              r.estado === "resuelto"
                                ? "bg-moorcado-green/10 text-moorcado-green"
                                : "bg-moorcado-gray-dark/10 text-moorcado-gray-dark/60"
                            }`}
                          >
                            {r.estado}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-moorcado-gray-dark/50">
                        Reportado por {autor?.nombre ?? "un usuario"} ·{" "}
                        {new Date(r.creadoEn).toLocaleDateString("es-HN")}
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
                      <p className="rounded-lg bg-white p-2.5 text-xs text-moorcado-gray-dark/70">
                        {r.detalle}
                      </p>

                      {r.tipo === "publicacion" &&
                        (anuncio ? (
                          <AnuncioResumenModeracion
                            anuncio={anuncio}
                            vendedor={usuarios.find((u) => u.id === anuncio.vendedorId)}
                          />
                        ) : (
                          <p className="text-xs text-moorcado-gray-dark/50">
                            Cargando la publicación reportada...
                          </p>
                        ))}

                      {r.tipo === "usuario" && usuarioReportado && (
                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                          <div className="rounded-lg bg-white p-2">
                            <p className="text-[10px] uppercase text-moorcado-gray-dark/40">Nombre</p>
                            <p className="font-medium text-moorcado-gray-dark">{usuarioReportado.nombre}</p>
                          </div>
                          <div className="rounded-lg bg-white p-2">
                            <p className="text-[10px] uppercase text-moorcado-gray-dark/40">Correo</p>
                            <p className="font-medium text-moorcado-gray-dark">{usuarioReportado.correo}</p>
                          </div>
                          <div className="rounded-lg bg-white p-2">
                            <p className="text-[10px] uppercase text-moorcado-gray-dark/40">Tipo</p>
                            <p className="font-medium capitalize text-moorcado-gray-dark">{usuarioReportado.tipo}</p>
                          </div>
                        </div>
                      )}

                      {r.tipo === "chat" && (
                        <p className="text-xs text-moorcado-gray-dark/50">
                          Conversación referenciada: <span className="font-mono">{r.objetivoId}</span>
                        </p>
                      )}

                      {r.estado !== "pendiente" ? (
                        <p className="rounded-lg bg-white p-2.5 text-xs text-moorcado-gray-dark/70">
                          Resuelto por {r.moderadorNombre ?? "un moderador"}
                          {r.resolucionDetalle ? `: ${r.resolucionDetalle}` : "."}
                        </p>
                      ) : (
                        <>
                          <textarea
                            value={detalleResolucion[r.id] ?? ""}
                            onChange={(e) =>
                              setDetalleResolucion((prev) => ({ ...prev, [r.id]: e.target.value }))
                            }
                            placeholder="Nota de resolución (opcional)..."
                            className="w-full resize-none rounded-lg border border-black/10 p-2 text-xs outline-none focus:border-moorcado-gray-dark"
                            rows={2}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => resolverReporte(r, "resuelto", false)}
                              className="flex items-center gap-1.5 rounded-full bg-moorcado-green/10 px-3 py-2 text-xs font-bold text-moorcado-green hover:bg-moorcado-green/20"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Marcar resuelto
                            </button>
                            <button
                              onClick={() => resolverReporte(r, "descartado", false)}
                              className="flex items-center gap-1.5 rounded-full bg-moorcado-gray-dark/10 px-3 py-2 text-xs font-bold text-moorcado-gray-dark hover:bg-moorcado-gray-dark/20"
                            >
                              <X className="h-3.5 w-3.5" />
                              Descartar
                            </button>
                            {r.tipo === "publicacion" && anuncio && anuncio.activo !== false && (
                              <button
                                onClick={() => resolverReporte(r, "resuelto", true)}
                                className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-200"
                              >
                                <Ban className="h-3.5 w-3.5" />
                                Retirar publicación por este reporte
                              </button>
                            )}
                            {r.tipo === "usuario" && usuarioReportado && usuarioReportado.estadoCuenta !== "suspendido" && (
                              <button
                                onClick={() => setSuspendiendoAutorDe(r.id)}
                                className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-200"
                              >
                                <ShieldOff className="h-3.5 w-3.5" />
                                Suspender cuenta
                              </button>
                            )}
                          </div>
                          {suspendiendoAutorDe === r.id && (
                            <div className="space-y-2 rounded-lg bg-white p-3">
                              <textarea
                                value={motivoSuspension}
                                onChange={(e) => setMotivoSuspension(e.target.value)}
                                placeholder="Motivo de la suspensión (obligatorio)..."
                                className="w-full resize-none rounded-lg border border-black/10 p-2 text-xs outline-none focus:border-moorcado-gray-dark"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => confirmarSuspensionAutor(r)}
                                  disabled={!motivoSuspension.trim()}
                                  className="flex flex-1 items-center justify-center rounded-full bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40"
                                >
                                  Confirmar suspensión
                                </button>
                                <button
                                  onClick={() => {
                                    setSuspendiendoAutorDe(null);
                                    setMotivoSuspension("");
                                  }}
                                  className="rounded-full bg-moorcado-gray-light px-4 py-2 text-xs font-bold text-moorcado-gray-dark hover:bg-moorcado-gray-light/70"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
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
