"use client";

import Link from "next/link";
import {
  Eye,
  FileStack,
  MessageCircle,
  ShoppingBag,
  CircleCheck,
  PackageOpen,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import StatCard from "@/components/StatCard";
import AnimalCard from "@/components/AnimalCard";
import { VentasChart, VisualizacionesChart } from "@/components/DashboardCharts";

export default function DashboardVendedorPage() {
  const sesion = useAppStore((s) => s.sesion);
  const usuarios = useAppStore((s) => s.usuarios);
  const anuncios = useAppStore((s) => s.anuncios);

  const usuario = sesion
    ? usuarios.find((u) => u.id === sesion.usuarioId)
    : undefined;

  const publicaciones = usuario ? anuncios.filter((a) => a.vendedorId === usuario.id) : [];
  const disponibles = publicaciones.filter((a) => !a.vendido);
  const vendidos = publicaciones.filter((a) => a.vendido);
  const vistasTotales = publicaciones.reduce((acc, a) => acc + a.vistas, 0);

  if (!usuario) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <p className="text-center text-base text-moorcado-gray-dark/70">
            Inicia sesión para ver tu panel de vendedor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
            Panel de Vendedor
          </h1>
          <p className="text-moorcado-gray-dark/60">
            Hola, {usuario.nombre}. Así va tu actividad en Moorcado.
          </p>
        </div>
        <Link
          href="/publicar"
          className="rounded-full bg-moorcado-green px-5 py-2.5 text-sm font-semibold text-white"
        >
          + Publicar Animal
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={FileStack} label="Publicaciones" value={publicaciones.length} />
        <StatCard icon={Eye} label="Visualizaciones" value={vistasTotales} accent="gold" />
        <StatCard icon={MessageCircle} label="Mensajes recibidos" value={14} accent="brown" />
        <StatCard icon={ShoppingBag} label="Ventas" value={usuario.numeroVentas} />
        <StatCard icon={CircleCheck} label="Animales vendidos" value={vendidos.length} accent="gold" />
        <StatCard icon={PackageOpen} label="Disponibles" value={disponibles.length} accent="brown" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display font-bold text-moorcado-gray-dark">
            Visualizaciones (últimos 6 meses)
          </h2>
          <VisualizacionesChart />
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display font-bold text-moorcado-gray-dark">
            Ventas por mes
          </h2>
          <VentasChart />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-moorcado-gray-dark">
          Mis publicaciones
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {publicaciones.map((a) => (
            <AnimalCard key={a.id} animal={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
