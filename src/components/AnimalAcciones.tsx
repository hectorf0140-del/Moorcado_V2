"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import CompartirButton from "./CompartirButton";

export default function AnimalAcciones({
  animalId,
  titulo,
}: {
  animalId: string;
  titulo: string;
}) {
  const router = useRouter();
  const sesion = useAppStore((s) => s.sesion);
  const favoritos = useAppStore((s) => s.favoritos);
  const toggleFavorito = useAppStore((s) => s.toggleFavorito);
  const favorito = favoritos.includes(animalId);

  function handleFavorito() {
    if (!sesion) {
      router.push("/login");
      return;
    }
    toggleFavorito(animalId);
  }

  return (
    <div className="flex gap-2.5">
      <button
        type="button"
        onClick={handleFavorito}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moorcado-gray-light py-2.5 text-sm font-semibold text-moorcado-gray-dark"
      >
        <Heart className={`h-4 w-4 ${favorito ? "fill-red-500 text-red-500" : ""}`} />
        {favorito ? "Guardado" : "Guardar"}
      </button>
      <CompartirButton
        titulo={titulo}
        url={typeof window !== "undefined" ? window.location.href : ""}
        variante="completo"
      />
    </div>
  );
}
