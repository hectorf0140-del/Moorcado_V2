"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type { AnimalHato, CitaVeterinaria, Veterinario } from "@/lib/types";
import { TIPOS_CITA, historialCitasOrdenado } from "@/lib/hato";
import CitaModal from "./CitaModal";

const ESTADO_CITA_CLS: Record<CitaVeterinaria["estado"], string> = {
  pendiente: "bg-moorcado-gold/15 text-moorcado-brown",
  completada: "bg-moorcado-green/10 text-moorcado-green",
  cancelada: "bg-moorcado-gray-light text-moorcado-gray-dark/60",
};

const ESTADO_CITA_LABEL: Record<CitaVeterinaria["estado"], string> = {
  pendiente: "Pendiente",
  completada: "Completada",
  cancelada: "Cancelada",
};

/** Historial médico rediseñado: lista real de citas por animal (antes solo se podía
 * agregar un registro de solo-texto y nunca verlo de nuevo dentro de Rumi). */
export default function HistorialAnimalPanel({
  animal,
  veterinarios,
  onActualizarCitas,
  onCerrar,
}: {
  animal: AnimalHato;
  veterinarios: Veterinario[] | null;
  onActualizarCitas: (citas: CitaVeterinaria[]) => void;
  onCerrar: () => void;
}) {
  const [citaEnEdicion, setCitaEnEdicion] = useState<CitaVeterinaria | "nueva" | null>(null);
  const citas = historialCitasOrdenado(animal);

  function guardarCita(cita: CitaVeterinaria) {
    const yaExiste = (animal.citas ?? []).some((c) => c.id === cita.id);
    const nuevasCitas = yaExiste
      ? (animal.citas ?? []).map((c) => (c.id === cita.id ? cita : c))
      : [...(animal.citas ?? []), cita];
    onActualizarCitas(nuevasCitas);
    setCitaEnEdicion(null);
  }

  function marcarCompletada(citaId: string) {
    onActualizarCitas(
      (animal.citas ?? []).map((c) => (c.id === citaId ? { ...c, estado: "completada" } : c))
    );
  }

  function eliminarCita(citaId: string) {
    onActualizarCitas((animal.citas ?? []).filter((c) => c.id !== citaId));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-moorcado-gray-dark">
              Historial médico
            </h3>
            <p className="text-xs text-moorcado-gray-dark/60">{animal.nombre}</p>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X className="h-5 w-5 text-moorcado-gray-dark/60" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCitaEnEdicion("nueva")}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-moorcado-green py-2.5 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" />
          Agendar cita
        </button>

        {citas.length === 0 ? (
          <p className="mt-5 rounded-xl bg-moorcado-gray-light p-4 text-center text-sm text-moorcado-gray-dark/50">
            Sin citas registradas todavía.
          </p>
        ) : (
          <ul className="mt-5 space-y-2.5">
            {citas.map((c) => (
              <li key={c.id} className="rounded-xl bg-moorcado-gray-light p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-moorcado-gray-dark">
                      {TIPOS_CITA[c.tipo]}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ESTADO_CITA_CLS[c.estado]}`}>
                        {ESTADO_CITA_LABEL[c.estado]}
                      </span>
                    </p>
                    <p className="text-xs text-moorcado-gray-dark/60">
                      {c.fecha} · {c.veterinarioNombre ?? "Sin veterinario asignado"}
                    </p>
                    {c.notas && (
                      <p className="mt-1 text-xs text-moorcado-gray-dark/70">{c.notas}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {c.estado === "pendiente" && (
                      <button
                        type="button"
                        onClick={() => marcarCompletada(c.id)}
                        title="Marcar completada"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-moorcado-green/10 text-moorcado-green"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setCitaEnEdicion(c)}
                      title="Editar"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-moorcado-gray-dark/60 ring-1 ring-black/5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarCita(c.id)}
                      title="Eliminar"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {citaEnEdicion && (
        <CitaModal
          animal={animal}
          veterinarios={veterinarios}
          citaInicial={citaEnEdicion === "nueva" ? undefined : citaEnEdicion}
          onGuardar={guardarCita}
          onCerrar={() => setCitaEnEdicion(null)}
        />
      )}
    </div>
  );
}
