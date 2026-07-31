"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { AnimalHato, CitaVeterinaria, Veterinario } from "@/lib/types";
import { TIPOS_CITA, generarIdCita } from "@/lib/hato";

export default function CitaModal({
  animal,
  veterinarios,
  citaInicial,
  onGuardar,
  onCerrar,
}: {
  animal: AnimalHato;
  veterinarios: Veterinario[] | null;
  citaInicial?: CitaVeterinaria;
  onGuardar: (cita: CitaVeterinaria) => void;
  onCerrar: () => void;
}) {
  const editando = Boolean(citaInicial);
  const [fecha, setFecha] = useState(citaInicial?.fecha ?? new Date().toISOString().split("T")[0]);
  const [tipo, setTipo] = useState<CitaVeterinaria["tipo"]>(citaInicial?.tipo ?? "revision");
  const [veterinarioId, setVeterinarioId] = useState(citaInicial?.veterinarioId ?? "");
  const [notas, setNotas] = useState(citaInicial?.notas ?? "");
  const [estado, setEstado] = useState<CitaVeterinaria["estado"]>(citaInicial?.estado ?? "pendiente");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const vet = veterinarios?.find((v) => v.id === veterinarioId);

    if (citaInicial) {
      onGuardar({
        ...citaInicial,
        fecha,
        tipo,
        veterinarioId: vet?.id,
        veterinarioNombre: vet?.nombre,
        notas: notas.trim() || undefined,
        estado,
        recordatorioEnviado: fecha === citaInicial.fecha ? citaInicial.recordatorioEnviado : false,
      });
      return;
    }

    onGuardar({
      id: generarIdCita(),
      fecha,
      tipo,
      veterinarioId: vet?.id,
      veterinarioNombre: vet?.nombre,
      notas: notas.trim() || undefined,
      estado,
      creadoEn: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-moorcado-gray-dark">
            {editando ? "Editar cita" : "Agendar cita"}
          </h3>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X className="h-5 w-5 text-moorcado-gray-dark/60" />
          </button>
        </div>
        <p className="mt-1 text-xs text-moorcado-gray-dark/60">Para {animal.nombre}</p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Tipo de visita
            </span>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as CitaVeterinaria["tipo"])}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            >
              {Object.entries(TIPOS_CITA).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Veterinario
            </span>
            <select
              value={veterinarioId}
              onChange={(e) => setVeterinarioId(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            >
              <option value="">Sin asignar todavía</option>
              {(veterinarios ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre} · {v.especialidad}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Notas (opcional)
            </span>
            <textarea
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Revisar cojera en pata trasera."
              className="w-full resize-none rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">Estado</span>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as CitaVeterinaria["estado"])}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            >
              <option value="pendiente">Pendiente</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="mt-5 w-full rounded-full bg-moorcado-green py-3 text-sm font-bold text-white"
        >
          {editando ? "Guardar cambios" : "Agendar"}
        </button>
      </form>
    </div>
  );
}
