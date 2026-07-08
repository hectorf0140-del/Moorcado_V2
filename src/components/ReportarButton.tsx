"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { TipoReporte } from "@/lib/reportesDb";

const MOTIVOS: Record<TipoReporte, string[]> = {
  publicacion: [
    "Precio sospechoso",
    "Información falsa",
    "Animal no disponible",
    "Contenido inapropiado",
    "Otro",
  ],
  chat: ["Acoso u hostigamiento", "Lenguaje ofensivo", "Spam o estafa", "Otro"],
  usuario: ["Comportamiento sospechoso", "Suplantación de identidad", "Otro"],
};

export default function ReportarButton({
  tipo,
  objetivoId,
  label = "Reportar",
}: {
  tipo: TipoReporte;
  objetivoId: string;
  label?: string;
}) {
  const sesion = useAppStore((s) => s.sesion);
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS[tipo][0]);
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState<string | null>(null);

  if (!sesion) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);

    const { crearReporteDb } = await import("@/lib/reportesDb");
    const creado = await crearReporteDb({
      id: `rep-${Date.now()}`,
      tipo,
      objetivoId,
      autorId: sesion!.usuarioId,
      motivo,
      detalle: detalle.trim() || "(sin detalles adicionales)",
      estado: "pendiente",
    });

    setEnviando(false);
    setCodigoEnviado(creado?.codigo ?? "—");
    setAbierto(false);
  }

  if (codigoEnviado) {
    return (
      <p className="text-xs font-medium text-moorcado-green">
        Reporte enviado ({codigoEnviado}). Gracias por ayudarnos a mantener la comunidad segura.
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-moorcado-gray-dark/50 hover:text-red-600"
      >
        <Flag className="h-3.5 w-3.5" />
        {label}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAbierto(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-moorcado-gray-dark">
                Reportar
              </h3>
              <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar">
                <X className="h-5 w-5 text-moorcado-gray-dark/60" />
              </button>
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Motivo
              </span>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
              >
                {MOTIVOS[tipo].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>

            <label className="mt-3 block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Detalles <span className="font-normal text-moorcado-gray-dark/50">(opcional)</span>
              </span>
              <textarea
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                rows={3}
                placeholder="Cuéntanos qué pasó..."
                className="w-full resize-none rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
              />
            </label>

            <button
              type="submit"
              disabled={enviando}
              className="mt-5 w-full rounded-full bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviar reporte"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
