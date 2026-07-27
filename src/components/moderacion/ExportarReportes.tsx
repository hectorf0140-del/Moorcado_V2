"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import type { Anuncio, Transaccion, Usuario } from "@/lib/types";
import { Spinner } from "../Spinner";

function primerDiaDelMes(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ExportarReportes({
  transacciones,
  usuarios,
  anuncios,
}: {
  transacciones: Transaccion[];
  usuarios: Usuario[];
  anuncios: Anuncio[];
}) {
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoy());
  const [generando, setGenerando] = useState<"excel" | "pdf" | null>(null);

  function rango() {
    const fDesde = new Date(`${desde}T00:00:00`);
    const fHasta = new Date(`${hasta}T23:59:59`);
    return { fDesde, fHasta };
  }

  async function exportarExcel() {
    setGenerando("excel");
    const { fDesde, fHasta } = rango();
    const { generarExcelGanancias } = await import("@/lib/exportarReportes");
    await generarExcelGanancias(transacciones, usuarios, anuncios, fDesde, fHasta);
    setGenerando(null);
  }

  async function exportarPdf() {
    setGenerando("pdf");
    const { fDesde, fHasta } = rango();
    const { generarPdfReportes } = await import("@/lib/exportarReportes");
    await generarPdfReportes(transacciones, usuarios, anuncios, fDesde, fHasta);
    setGenerando(null);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h3 className="font-display font-bold text-moorcado-gray-dark">Exportar reportes</h3>
      <p className="mt-1 text-xs text-moorcado-gray-dark/60">
        Ganancias y ventas reales del rango de fechas que elijas.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-moorcado-gray-dark">
          Desde
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="mt-1 block rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-moorcado-green"
          />
        </label>
        <label className="text-xs font-semibold text-moorcado-gray-dark">
          Hasta
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="mt-1 block rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-moorcado-green"
          />
        </label>

        <button
          onClick={exportarExcel}
          disabled={generando !== null}
          className="flex items-center gap-1.5 rounded-full bg-moorcado-green px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {generando === "excel" ? <Spinner tamano="sm" color="blanco" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
          Exportar a Excel
        </button>
        <button
          onClick={exportarPdf}
          disabled={generando !== null}
          className="flex items-center gap-1.5 rounded-full bg-moorcado-brown px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {generando === "pdf" ? <Spinner tamano="sm" color="blanco" /> : <FileText className="h-3.5 w-3.5" />}
          Exportar a PDF
        </button>
      </div>
    </div>
  );
}
