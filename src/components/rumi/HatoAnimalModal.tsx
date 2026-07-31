"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { AnimalHato } from "@/lib/types";
import { RAZAS_GANADO } from "@/lib/types";
import { ESTADOS_HATO, generarIdHato } from "@/lib/hato";

export default function HatoAnimalModal({
  animalInicial,
  onGuardar,
  onCerrar,
}: {
  animalInicial?: AnimalHato;
  onGuardar: (animal: AnimalHato) => void;
  onCerrar: () => void;
}) {
  const editando = Boolean(animalInicial);
  const [nombre, setNombre] = useState(animalInicial?.nombre ?? "");
  const [raza, setRaza] = useState<string>(animalInicial?.raza ?? RAZAS_GANADO[0]);
  const [edad, setEdad] = useState(String(animalInicial?.edadMeses ?? 12));
  const [produccion, setProduccion] = useState(
    animalInicial?.produccionLitrosDia ? String(animalInicial.produccionLitrosDia) : ""
  );
  const [valor, setValor] = useState(String(animalInicial?.valorEstimado ?? ""));
  const [estado, setEstado] = useState<AnimalHato["estado"]>(animalInicial?.estado ?? "sana");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (animalInicial) {
      onGuardar({
        ...animalInicial,
        nombre,
        raza,
        edadMeses: Number(edad) || 12,
        produccionLitrosDia: produccion ? Number(produccion) : undefined,
        valorEstimado: Number(valor) || 0,
        estado,
      });
      return;
    }

    const hoy = new Date();
    const revision = new Date(hoy);
    revision.setDate(revision.getDate() + 45);
    onGuardar({
      id: generarIdHato(),
      nombre,
      raza,
      edadMeses: Number(edad) || 12,
      produccionLitrosDia: produccion ? Number(produccion) : undefined,
      valorEstimado: Number(valor) || 0,
      estado,
      proximaRevision: revision.toISOString().split("T")[0],
      ultimaVacuna: hoy.toISOString().split("T")[0],
      citas: [],
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-moorcado-gray-dark">
            {editando ? "Editar animal" : "Registrar animal en Rumi"}
          </h3>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X className="h-5 w-5 text-moorcado-gray-dark/60" />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Nombre del animal
            </span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
              placeholder="Ej. Bonita"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">Raza</span>
            <select
              value={raza}
              onChange={(e) => setRaza(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            >
              {RAZAS_GANADO.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Edad (meses)
              </span>
              <input
                type="number"
                min={0}
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Producción (L/día)
              </span>
              <input
                type="number"
                min={0}
                value={produccion}
                onChange={(e) => setProduccion(e.target.value)}
                placeholder="Opcional"
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Valor estimado (L.)
            </span>
            <input
              type="number"
              min={0}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ej. 25000"
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">Estado</span>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as AnimalHato["estado"])}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            >
              {Object.entries(ESTADOS_HATO).map(([valorEstado, { label }]) => (
                <option key={valorEstado} value={valorEstado}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="mt-5 w-full rounded-full bg-moorcado-green py-3 text-sm font-bold text-white"
        >
          {editando ? "Guardar cambios" : "Registrar"}
        </button>
      </form>
    </div>
  );
}
