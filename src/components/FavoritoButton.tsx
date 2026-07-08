"use client";

import { Heart } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Anuncio } from "@/lib/types";

/**
 * Botón de "me gusta" reutilizado en la tarjeta de catálogo (icono) y en el
 * detalle del animal (con etiqueta). Al marcar como favorito una
 * publicación ajena, se le notifica al vendedor — no al quitarlo, y nunca
 * si el propio vendedor marca su publicación.
 */
export default function FavoritoButton({
  animal,
  variant = "icon",
}: {
  animal: Anuncio;
  variant?: "icon" | "label";
}) {
  const favoritos = useAppStore((s) => s.favoritos);
  const sesion = useAppStore((s) => s.sesion);
  const toggleFavorito = useAppStore((s) => s.toggleFavorito);
  const esFavorito = favoritos.includes(animal.id);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const seAgrega = !esFavorito;
    toggleFavorito(animal.id);

    if (seAgrega && sesion && sesion.usuarioId !== animal.vendedorId) {
      void import("@/lib/notificacionesDb").then(({ crearNotificacionDb }) =>
        crearNotificacionDb({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          usuarioId: animal.vendedorId,
          tipo: "favorito",
          titulo: "A alguien le gustó tu publicación",
          descripcion: `${sesion.nombre} marcó "${animal.titulo || animal.nombre}" como favorito.`,
          referenciaId: animal.id,
        })
      );
    }
  }

  if (variant === "label") {
    return (
      <button
        onClick={handleClick}
        aria-pressed={esFavorito}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition ${
          esFavorito
            ? "bg-red-50 text-red-600"
            : "bg-moorcado-gray-light text-moorcado-gray-dark hover:bg-moorcado-gray-light/70"
        }`}
      >
        <Heart className={`h-4 w-4 ${esFavorito ? "fill-red-500 text-red-500" : ""}`} />
        {esFavorito ? "Guardado" : "Guardar"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label={esFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
      aria-pressed={esFavorito}
      className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-moorcado-gray-dark shadow transition hover:scale-105"
    >
      <Heart className={`h-4 w-4 ${esFavorito ? "fill-red-500 text-red-500" : ""}`} />
    </button>
  );
}
