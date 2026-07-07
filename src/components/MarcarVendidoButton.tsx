"use client";

import { useState } from "react";
import { CircleCheck, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Anuncio, Usuario } from "@/lib/types";

export default function MarcarVendidoButton({
  anuncio,
  vendedorId,
  usuarios,
}: {
  anuncio: Anuncio;
  vendedorId: string;
  usuarios: Usuario[];
}) {
  const actualizarAnuncio = useAppStore((s) => s.actualizarAnuncio);
  const crearTransaccion = useAppStore((s) => s.crearTransaccion);
  const [abierto, setAbierto] = useState(false);
  const [compradorId, setCompradorId] = useState("");
  const [precio, setPrecio] = useState(String(anuncio.precio));
  const [enviando, setEnviando] = useState(false);

  if (anuncio.vendido) return null;

  const compradoresDisponibles = usuarios.filter((u) => u.id !== vendedorId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!compradorId || enviando) return;
    setEnviando(true);

    await crearTransaccion({
      id: `t-${Date.now()}`,
      animalId: anuncio.id,
      compradorId,
      vendedorId,
      precio: Number(precio) || anuncio.precio,
      fecha: new Date().toISOString(),
    });
    actualizarAnuncio({ ...anuncio, vendido: true, activo: false });

    setEnviando(false);
    setAbierto(false);
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-moorcado-gray-light py-2 text-xs font-bold text-moorcado-gray-dark hover:bg-moorcado-gray-light/70"
      >
        <CircleCheck className="h-3.5 w-3.5" />
        Marcar como vendido
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-xl bg-moorcado-gray-light p-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-moorcado-gray-dark">
          Registrar venta
        </span>
        <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar">
          <X className="h-3.5 w-3.5 text-moorcado-gray-dark/50" />
        </button>
      </div>
      <select
        required
        value={compradorId}
        onChange={(e) => setCompradorId(e.target.value)}
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-moorcado-green"
      >
        <option value="">Selecciona al comprador</option>
        {compradoresDisponibles.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nombre} ({u.correo})
          </option>
        ))}
      </select>
      <input
        type="number"
        required
        min={1}
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
        placeholder="Precio final"
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-moorcado-green"
      />
      <button
        type="submit"
        disabled={!compradorId || enviando}
        className="w-full rounded-full bg-moorcado-green py-2 text-xs font-bold text-white disabled:opacity-40"
      >
        {enviando ? "Guardando..." : "Confirmar venta"}
      </button>
    </form>
  );
}
