import CatalogoClient from "@/components/CatalogoClient";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  return <CatalogoClient initialTipo={tipo} />;
}
