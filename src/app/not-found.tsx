import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-moorcado-green">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
        Esta página no existe
      </h1>
      <p className="mt-2 max-w-sm text-moorcado-gray-dark/60">
        Parece que este lote se vendió o la página fue movida. Pero hay
        cientos de animales más esperándote.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/catalogo"
          className="rounded-full bg-moorcado-green px-6 py-3 text-sm font-bold text-white transition hover:bg-moorcado-green/90"
        >
          Explorar marketplace
        </Link>
        <Link
          href="/"
          className="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-moorcado-gray-dark transition hover:bg-moorcado-gray-light"
        >
          Ir al inicio
        </Link>
      </div>
      <p className="mt-10 text-5xl">🐄</p>
    </div>
  );
}
