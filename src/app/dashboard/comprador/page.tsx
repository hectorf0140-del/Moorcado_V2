"use client";

import { Bell, Heart, HandCoins } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { formatLempiras } from "@/lib/format";
import AnimalCard from "@/components/AnimalCard";
import { esAnuncioVisible } from "@/lib/anuncios";

export default function DashboardCompradorPage() {
  const anuncios = useAppStore((s) => s.anuncios);
  const favoritosIds = useAppStore((s) => s.favoritos);
  const favoritos = anuncios
    .filter((a) => favoritosIds.includes(a.id) && esAnuncioVisible(a))
    .slice(0, 3);
  // Alertas de búsqueda y ofertas enviadas aún no son funcionalidades reales
  // conectadas a datos del usuario, así que se muestran vacías en vez de
  // datos de prueba inventados.
  const alertas: { id: number; texto: string }[] = [];
  const ofertas: { id: number; animal: string; oferta: number; estado: string }[] = [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
        Panel de Comprador
      </h1>
      <p className="text-moorcado-gray-dark/60">
        Encuentra fácilmente lo que buscas y da seguimiento a tus favoritos.
      </p>

      <section className="mt-7">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-moorcado-gray-dark">
          <Heart className="h-5 w-5 text-moorcado-green" /> Favoritos
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favoritos.map((a) => (
            <AnimalCard key={a.id} animal={a} />
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-moorcado-gray-dark">
            <Bell className="h-5 w-5 text-moorcado-green" /> Alertas de búsqueda
          </h2>
          {alertas.length === 0 ? (
            <p className="mt-3 text-sm text-moorcado-gray-dark/50">
              Aún no tienes alertas configuradas.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {alertas.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl bg-moorcado-gray-light p-3 text-sm text-moorcado-gray-dark"
                >
                  {a.texto}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-moorcado-gray-dark">
            <HandCoins className="h-5 w-5 text-moorcado-green" /> Ofertas enviadas
          </h2>
          {ofertas.length === 0 ? (
            <p className="mt-3 text-sm text-moorcado-gray-dark/50">
              Aún no has enviado ofertas.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {ofertas.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between rounded-xl bg-moorcado-gray-light p-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-moorcado-gray-dark">{o.animal}</p>
                    <p className="text-moorcado-gray-dark/60">
                      {formatLempiras(o.oferta)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      o.estado === "Aceptada"
                        ? "bg-moorcado-green/10 text-moorcado-green"
                        : "bg-moorcado-gold/15 text-moorcado-brown"
                    }`}
                  >
                    {o.estado}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
