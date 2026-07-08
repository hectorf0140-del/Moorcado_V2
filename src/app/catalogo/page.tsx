import CatalogoClient from "@/components/CatalogoClient";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; q?: string }>;
}) {
  const { tipo, q } = await searchParams;
  return <CatalogoClient initialTipo={tipo} initialQuery={q} />;
}
