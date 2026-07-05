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

const visualizaciones = [
  { mes: "Ene", vistas: 120 },
  { mes: "Feb", vistas: 180 },
  { mes: "Mar", vistas: 240 },
  { mes: "Abr", vistas: 210 },
  { mes: "May", vistas: 320 },
  { mes: "Jun", vistas: 410 },
];

const ventasPorMes = [
  { mes: "Ene", ventas: 2 },
  { mes: "Feb", ventas: 4 },
  { mes: "Mar", ventas: 3 },
  { mes: "Abr", ventas: 5 },
  { mes: "May", ventas: 6 },
  { mes: "Jun", ventas: 8 },
];

export function VisualizacionesChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={visualizaciones}>
        <defs>
          <linearGradient id="colorVistas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="vistas"
          stroke="#2E7D32"
          strokeWidth={2}
          fill="url(#colorVistas)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VentasChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={ventasPorMes}>
        <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
        <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
        <Tooltip />
        <Bar dataKey="ventas" fill="#66BB6A" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
