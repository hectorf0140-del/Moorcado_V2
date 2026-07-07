"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import PublicarForm from "@/components/PublicarForm";

export default function EditarAnuncioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sesion = useAppStore((s) => s.sesion);
  const anuncios = useAppStore((s) => s.anuncios);

  const anuncio = anuncios.find((a) => a.id === id);

  if (!sesion) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <p className="text-center text-base text-moorcado-gray-dark/70">
            Inicia sesión para editar tu publicación.
          </p>
        </div>
      </div>
    );
  }

  if (!anuncio || anuncio.vendedorId !== sesion.usuarioId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <p className="text-center text-base text-moorcado-gray-dark/70">
            No encontramos esa publicación o no tienes permiso para editarla.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
        Editar publicación
      </h1>
      <p className="mt-1 text-moorcado-gray-dark/60">
        Actualiza la información o las fotos de tu anuncio.
      </p>
      <div className="mt-7">
        <PublicarForm
          anuncioExistente={anuncio}
          onSuccess={() => router.push("/dashboard/vendedor")}
        />
      </div>
    </div>
  );
}
