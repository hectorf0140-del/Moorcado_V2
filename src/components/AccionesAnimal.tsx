"use client";

import { useRouter } from "next/navigation";
import { Heart, Share2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

/** Botones Guardar/Compartir de la página de detalle (client). */
export default function AccionesAnimal({
  animalId,
  nombre,
}: {
  animalId: string;
  nombre: string;
}) {
  const router = useRouter();
  const sesion = useAppStore((s) => s.sesion);
  const favorito = useAppStore((s) => s.favoritos.includes(animalId));
  const toggleFavorito = useAppStore((s) => s.toggleFavorito);

  function handleGuardar() {
    if (!sesion) {
      router.push("/login");
      return;
    }
    toggleFavorito(animalId);
  }

  async function handleCompartir() {
    const url = `${window.location.origin}/animal/${animalId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${nombre} en Moorcado`, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Enlace copiado al portapapeles");
      }
    } catch {
      // usuario canceló
    }
  }

  return (
    <div className="flex gap-2.5">
      <button
        onClick={handleGuardar}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition ${
          favorito
            ? "bg-red-50 text-red-600"
            : "bg-moorcado-gray-light text-moorcado-gray-dark"
        }`}
      >
        <Heart className={`h-4 w-4 ${favorito ? "fill-red-500 text-red-500" : ""}`} />
        {favorito ? "Guardado" : "Guardar"}
      </button>
      <button
        onClick={handleCompartir}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moorcado-gray-light py-2.5 text-sm font-semibold text-moorcado-gray-dark"
      >
        <Share2 className="h-4 w-4" />
        Compartir
      </button>
    </div>
  );
}
