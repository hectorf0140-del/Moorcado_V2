"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import PublicarForm from "@/components/PublicarForm";
import { PantallaCargando } from "@/components/Spinner";

export default function PublicarPage() {
  const { loading } = useAuthGuard();

  if (loading) {
    return <PantallaCargando />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
        Publicar Animal
      </h1>
      <p className="mt-1 text-moorcado-gray-dark/60">
        Completa la información para que tu publicación llegue a más compradores.
      </p>
      <div className="mt-7">
        <PublicarForm />
      </div>
    </div>
  );
}
