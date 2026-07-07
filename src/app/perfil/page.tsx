"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Heart,
  Settings,
  SquarePen,
  Star,
  LayoutDashboard,
} from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppStore } from "@/store/useAppStore";
import AnimalCard from "@/components/AnimalCard";
import VerifiedBadge from "@/components/VerifiedBadge";

export default function PerfilPage() {
  const { sesion, loading } = useAuthGuard();
  const usuarios = useAppStore((s) => s.usuarios);
  const anuncios = useAppStore((s) => s.anuncios);
  const favoritos = useAppStore((s) => s.favoritos);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-moorcado-green border-t-transparent" />
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6">
        <p className="text-base text-moorcado-gray-dark/70">
          Inicia sesión para ver tu perfil.
        </p>
      </div>
    );
  }

  const usuario =
    usuarios.find((u) => u.id === sesion.usuarioId) ?? {
      id: sesion.usuarioId,
      nombre: sesion.nombre,
      iniciales: sesion.iniciales,
      avatarColor: sesion.avatarColor,
      tipo: "vendedor" as const,
      verificado: false,
      calificacion: 0,
      numeroVentas: 0,
      publicacionesActivas: 0,
      resenas: 0,
      plan: "gratuito" as const,
      departamento: "",
    };

  const publicaciones = anuncios.filter((a) => a.vendedorId === usuario.id);
  const animalesFavoritos = anuncios.filter((a) => favoritos.includes(a.id));

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
          <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
            <Link
              href="/perfil"
              className="flex items-center gap-1.5 rounded-full bg-moorcado-green px-4 py-2.5 text-sm font-semibold text-white"
            >
              <SquarePen className="h-4 w-4" />
              Editar Perfil
            </Link>
            <Link
              href="/planes"
              className="flex items-center gap-1.5 rounded-full bg-moorcado-gold/15 px-4 py-2.5 text-sm font-semibold text-moorcado-brown"
            >
              <Star className="h-4 w-4" />
              Mejorar plan
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

        <div className="mt-6 grid grid-cols-4 gap-3 border-t border-black/5 pt-6 sm:max-w-lg">
          <Stat label="Ventas" value={usuario.numeroVentas} />
          <Stat label="Publicaciones" value={usuario.publicacionesActivas} />
          <Stat label="Reseñas" value={usuario.resenas} />
          <Stat label="Favoritos" value={favoritos.length} />
        </div>

        <Link
          href="/dashboard/vendedor"
          className="mt-6 flex items-center justify-center gap-2 rounded-full border border-moorcado-green/30 py-3 text-sm font-semibold text-moorcado-green transition hover:bg-moorcado-green/5"
        >
          <LayoutDashboard className="h-4 w-4" />
          Ir a mi Dashboard de Vendedor
        </Link>

        <Link
          href="/verificacion"
          className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-moorcado-gray-light px-4 py-3 text-sm font-semibold text-moorcado-gray-dark transition hover:bg-moorcado-gray-light/70"
        >
          <span className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-moorcado-green" />
            {usuario.verificado ? "Ver mis reseñas" : "Solicitar verificación"}
          </span>
          <ArrowRight className="h-4 w-4 text-moorcado-gray-dark/40" />
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-moorcado-gray-dark">
          <Heart className="h-5 w-5 text-moorcado-green" />
          Mis favoritos
        </h2>
        {animalesFavoritos.length === 0 ? (
          <p className="mt-3 text-sm text-moorcado-gray-dark/50">
            Aún no has guardado ningún animal. Toca el corazón en una publicación
            para agregarla aquí.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {animalesFavoritos.map((a) => (
              <AnimalCard key={a.id} animal={a} />
            ))}
          </div>
        )}
      </section>

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
