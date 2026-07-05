import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Heart,
  Share2,
  Milk,
  Weight,
  Cake,
  Stethoscope,
  Syringe,
  Dna,
  Eye,
  MapPin,
} from "lucide-react";
import { anunciosSeed } from "@/data/animales";
import { usuariosSeed } from "@/data/usuarios";
import { fetchAnuncioDbPorId, fetchAnunciosDb } from "@/lib/anunciosDb";
import { formatEdad, formatLempiras } from "@/lib/format";
import { calcularValoracion } from "@/lib/valoracion";
import AnimalCard from "@/components/AnimalCard";
import MiniMap from "@/components/MiniMap";
import VerifiedBadge from "@/components/VerifiedBadge";
import ValoracionCard from "@/components/ValoracionCard";
import ChatPanel from "@/components/ChatPanel";

export async function generateStaticParams() {
  return anunciosSeed.map((a) => ({ id: a.id }));
}

export default async function AnimalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Primero busca en el seed local (rápido, prerenderizado); si no está,
  // consulta Supabase — así los lotes publicados por usuarios también
  // tienen página de detalle.
  const animal =
    anunciosSeed.find((a) => a.id === id) ?? (await fetchAnuncioDbPorId(id));
  if (!animal) notFound();

  const vendedor = usuariosSeed.find((u) => u.id === animal.vendedorId);
  const todosAnuncios = (await fetchAnunciosDb()) ?? anunciosSeed;
  const relacionados = todosAnuncios
    .filter((a) => a.id !== animal.id && a.raza === animal.raza && a.activo)
    .slice(0, 3);

  const valoracion = calcularValoracion({
    raza: animal.raza,
    pesoKg: animal.pesoKg,
    edadMeses: animal.edadMeses,
  });

  const imagenes =
    animal.imagenes?.length
      ? animal.imagenes
      : Array.from({ length: Math.max(1, animal.fotos) }, (_, i) =>
          `https://loremflickr.com/800/600/cow,cattle?lock=${id}${i}`
        );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Main content */}
        <div>
          {/* Gallery */}
          <GaleriaImagenes imagenes={imagenes} />

          <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
                  {animal.titulo || animal.nombre}
                </h1>
                {animal.verificado && <VerifiedBadge size="md" />}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-moorcado-gray-dark/60">
                <MapPin className="h-4 w-4" />
                {animal.municipio}, {animal.departamento}
              </p>
            </div>
            <p className="font-display text-3xl font-extrabold text-moorcado-green">
              {formatLempiras(animal.precio)}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoStat icon={Cake} label="Edad" value={formatEdad(animal.edadMeses)} />
            <InfoStat icon={Weight} label="Peso" value={`${animal.pesoKg} kg`} />
            <InfoStat icon={Dna} label="Sexo" value={animal.sexo === "macho" ? "Macho" : "Hembra"} />
            <InfoStat icon={Eye} label="Vistas" value={`${animal.vistas}`} />
          </div>

          {animal.produccionLitrosDia && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-moorcado-green/10 p-4">
              <Milk className="h-6 w-6 text-moorcado-green" />
              <p className="text-sm font-medium text-moorcado-gray-dark">
                Producción de{" "}
                <span className="font-bold text-moorcado-green">
                  {animal.produccionLitrosDia} litros/día
                </span>
              </p>
            </div>
          )}

          {animal.descripcion && (
            <Section title="Descripción">
              <p className="text-sm leading-relaxed text-moorcado-gray-dark/80">
                {animal.descripcion}
              </p>
            </Section>
          )}

          {/* Valoración IA */}
          <div className="mt-7">
            <ValoracionCard resultado={valoracion} />
          </div>

          {/* Chat con vendedor */}
          {vendedor && (
            <Section title="Contactar vendedor">
              <ChatPanel
                animalId={animal.id}
                vendedorId={animal.vendedorId}
                vendedorNombre={vendedor.nombre}
              />
            </Section>
          )}

          <Section title="Estado de salud">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize ${
                animal.estadoSalud === "excelente"
                  ? "bg-moorcado-green/10 text-moorcado-green"
                  : animal.estadoSalud === "bueno"
                    ? "bg-moorcado-gold/15 text-moorcado-brown"
                    : "bg-red-100 text-red-600"
              }`}
            >
              {animal.estadoSalud}
            </span>
          </Section>

          {/* Vacunas estructuradas */}
          {(animal.vacunasObj?.length ?? 0) > 0 && (
            <Section title="Vacunas" icon={Syringe}>
              <div className="overflow-hidden rounded-xl ring-1 ring-black/5">
                <table className="w-full text-sm">
                  <thead className="bg-moorcado-gray-light">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-moorcado-gray-dark/60">
                        Vacuna
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-moorcado-gray-dark/60">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {animal.vacunasObj!.map((v, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-moorcado-gray-light/50"}>
                        <td className="px-4 py-2 font-medium text-moorcado-gray-dark">
                          {v.nombre}
                        </td>
                        <td className="px-4 py-2 text-moorcado-gray-dark/60">{v.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          <Section title="Historial veterinario" icon={Stethoscope}>
            {animal.historialVeterinario.length ? (
              <ul className="space-y-2">
                {animal.historialVeterinario.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl bg-moorcado-gray-light p-3 text-sm"
                  >
                    <span className="font-semibold text-moorcado-gray-dark">{h.fecha}</span>
                    <span className="text-moorcado-gray-dark/70">{h.descripcion}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyText>Sin historial veterinario registrado.</EmptyText>
            )}
          </Section>

          {(animal.padre || animal.madre || animal.registroGenealogico) && (
            <Section title="Registro genealógico" icon={Dna}>
              <div className="grid gap-2 sm:grid-cols-2">
                {animal.padre && <KeyValue label="Padre" value={animal.padre} />}
                {animal.madre && <KeyValue label="Madre" value={animal.madre} />}
                {animal.registroGenealogico && (
                  <KeyValue label="Registro" value={animal.registroGenealogico} />
                )}
                {animal.registroSag && (
                  <KeyValue label="Registro SAG" value="Verificado ✓" />
                )}
              </div>
            </Section>
          )}

          <Section title="Ubicación">
            <MiniMap
              lat={animal.lat}
              lng={animal.lng}
              label={`${animal.municipio}, ${animal.departamento}`}
            />
          </Section>

          {relacionados.length > 0 && (
            <Section title={`Más de raza ${animal.raza}`}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {relacionados.map((a) => (
                  <AnimalCard key={a.id} animal={a} />
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            {vendedor && (
              <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: vendedor.avatarColor }}
                >
                  {vendedor.iniciales}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 font-semibold text-moorcado-gray-dark">
                    {vendedor.nombre}
                    {vendedor.verificado && (
                      <VerifiedBadge />
                    )}
                  </p>
                  <p className="text-xs capitalize text-moorcado-gray-dark/60">
                    {vendedor.tipo} · ⭐ {vendedor.calificacion} · {vendedor.numeroVentas} ventas
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2.5">
              <a
                href={`https://wa.me/${vendedor?.telefono?.replace(/\D/g, "") ?? "50499999999"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-bold text-white transition hover:brightness-95"
              >
                Enviar WhatsApp
              </a>
              <a
                href={`tel:${vendedor?.telefono ?? "+50499999999"}`}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 py-3 text-sm font-bold text-moorcado-gray-dark transition hover:bg-moorcado-gray-light"
              >
                <Phone className="h-4 w-4" />
                Llamar
              </a>
              <div className="flex gap-2.5">
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moorcado-gray-light py-2.5 text-sm font-semibold text-moorcado-gray-dark">
                  <Heart className="h-4 w-4" />
                  Guardar
                </button>
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moorcado-gray-light py-2.5 text-sm font-semibold text-moorcado-gray-dark">
                  <Share2 className="h-4 w-4" />
                  Compartir
                </button>
              </div>
            </div>
          </div>

          <p className="px-2 text-xs text-moorcado-gray-dark/50">
            Publicado {animal.publicadoHace} · {animal.vistas} vistas
          </p>
        </aside>
      </div>
    </div>
  );
}

// ─── Gallery with real images ─────────────────────────────────────────────────
function GaleriaImagenes({ imagenes }: { imagenes: string[] }) {
  // We render a static gallery — for interactive switching we'd need a Client Component
  // For now we display the first image prominently with thumbs below
  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-moorcado-gray-light">
        <Image
          src={imagenes[0]}
          alt="Foto principal del animal"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 65vw"
          unoptimized
        />
      </div>
      {imagenes.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
          {imagenes.map((src, i) => (
            <div
              key={i}
              className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg ring-2 ring-transparent"
            >
              <Image
                src={src}
                alt={`Foto ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function InfoStat({ icon: Icon, label, value }: { icon: typeof Cake; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5">
      <Icon className="h-5 w-5 text-moorcado-green" />
      <span className="font-display text-sm font-bold text-moorcado-gray-dark">{value}</span>
      <span className="text-[11px] text-moorcado-gray-dark/50">{label}</span>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof Cake;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-moorcado-gray-dark">
        {Icon && <Icon className="h-5 w-5 text-moorcado-green" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-moorcado-gray-light p-3">
      <p className="text-xs text-moorcado-gray-dark/50">{label}</p>
      <p className="text-sm font-semibold text-moorcado-gray-dark">{value}</p>
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-moorcado-gray-dark/50">{children}</p>;
}
