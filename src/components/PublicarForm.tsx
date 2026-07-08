"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Info, MapPin, Syringe, Plus, X, Camera, Loader2 } from "lucide-react";
import { DEPARTAMENTOS_HONDURAS, RAZAS_GANADO, type Sexo } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { calcularValoracion } from "@/lib/valoracion";
import { comprimirImagen } from "@/lib/imagenes";
import { formatLempiras } from "@/lib/format";
import type { Anuncio } from "@/lib/types";

const MAX_FOTOS = 6;

interface Props {
  onSuccess?: () => void;
  anuncioExistente?: Anuncio;
}

export default function PublicarForm({ onSuccess, anuncioExistente }: Props) {
  const router = useRouter();
  const sesion = useAppStore((s) => s.sesion);
  const agregarAnuncio = useAppStore((s) => s.agregarAnuncio);
  const actualizarAnuncio = useAppStore((s) => s.actualizarAnuncio);

  const [titulo, setTitulo] = useState(anuncioExistente?.titulo ?? "");
  const [raza, setRaza] = useState<string>(anuncioExistente?.raza ?? RAZAS_GANADO[0]);
  const [proposito, setProposito] = useState<Anuncio["proposito"]>(
    anuncioExistente?.proposito ?? "cárnico"
  );
  const [sexo, setSexo] = useState<Sexo>(anuncioExistente?.sexo ?? "macho");
  const [precio, setPrecio] = useState(anuncioExistente ? String(anuncioExistente.precio) : "");
  const [pesoKg, setPesoKg] = useState(anuncioExistente ? String(anuncioExistente.pesoKg) : "");
  const [edadMeses, setEdadMeses] = useState(
    anuncioExistente ? String(anuncioExistente.edadMeses) : ""
  );
  const [departamento, setDepartamento] = useState<string>(
    anuncioExistente?.departamento ?? DEPARTAMENTOS_HONDURAS[0]
  );
  const [municipio, setMunicipio] = useState(anuncioExistente?.municipio ?? "");
  const [descripcion, setDescripcion] = useState(anuncioExistente?.descripcion ?? "");
  const [vacunas, setVacunas] = useState<string[]>(
    anuncioExistente?.vacunas?.length ? anuncioExistente.vacunas : [""]
  );
  const [imagenes, setImagenes] = useState<string[]>(anuncioExistente?.imagenes ?? []);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const [errorFotos, setErrorFotos] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  async function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (archivos.length === 0) return;

    const disponibles = MAX_FOTOS - imagenes.length;
    if (disponibles <= 0) {
      setErrorFotos(`Máximo ${MAX_FOTOS} fotos por publicación.`);
      return;
    }

    setErrorFotos("");
    setSubiendoFotos(true);
    try {
      const seleccionadas = archivos.slice(0, disponibles);
      const comprimidas = await Promise.all(
        seleccionadas.map((archivo) => comprimirImagen(archivo))
      );
      setImagenes((prev) => [...prev, ...comprimidas]);
    } catch {
      setErrorFotos("No se pudo procesar alguna foto. Intenta de nuevo.");
    } finally {
      setSubiendoFotos(false);
    }
  }

  function quitarFoto(index: number) {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  }

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
    if (imagenes.length === 0) {
      setErrorFotos("Agrega al menos una foto del animal.");
      return;
    }

    setEnviando(true);

    const vacunasFiltradas = vacunas.filter((v) => v.trim());
    const tipo =
      proposito === "lechero" ? "leche" : proposito === "cárnico" ? "carne" : "doble";
    const vacunasObj = vacunasFiltradas.map((nombre) => ({
      nombre,
      fecha: new Date().toISOString().split("T")[0],
    }));

    if (anuncioExistente) {
      const actualizado: Anuncio = {
        ...anuncioExistente,
        titulo: titulo || `${raza} – ${sexo === "macho" ? "Toro" : "Vaca"} en ${departamento}`,
        nombre: titulo || raza,
        raza,
        edadMeses: Number(edadMeses) || anuncioExistente.edadMeses,
        pesoKg: Number(pesoKg) || anuncioExistente.pesoKg,
        sexo,
        precio: Number(precio) || anuncioExistente.precio,
        tipo,
        proposito,
        descripcion,
        departamento,
        municipio,
        vacunas: vacunasFiltradas,
        fotos: imagenes.length,
        imagenes,
        ubicacion: {
          ...anuncioExistente.ubicacion,
          departamento,
          municipio,
        },
        vacunasObj,
      };

      actualizarAnuncio(actualizado);
      setExito(true);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/animal/${actualizado.id}`);
        }
      }, 800);
      return;
    }

    const id = `a-${Date.now()}`;

    const nuevo: Anuncio = {
      id,
      titulo: titulo || `${raza} – ${sexo === "macho" ? "Toro" : "Vaca"} en ${departamento}`,
      nombre: titulo || raza,
      raza,
      edadMeses: Number(edadMeses) || 12,
      pesoKg: Number(pesoKg) || 300,
      sexo,
      precio: Number(precio) || 0,
      tipo,
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
      fotos: imagenes.length,
      imagenes,
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
      vacunasObj,
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
          {anuncioExistente ? "¡Cambios guardados!" : "¡Lote publicado!"}
        </h2>
        <p className="mt-1 text-sm text-moorcado-gray-dark/60">
          {anuncioExistente
            ? "Tu publicación se actualizó correctamente."
            : "Tu anuncio ya está visible en el marketplace."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Fotos */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-moorcado-gray-dark">
          <Camera className="h-5 w-5 text-moorcado-green" />
          Fotos del animal
        </h2>

        {errorFotos && (
          <p className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {errorFotos}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {imagenes.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element -- foto local en base64, no aplica next/image */}
              <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => quitarFoto(i)}
                aria-label="Quitar foto"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {imagenes.length < MAX_FOTOS && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-black/15 text-moorcado-gray-dark/60 transition hover:border-moorcado-green hover:text-moorcado-green">
              {subiendoFotos ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Camera className="h-6 w-6" />
                  <span className="text-xs font-medium">Agregar foto</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={subiendoFotos}
                onChange={handleFotos}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="mt-3 text-xs text-moorcado-gray-dark/50">
          Sube fotos reales del animal (hasta {MAX_FOTOS}). La primera será la foto principal del anuncio.
        </p>
      </section>

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
        disabled={enviando || subiendoFotos}
        className="w-full rounded-full bg-moorcado-green py-4 text-base font-bold text-white shadow-sm transition hover:bg-moorcado-green/90 disabled:opacity-70"
      >
        {enviando
          ? anuncioExistente
            ? "Guardando..."
            : "Publicando..."
          : anuncioExistente
            ? "Guardar cambios"
            : "Publicar Animal"}
      </button>
    </form>
  );
}
