"use client";

import { Bell, Clock, Heart, HandCoins, Plus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { formatLempiras } from "@/lib/format";
import AnimalCard from "@/components/AnimalCard";

const alertas = [
  { id: 1, texto: "Nueva vaca Holstein en Comayagua bajo L. 50,000" },
  { id: 2, texto: "Toros Brahman cerca de Olancho (menos de 30 km)" },
];

const ofertas = [
  { id: 1, animal: "Trueno (Angus)", oferta: 36000, estado: "Pendiente" },
  { id: 2, animal: "Estrellita (Gyr)", oferta: 31000, estado: "Aceptada" },
];

export default function DashboardCompradorPage() {
  const anuncios = useAppStore((s) => s.anuncios);
  const favoritosIds = useAppStore((s) => s.favoritos);
  const favoritos = anuncios.filter((a) => favoritosIds.includes(a.id)).slice(0, 3);
  const historial = anuncios.slice(2, 5);
  const vistos = anuncios.slice(1, 6);

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
          <button className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-moorcado-green">
            <Plus className="h-4 w-4" /> Nueva alerta
          </button>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-moorcado-gray-dark">
            <HandCoins className="h-5 w-5 text-moorcado-green" /> Ofertas enviadas
          </h2>
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
        </section>
      </div>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-moorcado-gray-dark">
          <Clock className="h-5 w-5 text-moorcado-green" /> Historial de búsquedas
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {historial.map((a) => (
            <AnimalCard key={a.id} animal={a} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-moorcado-gray-dark">
          Animales vistos recientemente
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vistos.map((a) => (
            <AnimalCard key={a.id} animal={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
