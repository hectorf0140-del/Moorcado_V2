"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package, ShoppingBag, BarChart2, Eye, Star, TrendingUp, DollarSign } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppStore } from "@/store/useAppStore";
import AnimalCard from "@/components/AnimalCard";
import { VentasChart, VisualizacionesChart, ultimosMeses } from "@/components/DashboardCharts";
import PublicarForm from "@/components/PublicarForm";
import { formatLempiras } from "@/lib/format";
import { PantallaCargando } from "@/components/Spinner";

type Tab = "anuncios" | "compras" | "analitica" | "publicar";

export default function DashboardPage() {
  const { sesion, loading } = useAuthGuard();
  const [tab, setTab] = useState<Tab>("anuncios");
  const router = useRouter();

  const anuncios = useAppStore((s) => s.anuncios);
  const transacciones = useAppStore((s) => s.transacciones);
  const usuarios = useAppStore((s) => s.usuarios);

  if (loading || !sesion) {
    return (
      <PantallaCargando />
    );
  }

  const misAnuncios = anuncios.filter((a) => a.vendorId === sesion.usuarioId);
  const misCompras = transacciones.filter((t) => t.compradorId === sesion.usuarioId);
  const misVentas = transacciones.filter((t) => t.vendedorId === sesion.usuarioId);
  const ingresosTotal = misVentas.reduce((acc, t) => acc + t.precio, 0);
  const usuarioActual = usuarios.find((u) => u.id === sesion.usuarioId);

  const tasaConversion =
    misAnuncios.length > 0
      ? `${Math.round((misAnuncios.filter((a) => a.vendido).length / misAnuncios.length) * 100)}%`
      : "—";
  const calificacionPromedio =
    usuarioActual && usuarioActual.resenas > 0
      ? `${usuarioActual.calificacion} ⭐`
      : "Sin reseñas aún";

  const etiquetasMeses = ultimosMeses(6);
  const ventasPorMes = etiquetasMeses.map((mes, i) => {
    const fechaMes = new Date();
    fechaMes.setMonth(fechaMes.getMonth() - (5 - i));
    const valor = misVentas.filter((t) => {
      const f = new Date(t.fecha);
      return (
        f.getFullYear() === fechaMes.getFullYear() &&
        f.getMonth() === fechaMes.getMonth()
      );
    }).length;
    return { mes, valor };
  });
  // Aún no registramos vistas por mes (solo el total acumulado por anuncio).
  const visualizacionesPorMes = etiquetasMeses.map((mes) => ({ mes, valor: 0 }));

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "anuncios", label: "Mis Anuncios", icon: Package },
    { id: "compras", label: "Mis Compras", icon: ShoppingBag },
    { id: "analitica", label: "Analítica", icon: BarChart2 },
    { id: "publicar", label: "Publicar Lote", icon: Plus },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-moorcado-gray-dark/60">
            Hola, {sesion.nombre}. Aquí está tu actividad en Moorcado.
          </p>
        </div>
        <button
          onClick={() => setTab("publicar")}
          className="flex items-center gap-2 rounded-full bg-moorcado-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moorcado-green/90"
        >
          <Plus className="h-4 w-4" />
          Publicar Animal
        </button>
      </div>

      {/* KPI strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard icon={Package} label="Anuncios activos" value={misAnuncios.filter((a) => a.activo).length} />
        <KpiCard icon={ShoppingBag} label="Mis compras" value={misCompras.length} accent="gold" />
        <KpiCard icon={DollarSign} label="Ingresos (ventas)" value={formatLempiras(ingresosTotal)} accent="brown" />
        <KpiCard icon={Eye} label="Vistas totales" value={misAnuncios.reduce((a, b) => a + b.vistas, 0)} />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 overflow-x-auto rounded-2xl bg-moorcado-gray-light p-1.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition ${
              tab === id
                ? "bg-white text-moorcado-green shadow-sm"
                : "text-moorcado-gray-dark/70 hover:text-moorcado-gray-dark"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {tab === "anuncios" && (
          <div>
            {misAnuncios.length === 0 ? (
              <EmptyState
                message="No tienes anuncios publicados."
                cta="Publicar primer lote"
                onClick={() => setTab("publicar")}
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {misAnuncios.map((a) => (
                  <AnimalCard key={a.id} animal={a} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "compras" && (
          <div className="space-y-3">
            {misCompras.length === 0 ? (
              <EmptyState
                message="No tienes compras registradas."
                cta="Explorar marketplace"
                onClick={() => router.push("/catalogo")}
              />
            ) : (
              misCompras.map((t) => {
                const animal = anuncios.find((a) => a.id === t.animalId);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                  >
                    <div>
                      <p className="font-semibold text-moorcado-gray-dark">
                        {animal?.titulo ?? t.animalId}
                      </p>
                      <p className="text-xs text-moorcado-gray-dark/60">
                        {new Date(t.fecha).toLocaleDateString("es-HN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-moorcado-green">
                        {formatLempiras(t.precio)}
                      </p>
                      <p className="text-xs text-moorcado-gray-dark/50">
                        Comisión: {formatLempiras(Math.round(t.precio * 0.025))}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "analitica" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard icon={TrendingUp} label="Tasa de conversión" value={tasaConversion} accent="green" />
              <KpiCard icon={Star} label="Calificación promedio" value={calificacionPromedio} accent="gold" />
              <KpiCard icon={DollarSign} label="Ticket promedio" value={ingresosTotal > 0 ? formatLempiras(Math.round(ingresosTotal / Math.max(misVentas.length, 1))) : "—"} accent="brown" />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <h3 className="mb-3 font-display font-bold text-moorcado-gray-dark">
                  Visualizaciones (últimos 6 meses)
                </h3>
                <VisualizacionesChart data={visualizacionesPorMes} />
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <h3 className="mb-3 font-display font-bold text-moorcado-gray-dark">
                  Ventas por mes
                </h3>
                <VentasChart data={ventasPorMes} />
              </div>
            </div>
          </div>
        )}

        {tab === "publicar" && (
          <PublicarForm onSuccess={() => setTab("anuncios")} />
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent = "green",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: "green" | "gold" | "brown" | "gray";
}) {
  const colors = {
    green: "bg-moorcado-green/10 text-moorcado-green",
    gold: "bg-moorcado-gold/15 text-moorcado-brown",
    brown: "bg-moorcado-brown/10 text-moorcado-brown",
    gray: "bg-moorcado-gray-light text-moorcado-gray-dark",
  };
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${colors[accent]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 font-display text-xl font-bold text-moorcado-gray-dark">
        {value}
      </p>
      <p className="text-xs text-moorcado-gray-dark/60">{label}</p>
    </div>
  );
}

function EmptyState({
  message,
  cta,
  onClick,
}: {
  message: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
      <p className="text-moorcado-gray-dark/60">{message}</p>
      <button
        onClick={onClick}
        className="mt-4 rounded-full bg-moorcado-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moorcado-green/90"
      >
        {cta}
      </button>
    </div>
  );
}
