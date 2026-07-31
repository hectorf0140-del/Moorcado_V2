"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import type { HatoSnapshot } from "@/lib/types";
import { formatLempiras } from "@/lib/format";
import PremiumBadge from "@/components/PremiumBadge";

function etiquetaFecha(fecha: string) {
  const d = new Date(fecha);
  return d.toLocaleDateString("es-HN", { day: "2-digit", month: "short" });
}

/** Gráfica de tendencia del hato — el "plus" premium: destacada arriba de la
 * tabla, no un anexo al final. Se alimenta de hatoHistorial (un snapshot real
 * por día, sin datos inventados), por lo que empieza dispersa hasta que se
 * acumulan suficientes días de uso. */
export default function HatoProduccionChart({ historial }: { historial: HatoSnapshot[] }) {
  const ordenado = [...historial].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const suficiente = ordenado.length >= 2;

  const datos = ordenado.map((s) => ({
    etiqueta: etiquetaFecha(s.fecha),
    valor: s.valorTotal,
    produccion: s.produccionTotal,
  }));

  return (
    <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-moorcado-gray-dark">
          <TrendingUp className="h-5 w-5 text-moorcado-brown" />
          Tendencia del hato
        </h2>
        <PremiumBadge compact>Insight Premium</PremiumBadge>
      </div>

      {!suficiente ? (
        <p className="mt-4 rounded-xl bg-moorcado-gray-light p-5 text-center text-sm text-moorcado-gray-dark/50">
          Aún no hay suficiente historial — vuelve en unos días para ver la tendencia real de tu hato.
        </p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-moorcado-gray-dark/50">
              Valor del hato
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={datos}>
                <defs>
                  <linearGradient id="colorValorHato" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15492B" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#15492B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
                <Tooltip formatter={(v) => formatLempiras(Number(v))} />
                <Area type="monotone" dataKey="valor" stroke="#15492B" strokeWidth={2} fill="url(#colorValorHato)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-moorcado-gray-dark/50">
              Producción diaria (L)
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={datos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip formatter={(v) => `${v} L`} />
                <Bar dataKey="produccion" fill="#3A8257" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
