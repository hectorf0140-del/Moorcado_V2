"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import AnimalCard from "@/components/AnimalCard";
import { useAppStore } from "@/store/useAppStore";
import { DEPARTAMENTOS_HONDURAS, RAZAS_GANADO, type TipoGanado } from "@/lib/types";

const TIPOS: { id: TipoGanado; label: string }[] = [
  { id: "leche", label: "Leche" },
  { id: "carne", label: "Carne" },
  { id: "doble", label: "Doble propósito" },
  { id: "reproductor", label: "Reproductor" },
];

// Tope del slider de precio: en este valor se muestra "Sin límite" y no
// filtra por precio (hay ganado de raza que vale mucho más que el promedio).
const PRECIO_SIN_LIMITE = 300000;
// Tope del slider de peso: en este valor se muestra "Sin límite" y no
// filtra por peso (toros y bueyes pueden pesar bastante más que una vaca
// promedio — un tope fijo escondía publicaciones reales del catálogo).
const PESO_SIN_LIMITE = 1200;

export default function CatalogoClient({ initialTipo }: { initialTipo?: string }) {
  const [departamento, setDepartamento] = useState("");
  const [distanciaMax, setDistanciaMax] = useState(200);
  const [precioMax, setPrecioMax] = useState(PRECIO_SIN_LIMITE);
  const [pesoMax, setPesoMax] = useState(PESO_SIN_LIMITE);
  const [sexo, setSexo] = useState<"" | "macho" | "hembra">("");
  const [razas, setRazas] = useState<string[]>([]);
  const [tipos, setTipos] = useState<TipoGanado[]>(
    initialTipo && TIPOS.some((t) => t.id === initialTipo)
      ? [initialTipo as TipoGanado]
      : []
  );
  const [soloProduccion, setSoloProduccion] = useState(false);
  const [soloSag, setSoloSag] = useState(false);
  const [soloVerificados, setSoloVerificados] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Anuncios desde el store global (Supabase + cache localStorage)
  const anuncios = useAppStore((s) => s.anuncios);

  const resultados = useMemo(() => {
    const precioMaxEfectivo = precioMax >= PRECIO_SIN_LIMITE ? Infinity : precioMax;
    const pesoMaxEfectivo = pesoMax >= PESO_SIN_LIMITE ? Infinity : pesoMax;
    return anuncios.filter((a) => {
      if (a.activo === false || a.vendido) return false;
      if (departamento && a.departamento !== departamento) return false;
      if (a.distanciaKm > distanciaMax) return false;
      if (a.precio > precioMaxEfectivo) return false;
      if (a.pesoKg > pesoMaxEfectivo) return false;
      if (sexo && a.sexo !== sexo) return false;
      if (razas.length && !razas.includes(a.raza)) return false;
      if (tipos.length && !tipos.includes(a.tipo)) return false;
      if (soloProduccion && !a.produccionLitrosDia) return false;
      if (soloSag && !a.registroSag) return false;
      if (soloVerificados && !a.verificado) return false;
      return true;
    });
  }, [
    anuncios,
    departamento,
    distanciaMax,
    precioMax,
    pesoMax,
    sexo,
    razas,
    tipos,
    soloProduccion,
    soloSag,
    soloVerificados,
  ]);

  function toggleRaza(r: string) {
    setRazas((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  function toggleTipo(t: TipoGanado) {
    setTipos((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function limpiarFiltros() {
    setDepartamento("");
    setDistanciaMax(200);
    setPrecioMax(PRECIO_SIN_LIMITE);
    setPesoMax(PESO_SIN_LIMITE);
    setSexo("");
    setRazas([]);
    setTipos([]);
    setSoloProduccion(false);
    setSoloSag(false);
    setSoloVerificados(false);
  }

  const filtrosPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-moorcado-gray-dark">
          Filtros
        </h2>
        <button
          onClick={limpiarFiltros}
          className="text-sm font-semibold text-moorcado-green"
        >
          Limpiar
        </button>
      </div>

      <FilterGroup label="Departamento">
        <select
          value={departamento}
          onChange={(e) => setDepartamento(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-moorcado-gray-light px-3 py-2 text-sm outline-none focus:border-moorcado-green"
        >
          <option value="">Todos</option>
          {DEPARTAMENTOS_HONDURAS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup label={`Distancia: hasta ${distanciaMax} km`}>
        <input
          type="range"
          min={5}
          max={200}
          step={5}
          value={distanciaMax}
          onChange={(e) => setDistanciaMax(Number(e.target.value))}
          className="w-full accent-moorcado-green"
        />
        <div className="mt-1 flex gap-1.5">
          {[10, 25, 50, 200].map((d) => (
            <button
              key={d}
              onClick={() => setDistanciaMax(d)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                distanciaMax === d
                  ? "bg-moorcado-green text-white"
                  : "bg-moorcado-gray-light text-moorcado-gray-dark/70"
              }`}
            >
              {d === 200 ? "Todo el país" : `${d} km`}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup
        label={`Precio máximo: ${
          precioMax >= PRECIO_SIN_LIMITE
            ? "Sin límite"
            : `L. ${precioMax.toLocaleString("es-HN")}`
        }`}
      >
        <input
          type="range"
          min={5000}
          max={PRECIO_SIN_LIMITE}
          step={5000}
          value={precioMax}
          onChange={(e) => setPrecioMax(Number(e.target.value))}
          className="w-full accent-moorcado-green"
        />
      </FilterGroup>

      <FilterGroup
        label={`Peso máximo: ${
          pesoMax >= PESO_SIN_LIMITE ? "Sin límite" : `${pesoMax} kg`
        }`}
      >
        <input
          type="range"
          min={50}
          max={PESO_SIN_LIMITE}
          step={10}
          value={pesoMax}
          onChange={(e) => setPesoMax(Number(e.target.value))}
          className="w-full accent-moorcado-green"
        />
      </FilterGroup>

      <FilterGroup label="Sexo">
        <div className="flex gap-2">
          {(["", "hembra", "macho"] as const).map((s) => (
            <button
              key={s || "todos"}
              onClick={() => setSexo(s)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize ${
                sexo === s
                  ? "bg-moorcado-green text-white"
                  : "bg-moorcado-gray-light text-moorcado-gray-dark/70"
              }`}
            >
              {s || "Todos"}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Tipo de ganado">
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTipo(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                tipos.includes(t.id)
                  ? "bg-moorcado-green text-white"
                  : "bg-moorcado-gray-light text-moorcado-gray-dark/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Raza">
        <div className="flex flex-wrap gap-2">
          {RAZAS_GANADO.map((r) => (
            <button
              key={r}
              onClick={() => toggleRaza(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                razas.includes(r)
                  ? "bg-moorcado-green text-white"
                  : "bg-moorcado-gray-light text-moorcado-gray-dark/70"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Otros">
        <Checkbox
          checked={soloProduccion}
          onChange={setSoloProduccion}
          label="Con producción de leche"
        />
        <Checkbox
          checked={soloSag}
          onChange={setSoloSag}
          label="Con registro SAG"
        />
        <Checkbox
          checked={soloVerificados}
          onChange={setSoloVerificados}
          label="Solo vendedores verificados"
        />
      </FilterGroup>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark">
            Catálogo de ganado
          </h1>
          <p className="text-sm text-moorcado-gray-dark/60">
            {resultados.length} animales encontrados
          </p>
        </div>
        <button
          onClick={() => setMostrarFiltros(true)}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-moorcado-gray-dark shadow-sm ring-1 ring-black/10 lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:block lg:h-fit">
          {filtrosPanel}
        </aside>

        {mostrarFiltros && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMostrarFiltros(false)}
            />
            <div className="relative ml-auto flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-white p-5 shadow-xl">
              <button
                onClick={() => setMostrarFiltros(false)}
                className="mb-4 flex h-9 w-9 items-center justify-center self-end rounded-full bg-moorcado-gray-light"
                aria-label="Cerrar filtros"
              >
                <X className="h-5 w-5" />
              </button>
              {filtrosPanel}
              <button
                onClick={() => setMostrarFiltros(false)}
                className="mt-6 w-full rounded-full bg-moorcado-green py-3 text-sm font-bold text-white"
              >
                Ver {resultados.length} resultados
              </button>
            </div>
          </div>
        )}

        <div>
          {resultados.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-moorcado-gray-dark/60">
                No encontramos animales con esos filtros. Intenta ampliarlos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {resultados.map((a) => (
                <AnimalCard key={a.id} animal={a} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-moorcado-gray-dark">{label}</p>
      {children}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 py-1 text-sm text-moorcado-gray-dark/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded accent-moorcado-green"
      />
      {label}
    </label>
  );
}
