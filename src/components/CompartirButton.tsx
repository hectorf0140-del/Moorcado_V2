"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import type { Anuncio } from "@/lib/types";

/**
 * Comparte el enlace de una publicación con el share sheet nativo del
 * dispositivo (navigator.share) cuando está disponible; si no, lo copia
 * al portapapeles y lo confirma brevemente en el propio botón.
 */
export default function CompartirButton({
  animal,
  variant = "icon",
}: {
  animal: Anuncio;
  variant?: "icon" | "label";
}) {
  const [copiado, setCopiado] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const titulo = animal.titulo || animal.nombre;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/animal/${animal.id}`
        : `/animal/${animal.id}`;

    if (typeof navigator === "undefined") return;

    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
      } catch {
        // el usuario cerró el share sheet nativo — no hacer nada más
      }
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  if (variant === "label") {
    return (
      <button
        onClick={handleClick}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moorcado-gray-light py-2.5 text-sm font-semibold text-moorcado-gray-dark transition hover:bg-moorcado-gray-light/70"
      >
        {copiado ? <Check className="h-4 w-4 text-moorcado-green" /> : <Share2 className="h-4 w-4" />}
        {copiado ? "Enlace copiado" : "Compartir"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Compartir"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-moorcado-gray-light text-moorcado-gray-dark transition hover:bg-moorcado-gray-light/70"
    >
      {copiado ? <Check className="h-4 w-4 text-moorcado-green" /> : <Share2 className="h-4 w-4" />}
    </button>
  );
}
