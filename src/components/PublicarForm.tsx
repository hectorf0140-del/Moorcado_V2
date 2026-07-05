"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Info, MapPin, Syringe, Plus, X } from "lucide-react";
import { DEPARTAMENTOS_HONDURAS, RAZAS_GANADO, type Sexo } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { calcularValoracion } from "@/lib/valoracion";
import { formatLempiras } from "@/lib/format";
import type { Anuncio } from "@/lib/types";

interface Props {
  onSuccess?: () => void;
}

export default function PublicarForm({ onSuccess }: Props) {
  const router = useRouter();
  const sesion = useAppStore((s) => s.sesion);
  const agregarAnuncio = useAppStore((s) => s.agregarAnuncio);

  const [titulo, setTitulo] = useState("");
  const [raza, setRaza] = useState<string>(RAZAS_GANADO[0]);
  const [proposito, setProposito] = useState<Anuncio["proposito"]>("cárnico");
  const [sexo, setSexo] = useState<Sexo>("macho");
  const [precio, setPrecio] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [edadMeses, setEdadMeses] = useState("");
  const [departamento, setDepartamento] = useState<string>(DEPARTAMENTOS_HONDURAS[0]);
  const [municipio, setMunicipio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [vacunas, setVacunas] = useState<string[]>([""]);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  // Sugerencia de precio en tiempo real
  const [sugerencia, setSugerencia] = useState<ReturnType<
    typeof calcularValoracion
  > | null>(null);

  useEffect(() => {
    const peso = Number(pesoKg);
    const edad = Number(edadMeses);
    if (raza && peso > 0 && edad > 0) {
      setSugerencia(calcularValoracion({ raza, pesoKg: peso, edadMeses: edad }));
    } else {
      setSugerencia(null);
    }
  }, [raza, pesoKg, edadMeses]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sesion) {
      router.push("/login");
      return;
    }

    setEnviando(true);

    const id = `a-${Date.now()}`;
    const vacunasFiltradas = vacunas.filter((v) => v.trim());

    const nuevo: Anuncio = {
      id,
      titulo: titulo || `${raza} – ${sexo === "macho" ? "Toro" : "Vaca"} en ${departamento}`,
      nombre: titulo || raza,
      raza,
      edadMeses: Number(edadMeses) || 12,
      pesoKg: Number(pesoKg) || 300,
      sexo,
      precio: Number(precio) || 0,
      tipo:
        proposito === "lechero"
          ? "leche"
          : proposito === "cárnico"
            ? "carne"
            : "doble",
      proposito,
      descripcion,
      departamento,
      municipio,
      distanciaKm: 0,
      lat: 14.0,
      lng: -87.2,
      vendedorId: sesion.usuarioId,
      vendorId: sesion.usuarioId,
      destacado: false,
      registroSag: false,
      verificado: false,
      estadoSalud: "bueno",
      vacunas: vacunasFiltradas,
      desparasitaciones: [],
      historialVeterinario: [],
      fotos: 1,
      imagenes: [`https://loremflickr.com/800/600/cow,cattle?lock=${Date.now() % 9999}`],
      colorPrimario: "#D9B98C",
      colorSecundario: "#8C5A2B",
      publicadoHace: "hace un momento",
      vistas: 0,
      activo: true,
      creadoEn: new Date().toISOString(),
      ubicacion: {
        departamento,
        municipio,
      },
      vacunasObj: vacunasFiltradas.map((nombre) => ({
        nombre,
        fecha: new Date().toISOString().split("T")[0],
      })),
    };

    agregarAnuncio(nuevo);
    setExito(true);

    setTimeout(() => {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/catalogo");
      }
    }, 800);
  }

  if (exito) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-3 font-display text-xl font-bold text-moorcado-gray-dark">
          ¡Lote publicado!
        </h2>
        <p className="mt-1 text-sm text-moorcado-gray-dark/60">
          Tu anuncio ya está visible en el marketplace.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Datos básicos */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-moorcado-gray-dark">
          <Info className="h-5 w-5 text-moorcado-green" />
          Información del animal
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Título del anuncio
            </span>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Vaca Brahman alta producción – Olancho"
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Raza
            </span>
            <select
              required
              value={raza}
              onChange={(e) => setRaza(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            >
              {RAZAS_GANADO.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Propósito
            </span>
            <select
              value={proposito}
              onChange={(e) => setProposito(e.target.value as Anuncio["proposito"])}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            >
              <option value="lechero">Lechero</option>
              <option value="cárnico">Cárnico</option>
              <option value="doble propósito">Doble propósito</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Sexo
            </span>
            <select
              value={sexo}
              onChange={(e) => setSexo(e.target.value as Sexo)}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            >
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Peso (kg)
            </span>
            <input
              type="number"
              required
              min={50}
              value={pesoKg}
              onChange={(e) => setPesoKg(e.target.value)}
              placeholder="Ej. 450"
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Edad (meses)
            </span>
            <input
              type="number"
              required
              min={1}
              value={edadMeses}
              onChange={(e) => setEdadMeses(e.target.value)}
              placeholder="Ej. 24"
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Precio (Lempiras)
            </span>
            <input
              type="number"
              required
              min={1000}
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="Ej. 45000"
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            />
          </label>

          {/* Sugerencia IA */}
          {sugerencia && (
            <div className="sm:col-span-2 rounded-xl bg-moorcado-green/5 border border-moorcado-green/20 p-4">
              <p className="text-xs font-semibold text-moorcado-green mb-1">
                🤖 Sugerencia IA Moorcado
              </p>
              <p className="text-sm text-moorcado-gray-dark">
                Precio estimado:{" "}
                <span className="font-bold text-moorcado-green">
                  {formatLempiras(sugerencia.estimado)}
                </span>{" "}
                <span className="text-moorcado-gray-dark/50">
                  (rango: {formatLempiras(sugerencia.rangoMin)} –{" "}
                  {formatLempiras(sugerencia.rangoMax)})
                </span>
              </p>
              <p className="mt-1 text-xs text-moorcado-gray-dark/50">
                Confianza: {sugerencia.confianza}
              </p>
            </div>
          )}

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Descripción
            </span>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe las características principales del animal..."
              className="w-full resize-none rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            />
          </label>
        </div>
      </section>

      {/* Ubicación */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-moorcado-gray-dark">
          <MapPin className="h-5 w-5 text-moorcado-green" />
          Ubicación
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Departamento
            </span>
            <select
              required
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            >
              {DEPARTAMENTOS_HONDURAS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Municipio
            </span>
            <input
              type="text"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              placeholder="Ej. Juticalpa"
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            />
          </label>
        </div>
      </section>

      {/* Vacunas */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-moorcado-gray-dark">
          <Syringe className="h-5 w-5 text-moorcado-green" />
          Vacunas aplicadas
        </h2>
        <div className="space-y-2">
          {vacunas.map((v, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={v}
                onChange={(e) => {
                  const copia = [...vacunas];
                  copia[i] = e.target.value;
                  setVacunas(copia);
                }}
                placeholder="Ej. Fiebre aftosa"
                className="flex-1 rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
              />
              {vacunas.length > 1 && (
                <button
                  type="button"
                  onClick={() => setVacunas(vacunas.filter((_, j) => j !== i))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                  aria-label="Quitar vacuna"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setVacunas([...vacunas, ""])}
            className="flex items-center gap-1.5 text-sm font-medium text-moorcado-green hover:underline"
          >
            <Plus className="h-4 w-4" />
            Agregar vacuna
          </button>
        </div>
      </section>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-full bg-moorcado-green py-4 text-base font-bold text-white shadow-sm transition hover:bg-moorcado-green/90 disabled:opacity-70"
      >
        {enviando ? "Publicando..." : "Publicar Animal"}
      </button>
    </form>
  );
}
