"use client";

import { useState } from "react";
import { Calendar, Check, Pencil, Stethoscope, Trash2, X } from "lucide-react";
import type { AnimalHato } from "@/lib/types";
import { formatLempiras } from "@/lib/format";
import { ESTADOS_HATO, proximaRevisionDe, ultimaVacunaCompletadaDe } from "@/lib/hato";

export default function HatoTable({
  hato,
  onCambiarEstado,
  onEditar,
  onEliminar,
  onAgendarCita,
  onVerHistorial,
}: {
  hato: AnimalHato[];
  onCambiarEstado: (id: string, estado: AnimalHato["estado"]) => void;
  onEditar: (animal: AnimalHato) => void;
  onEliminar: (id: string) => void;
  onAgendarCita: (animal: AnimalHato) => void;
  onVerHistorial: (animal: AnimalHato) => void;
}) {
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  if (hato.length === 0) {
    return (
      <p className="mt-3 rounded-2xl bg-white p-6 text-center text-sm text-moorcado-gray-dark/50 shadow-sm ring-1 ring-black/5">
        Aún no has registrado animales en tu hato. Usa &quot;Registrar Animal&quot; para empezar.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <table className="w-full min-w-240 text-left text-sm">
        <thead className="bg-moorcado-gray-light text-xs uppercase text-moorcado-gray-dark/60">
          <tr>
            <th className="px-4 py-3">Animal</th>
            <th className="px-4 py-3">Raza</th>
            <th className="px-4 py-3">Edad</th>
            <th className="px-4 py-3">Producción</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Última vacuna</th>
            <th className="px-4 py-3">Próxima revisión</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {hato.map((a) => (
            <tr key={a.id} className="border-t border-black/5">
              <td className="px-4 py-3 font-medium text-moorcado-gray-dark">{a.nombre}</td>
              <td className="px-4 py-3 text-moorcado-gray-dark/70">{a.raza}</td>
              <td className="px-4 py-3 text-moorcado-gray-dark/70">{a.edadMeses} m</td>
              <td className="px-4 py-3 text-moorcado-gray-dark/70">
                {a.produccionLitrosDia ? `${a.produccionLitrosDia} L/día` : "—"}
              </td>
              <td className="px-4 py-3">
                <select
                  value={a.estado}
                  onChange={(e) => onCambiarEstado(a.id, e.target.value as AnimalHato["estado"])}
                  className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none ${ESTADOS_HATO[a.estado].cls}`}
                >
                  {Object.entries(ESTADOS_HATO).map(([valor, { label }]) => (
                    <option key={valor} value={valor}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-moorcado-gray-dark/70">
                {ultimaVacunaCompletadaDe(a) ?? "—"}
              </td>
              <td className="px-4 py-3 text-moorcado-gray-dark/70">
                {proximaRevisionDe(a) ?? "—"}
              </td>
              <td className="px-4 py-3 font-semibold text-moorcado-gray-dark">
                {formatLempiras(a.valorEstimado)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onAgendarCita(a)}
                    title="Agendar cita"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-moorcado-gold/15 text-moorcado-brown"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onVerHistorial(a)}
                    title="Historial médico"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-moorcado-brown/10 text-moorcado-brown"
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditar(a)}
                    title="Editar"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-moorcado-gray-light text-moorcado-gray-dark/60"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {confirmandoId === a.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onEliminar(a.id);
                          setConfirmandoId(null);
                        }}
                        title="Confirmar eliminar"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmandoId(null)}
                        title="Cancelar"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-moorcado-gray-light text-moorcado-gray-dark/60"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmandoId(a.id)}
                      title="Eliminar"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
