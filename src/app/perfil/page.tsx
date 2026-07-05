import Link from "next/link";
import { Settings, SquarePen, Star, LayoutDashboard } from "lucide-react";
import { USUARIO_ACTUAL_ID, animales, getUsuario } from "@/lib/mock-data";
import AnimalCard from "@/components/AnimalCard";
import VerifiedBadge from "@/components/VerifiedBadge";

const resenasEjemplo = [
  {
    autor: "Marvin Zelaya",
    texto: "Excelente vendedor, el animal era tal como en las fotos.",
    estrellas: 5,
  },
  {
    autor: "Lácteos del Valle",
    texto: "Buena comunicación y entrega puntual.",
    estrellas: 4,
  },
];

export default function PerfilPage() {
  const usuario = getUsuario(USUARIO_ACTUAL_ID)!;
  const publicaciones = animales.filter((a) => a.vendedorId === usuario.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <span
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{ background: usuario.avatarColor }}
          >
            {usuario.iniciales}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark">
                {usuario.nombre}
              </h1>
              {usuario.verificado && <VerifiedBadge size="md" />}
              {usuario.plan === "premium" && (
                <span className="rounded-full bg-moorcado-gold/15 px-2.5 py-1 text-xs font-bold text-moorcado-brown">
                  ⭐ Premium
                </span>
              )}
            </div>
            <p className="mt-1 capitalize text-moorcado-gray-dark/60">
              {usuario.tipo} · {usuario.departamento}
            </p>
            <div className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-moorcado-gray-dark sm:justify-start">
              <Star className="h-4 w-4 fill-moorcado-gold text-moorcado-gold" />
              {usuario.calificacion} ({usuario.resenas} reseñas)
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/perfil"
              className="flex items-center gap-1.5 rounded-full bg-moorcado-green px-4 py-2.5 text-sm font-semibold text-white"
            >
              <SquarePen className="h-4 w-4" />
              Editar Perfil
            </Link>
            <Link
              href="/perfil"
              aria-label="Configuración"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-moorcado-gray-light text-moorcado-gray-dark"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-black/5 pt-6 sm:max-w-md">
          <Stat label="Ventas" value={usuario.numeroVentas} />
          <Stat label="Publicaciones" value={usuario.publicacionesActivas} />
          <Stat label="Reseñas" value={usuario.resenas} />
        </div>

        <Link
          href="/dashboard/vendedor"
          className="mt-6 flex items-center justify-center gap-2 rounded-full border border-moorcado-green/30 py-3 text-sm font-semibold text-moorcado-green transition hover:bg-moorcado-green/5"
        >
          <LayoutDashboard className="h-4 w-4" />
          Ir a mi Dashboard de Vendedor
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-moorcado-gray-dark">
          Animales publicados
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {publicaciones.map((a) => (
            <AnimalCard key={a.id} animal={a} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-moorcado-gray-dark">
          Reseñas
        </h2>
        <div className="mt-4 space-y-3">
          {resenasEjemplo.map((r) => (
            <div
              key={r.autor}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-moorcado-gray-dark">{r.autor}</p>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < r.estrellas
                          ? "fill-moorcado-gold text-moorcado-gold"
                          : "text-moorcado-gray-dark/20"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-1 text-sm text-moorcado-gray-dark/70">{r.texto}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-moorcado-gray-light p-3 text-center">
      <p className="font-display text-xl font-bold text-moorcado-gray-dark">
        {value}
      </p>
      <p className="text-xs text-moorcado-gray-dark/60">{label}</p>
    </div>
  );
}
