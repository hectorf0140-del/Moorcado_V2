"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, ShieldAlert, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Anuncio, Usuario } from "@/lib/types";
import type { MensajesStore } from "@/lib/storage";
import type { Apelacion } from "@/lib/apelacionesDb";

type Estado = "disponible" | "negociacion" | "vendido";

export default function GestionarAnuncio({
  anuncio,
  vendedorId,
  usuarios,
  mensajes,
}: {
  anuncio: Anuncio;
  vendedorId: string;
  usuarios: Usuario[];
  mensajes: MensajesStore;
}) {
  const actualizarAnuncio = useAppStore((s) => s.actualizarAnuncio);
  const crearTransaccion = useAppStore((s) => s.crearTransaccion);
  const [modalVentaAbierto, setModalVentaAbierto] = useState(false);
  const [compradorId, setCompradorId] = useState("");
  const [precio, setPrecio] = useState(String(anuncio.precio));
  const [enviando, setEnviando] = useState(false);

  const [apelacion, setApelacion] = useState<Apelacion | null | undefined>(undefined);
  const [motivoApelacion, setMotivoApelacion] = useState("");
  const [formularioApelacionAbierto, setFormularioApelacionAbierto] = useState(false);
  const [enviandoApelacion, setEnviandoApelacion] = useState(false);

  useEffect(() => {
    if (!anuncio.retiradoPorModeracion) return;
    let cancelado = false;
    import("@/lib/apelacionesDb").then(({ fetchApelacionPorAnuncio }) =>
      fetchApelacionPorAnuncio(anuncio.id).then((a) => {
        if (!cancelado) setApelacion(a);
      })
    );
    return () => {
      cancelado = true;
    };
  }, [anuncio.id, anuncio.retiradoPorModeracion]);

  async function handleSubmitApelacion(e: React.FormEvent) {
    e.preventDefault();
    if (!motivoApelacion.trim() || enviandoApelacion) return;
    setEnviandoApelacion(true);

    const nuevaApelacion: Apelacion = {
      id: `apl-${Date.now()}`,
      anuncioId: anuncio.id,
      reporteId: anuncio.retiradoReporteId,
      vendedorId,
      motivo: motivoApelacion.trim(),
      estado: "pendiente",
      creadoEn: new Date().toISOString(),
    };
    const { crearApelacionDb } = await import("@/lib/apelacionesDb");
    const ok = await crearApelacionDb(nuevaApelacion);
    if (ok) setApelacion(nuevaApelacion);
    setEnviandoApelacion(false);
    setFormularioApelacionAbierto(false);
  }

  const estado: Estado = anuncio.vendido
    ? "vendido"
    : anuncio.enNegociacion
      ? "negociacion"
      : "disponible";

  // Solo se puede vender a alguien que ya escribió sobre esta publicación —
  // no a cualquier usuario registrado en la plataforma.
  const idsEnComunicacion = new Set<string>();
  for (const hilo of Object.values(mensajes)) {
    for (const m of hilo) {
      if (m.animalId !== anuncio.id) continue;
      if (m.autorId !== vendedorId) idsEnComunicacion.add(m.autorId);
      if (m.destinatarioId !== vendedorId) idsEnComunicacion.add(m.destinatarioId);
    }
  }
  const compradoresDisponibles = usuarios.filter((u) => idsEnComunicacion.has(u.id));

  function handleChangeEstado(e: React.ChangeEvent<HTMLSelectElement>) {
    const valor = e.target.value as Estado;
    if (valor === "vendido") {
      setModalVentaAbierto(true);
      return;
    }
    actualizarAnuncio({
      ...anuncio,
      vendido: false,
      enNegociacion: valor === "negociacion",
      activo: true,
    });
  }

  async function handleSubmitVenta(e: React.FormEvent) {
    e.preventDefault();
    if (!compradorId || enviando) return;
    setEnviando(true);

    await crearTransaccion({
      id: `t-${Date.now()}`,
      animalId: anuncio.id,
      compradorId,
      vendedorId,
      precio: Number(precio) || anuncio.precio,
      fecha: new Date().toISOString(),
    });
    actualizarAnuncio({ ...anuncio, vendido: true, enNegociacion: false, activo: false });

    setEnviando(false);
    setModalVentaAbierto(false);
  }

  return (
    <div className="space-y-2">
      {anuncio.retiradoPorModeracion ? (
        <div className="space-y-2 rounded-xl bg-red-50 p-3">
          <p className="flex items-start gap-1.5 text-xs font-semibold text-red-600">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Retirada por moderación: {anuncio.retiradoMotivo || "sin motivo registrado"}
          </p>

          {apelacion === undefined ? null : apelacion === null ? (
            formularioApelacionAbierto ? (
              <form onSubmit={handleSubmitApelacion} className="space-y-2">
                <textarea
                  required
                  value={motivoApelacion}
                  onChange={(e) => setMotivoApelacion(e.target.value)}
                  placeholder="Explica por qué crees que fue un error..."
                  className="w-full resize-none rounded-lg border border-black/10 bg-white p-2 text-xs outline-none focus:border-moorcado-green"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormularioApelacionAbierto(false)}
                    className="flex-1 rounded-full bg-white py-2 text-xs font-bold text-moorcado-gray-dark ring-1 ring-black/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!motivoApelacion.trim() || enviandoApelacion}
                    className="flex-1 rounded-full bg-moorcado-gray-dark py-2 text-xs font-bold text-white disabled:opacity-40"
                  >
                    {enviandoApelacion ? "Enviando..." : "Enviar apelación"}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setFormularioApelacionAbierto(true)}
                className="w-full rounded-full bg-white py-2 text-xs font-bold text-moorcado-gray-dark ring-1 ring-black/10 hover:bg-moorcado-gray-light"
              >
                Apelar esta decisión
              </button>
            )
          ) : apelacion.estado === "pendiente" ? (
            <p className="text-xs text-moorcado-gray-dark/70">Tu apelación está en revisión.</p>
          ) : apelacion.estado === "rechazada" ? (
            <p className="text-xs text-moorcado-gray-dark/70">
              Tu apelación fue rechazada
              {apelacion.resolucionDetalle ? `: ${apelacion.resolucionDetalle}` : "."}
            </p>
          ) : null}
        </div>
      ) : (
        <select
          value={estado}
          onChange={handleChangeEstado}
          className="w-full rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold text-moorcado-gray-dark outline-none focus:border-moorcado-green"
        >
          <option value="disponible">Disponible</option>
          <option value="negociacion">En negociación</option>
          <option value="vendido">Vendido</option>
        </select>
      )}

      <Link
        href={`/dashboard/vendedor/editar/${anuncio.id}`}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white py-2 text-xs font-bold text-moorcado-gray-dark ring-1 ring-black/10 hover:bg-moorcado-gray-light"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar publicación
      </Link>

      {modalVentaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-moorcado-gray-dark">
                Registrar venta
              </h3>
              <button
                type="button"
                onClick={() => setModalVentaAbierto(false)}
                aria-label="Cerrar"
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-moorcado-gray-light"
              >
                <X className="h-4 w-4 text-moorcado-gray-dark/50" />
              </button>
            </div>
            <p className="mt-1 text-xs text-moorcado-gray-dark/60">
              Confirma el comprador y el precio final para marcar &quot;{anuncio.titulo || anuncio.nombre}&quot; como vendido.
            </p>

            {compradoresDisponibles.length === 0 ? (
              <div className="mt-4 space-y-3">
                <p className="rounded-xl bg-moorcado-gray-light p-3 text-sm text-moorcado-gray-dark/70">
                  Aún nadie te ha escrito por esta publicación. Solo puedes registrar la venta a un
                  comprador que ya esté en comunicación contigo sobre este anuncio.
                </p>
                <button
                  type="button"
                  onClick={() => setModalVentaAbierto(false)}
                  className="w-full rounded-full bg-moorcado-gray-light py-2.5 text-sm font-bold text-moorcado-gray-dark"
                >
                  Entendido
                </button>
              </div>
            ) : (
            <form onSubmit={handleSubmitVenta} className="mt-4 space-y-3">
              <select
                required
                value={compradorId}
                onChange={(e) => setCompradorId(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-moorcado-gray-light px-3 py-2.5 text-sm outline-none focus:border-moorcado-green"
              >
                <option value="">Selecciona al comprador</option>
                {compradoresDisponibles.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.correo})
                  </option>
                ))}
              </select>
              <input
                type="number"
                required
                min={1}
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Precio final"
                className="w-full rounded-lg border border-black/10 bg-moorcado-gray-light px-3 py-2.5 text-sm outline-none focus:border-moorcado-green"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalVentaAbierto(false)}
                  className="flex-1 rounded-full bg-moorcado-gray-light py-2.5 text-sm font-bold text-moorcado-gray-dark"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!compradorId || enviando}
                  className="flex-1 rounded-full bg-moorcado-green py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  {enviando ? "Guardando..." : "Confirmar venta"}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
