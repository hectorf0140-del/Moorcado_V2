"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export default function CompartirButton({
  titulo,
  url,
  variante = "icono",
}: {
  titulo: string;
  url: string;
  variante?: "icono" | "completo";
}) {
  const [copiado, setCopiado] = useState(false);

  async function handleClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
      } catch {
        // el usuario cerró el diálogo nativo de compartir — no hacer nada
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // portapapeles no disponible en este navegador — no hay más fallback
    }
  }

  if (variante === "completo") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moorcado-gray-light py-2.5 text-sm font-semibold text-moorcado-gray-dark"
      >
        {copiado ? (
          <Check className="h-4 w-4 text-moorcado-green" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {copiado ? "¡Enlace copiado!" : "Compartir"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Compartir"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-moorcado-gray-light text-moorcado-gray-dark transition hover:bg-moorcado-gray-light/70"
    >
      {copiado ? (
        <Check className="h-4 w-4 text-moorcado-green" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </button>
  );
}
