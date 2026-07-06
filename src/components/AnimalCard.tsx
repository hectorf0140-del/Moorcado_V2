"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MapPin, Share2, Star } from "lucide-react";
import type { Animal } from "@/lib/types";
import { formatEdad, formatLempiras } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";
import AnimalImage from "./AnimalImage";
import VerifiedBadge from "./VerifiedBadge";

export default function AnimalCard({ animal }: { animal: Animal }) {
  const router = useRouter();
  const sesion = useAppStore((s) => s.sesion);
  const favorito = useAppStore((s) => s.favoritos.includes(animal.id));
  const toggleFavorito = useAppStore((s) => s.toggleFavorito);

  function handleFavorito() {
    if (!sesion) {
      router.push("/login");
      return;
    }
    toggleFavorito(animal.id);
  }

  async function handleCompartir() {
    const url = `${window.location.origin}/animal/${animal.id}`;
    const titulo = `${animal.nombre} en Moorcado`;
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Enlace copiado al portapapeles");
      }
    } catch {
      // usuario canceló el diálogo de compartir
    }
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/animal/${animal.id}`} className="block">
        <div className="relative aspect-[4/3] w-full">
          <AnimalImage
            colorPrimario={animal.colorPrimario}
            colorSecundario={animal.colorSecundario}
            className="h-full w-full"
          />
          {animal.destacado && (
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-moorcado-gold px-2.5 py-1 text-[11px] font-bold text-white shadow">
              <Star className="h-3 w-3 fill-white" />
              Destacado
            </span>
          )}
          {animal.vendido && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-moorcado-gray-dark">
                Vendido
              </span>
            </span>
          )}
        </div>
      </Link>

      <button
        onClick={handleFavorito}
        aria-label="Guardar en favoritos"
        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-moorcado-gray-dark shadow transition hover:scale-105"
      >
        <Heart
          className={`h-4 w-4 ${favorito ? "fill-red-500 text-red-500" : ""}`}
        />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display font-semibold text-moorcado-gray-dark">
              {animal.nombre}
            </h3>
            <p className="text-sm text-moorcado-gray-dark/60">
              {animal.raza} · {formatEdad(animal.edadMeses)}
            </p>
          </div>
          {animal.verificado && <VerifiedBadge />}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-moorcado-gray-dark/70">
          <span>{animal.pesoKg} kg</span>
          <span>·</span>
          <span className="capitalize">{animal.sexo}</span>
          {animal.registroSag && (
            <>
              <span>·</span>
              <span>Registro SAG</span>
            </>
          )}
        </div>

        <p className="font-display text-lg font-bold text-moorcado-green">
          {formatLempiras(animal.precio)}
        </p>

        <div className="flex items-center gap-1 text-xs text-moorcado-gray-dark/60">
          <MapPin className="h-3.5 w-3.5" />
          {animal.departamento} · {animal.distanciaKm} km
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Link
            href={`/animal/${animal.id}`}
            className="flex-1 rounded-full bg-moorcado-green py-2 text-center text-sm font-semibold text-white transition hover:bg-moorcado-green/90"
          >
            Ver Detalles
          </Link>
          <button
            onClick={handleCompartir}
            aria-label="Compartir"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-moorcado-gray-light text-moorcado-gray-dark transition hover:bg-moorcado-gray-light/70"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
