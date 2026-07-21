"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import {
  Beef,
  Milk,
  Repeat2,
  Dna,
  Stethoscope,
  Truck,
  ArrowRight,
  Camera,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import AnimalCard from "@/components/AnimalCard";
import CattleCarousel from "@/components/landing/CattleCarousel";
import { anunciosVisibles } from "@/lib/anuncios";

const categorias = [
  { icon: Milk, label: "Ganado Lechero", href: "/catalogo?tipo=leche" },
  { icon: Beef, label: "Ganado de Carne", href: "/catalogo?tipo=carne" },
  { icon: Repeat2, label: "Doble Propósito", href: "/catalogo?tipo=doble" },
  { icon: Dna, label: "Reproductores", href: "/catalogo?tipo=reproductor" },
  { icon: Stethoscope, label: "Veterinarios", href: "/rumi" },
  { icon: Truck, label: "Transportistas", href: "/mapa" },
];

const servicios = [
  {
    icon: Camera,
    etiqueta: "Publicación",
    titulo: "Publica en minutos",
    descripcion: "Subí fotos reales de tu ganado y publicá tu lote sin complicaciones.",
    foto: "/hero-campo-vacas.jpg",
  },
  {
    icon: MessageCircle,
    etiqueta: "Contacto",
    titulo: "Chat directo",
    descripcion: "Hablá directo con compradores y vendedores dentro de la plataforma.",
    foto: "/registro-campo-vacas.jpg",
  },
  {
    icon: Sparkles,
    etiqueta: "Precio justo",
    titulo: "Valoración con IA",
    descripcion: "Una estimación de precio justo antes de publicar o negociar.",
    foto: "/hero-campo-vacas.jpg",
  },
];

export default function Home() {
  const anuncios = useAppStore((s) => s.anuncios);
  const usuarios = useAppStore((s) => s.usuarios);
  const disponibles = anunciosVisibles(anuncios);

  const planPorVendedor = new Map(usuarios.map((u) => [u.id, u.plan]));
  const destacados = disponibles.filter((a) => planPorVendedor.get(a.vendedorId) === "premium");

  const recientes = [...disponibles]
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    .slice(0, 8);

  const avataresMuestra = usuarios.slice(0, 3);

  return (
    <div className="pb-8">
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-moorcado-green bg-cover bg-center px-4 pb-20 pt-28 text-white sm:px-6 sm:pb-28 sm:pt-32"
        style={{ backgroundImage: "url('/hero-campo-vacas.jpg')" }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/40 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <span className="inline-flex items-center rounded-full border border-white/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/90">
            El mercado del ganado en Honduras
          </span>
          <h1 className="mt-5 max-w-xl font-display text-4xl font-extrabold leading-[1.1] sm:text-6xl">
            Compra y venta de ganado hecha fácil
          </h1>
          <p className="mt-5 max-w-md text-white/85">
            Miles de ganaderos, empresas y veterinarios ya publican, negocian
            y cierran ventas de ganado todos los días en Moorcado.
          </p>
          <div className="mt-9">
            <Link
              href="/catalogo"
              className="flex w-fit items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-moorcado-green transition hover:bg-white/90"
            >
              Ver Catálogo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Franja de confianza */}
      <section className="bg-moorcado-green/10 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {avataresMuestra.map((u) => (
                <span
                  key={u.id}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white"
                  style={{ backgroundColor: u.avatarColor || "#1F4D2C" }}
                  title={u.nombre}
                >
                  {u.iniciales}
                </span>
              ))}
            </div>
            <p className="font-display text-sm font-bold text-moorcado-gray-dark sm:text-base">
              {usuarios.length}+ ganaderos ya confían en Moorcado
            </p>
          </div>

          <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-moorcado-green/40 sm:flex">
            <Beef className="h-7 w-7 text-moorcado-green/70" />
          </span>

          <div className="flex items-center gap-3">
            <p className="font-display text-sm font-bold text-moorcado-gray-dark sm:text-base">
              Ganado real, fotos reales, ventas reales
            </p>
            <span className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-white sm:block">
              <Image src="/hero-campo-vacas.jpg" alt="" fill sizes="56px" className="object-cover" />
            </span>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="inline-block rounded-full bg-moorcado-green/10 px-3 py-1 text-xs font-semibold text-moorcado-green">
              Nuestros servicios
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
              Todo lo que necesitás para comprar y vender ganado
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-moorcado-green sm:flex"
          >
            Ver más <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {servicios.map(({ icon: Icon, etiqueta, titulo, descripcion, foto }) => (
            <div
              key={titulo}
              className="overflow-hidden rounded-3xl bg-moorcado-green text-white shadow-sm"
            >
              <div className="relative h-44 w-full">
                <Image src={foto} alt="" fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-moorcado-gray-dark">
                  <Icon className="h-3.5 w-3.5 text-moorcado-green" />
                  {etiqueta}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-bold">{titulo}</h3>
                <p className="mt-1.5 text-sm text-white/75">{descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <h2 className="font-display text-xl font-bold text-moorcado-gray-dark sm:text-2xl">
          Categorías
        </h2>
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
          {categorias.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moorcado-green/10 text-moorcado-green">
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-xs font-medium leading-tight text-moorcado-gray-dark sm:text-sm">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {destacados.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-moorcado-gray-dark sm:text-2xl">
              Publicaciones destacadas
            </h2>
            <Link
              href="/catalogo"
              className="flex items-center gap-1 text-sm font-semibold text-moorcado-green"
            >
              Ver todo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5">
            <CattleCarousel anuncios={destacados} />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-moorcado-gray-dark sm:text-2xl">
            Animales recientes
          </h2>
          <Link
            href="/catalogo"
            className="flex items-center gap-1 text-sm font-semibold text-moorcado-green"
          >
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="scrollbar-none -mx-4 mt-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          {recientes.map((animal) => (
            <div key={animal.id} className="w-72 shrink-0 snap-start sm:w-80">
              <AnimalCard animal={animal} />
            </div>
          ))}
        </div>
      </section>

      {/* Sobre nosotros */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-14">
          <div>
            <span className="inline-block rounded-full bg-moorcado-green/10 px-3 py-1 text-xs font-semibold text-moorcado-green">
              Sobre nosotros
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
              Hecho para el sector ganadero de Honduras
            </h2>
            <p className="mt-4 text-moorcado-gray-dark/70">
              Moorcado nació para resolver un problema simple: comprar y
              vender ganado en Honduras dependía de contactos, ferias y
              rumores de precio. Armamos un solo lugar donde cualquier
              ganadero, empresa o veterinario puede publicar sus animales con
              fotos reales, hablar directo con la otra parte por chat, y
              buscar por raza, peso, precio y departamento sin perder tiempo.
            </p>
            <p className="mt-3 text-moorcado-gray-dark/70">
              Seguimos construyendo la plataforma junto con los ganaderos que
              ya la usan todos los días.
            </p>
            <Link
              href="/catalogo"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-moorcado-green px-6 py-3 text-sm font-semibold text-white transition hover:bg-moorcado-green/90"
            >
              Explorar Catálogo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative h-72 w-full overflow-hidden rounded-3xl sm:h-96">
            <Image
              src="/registro-campo-vacas.jpg"
              alt="Ganado pastando en un campo de Honduras"
              fill
              sizes="(min-width: 1024px) 420px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
