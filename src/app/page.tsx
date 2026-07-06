import Link from "next/link";
import {
  Beef,
  Milk,
  Repeat2,
  Dna,
  Stethoscope,
  Truck,
  Plus,
  ArrowRight,
} from "lucide-react";
import AnimalCard from "@/components/AnimalCard";
import { anunciosSeed } from "@/data/animales";

const categorias = [
  { icon: Milk, label: "Ganado Lechero", href: "/catalogo?tipo=leche" },
  { icon: Beef, label: "Ganado de Carne", href: "/catalogo?tipo=carne" },
  { icon: Repeat2, label: "Doble Propósito", href: "/catalogo?tipo=doble" },
  { icon: Dna, label: "Reproductores", href: "/catalogo?tipo=reproductor" },
  { icon: Stethoscope, label: "Veterinarios", href: "/rumi" },
  { icon: Truck, label: "Transportistas", href: "/mapa" },
];

export default function Home() {
  const destacados = anunciosSeed.filter((a) => a.destacado && a.activo).slice(0, 4);
  const recientes = anunciosSeed.filter((a) => a.activo).slice(0, 8);

  return (
    <div className="pb-8">
      <section className="bg-gradient-to-b from-moorcado-green to-moorcado-green/90 px-4 py-14 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-5xl">
            El mercado del ganado en Honduras
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
            Compra y vende ganado de forma fácil, segura y confiable. Miles de
            ganaderos, empresas y veterinarios ya están en Moorcado.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/publicar"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-moorcado-gold px-7 py-3.5 text-base font-bold text-moorcado-gray-dark shadow-lg transition hover:brightness-105 sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              Publicar Animal
            </Link>
            <Link
              href="/catalogo"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white/15 px-7 py-3.5 text-base font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/25 sm:w-auto"
            >
              Explorar Catálogo
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
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
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {destacados.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      </section>

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
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recientes.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      </section>
    </div>
  );
}
