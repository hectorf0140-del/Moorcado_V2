"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface PuntoMes {
  mes: string;
  valor: number;
}

/** Genera las etiquetas de los últimos `n` meses (reales, no de prueba). */
export function ultimosMeses(n: number): string[] {
  const nombres = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const ahora = new Date();
  const etiquetas: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    etiquetas.push(nombres[d.getMonth()]);
  }
  return etiquetas;
}

export function VisualizacionesChart({ data }: { data: PuntoMes[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorVistas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="valor"
          stroke="#2E7D32"
          strokeWidth={2}
          fill="url(#colorVistas)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VentasChart({ data }: { data: PuntoMes[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="valor" fill="#66BB6A" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
