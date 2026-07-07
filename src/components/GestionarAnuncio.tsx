"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, Pencil, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Anuncio, Usuario } from "@/lib/types";

type Estado = "disponible" | "negociacion" | "vendido";

export default function GestionarAnuncio({
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
  const [formVentaAbierto, setFormVentaAbierto] = useState(false);
  const [compradorId, setCompradorId] = useState("");
  const [precio, setPrecio] = useState(String(anuncio.precio));
  const [enviando, setEnviando] = useState(false);

  const estado: Estado = anuncio.vendido
    ? "vendido"
    : anuncio.enNegociacion
      ? "negociacion"
      : "disponible";

  const compradoresDisponibles = usuarios.filter((u) => u.id !== vendedorId);

  function marcarDisponible() {
    setFormVentaAbierto(false);
    actualizarAnuncio({ ...anuncio, vendido: false, enNegociacion: false, activo: true });
  }

  function marcarEnNegociacion() {
    setFormVentaAbierto(false);
    actualizarAnuncio({ ...anuncio, vendido: false, enNegociacion: true, activo: true });
  }

  async function handleSubmitVenta(e: React.FormEvent) {
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
    actualizarAnuncio({ ...anuncio, vendido: true, enNegociacion: false, activo: false });

    setEnviando(false);
    setFormVentaAbierto(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 rounded-full bg-moorcado-gray-light p-1 text-xs font-bold">
        <EstadoBtn active={estado === "disponible"} onClick={marcarDisponible}>
          Disponible
        </EstadoBtn>
        <EstadoBtn active={estado === "negociacion"} onClick={marcarEnNegociacion}>
          En negociación
        </EstadoBtn>
        <EstadoBtn
          active={estado === "vendido"}
          onClick={() => {
            if (estado !== "vendido") setFormVentaAbierto(true);
          }}
        >
          <CircleCheck className="h-3.5 w-3.5" />
          Vendido
        </EstadoBtn>
      </div>

      {formVentaAbierto && estado !== "vendido" && (
        <form
          onSubmit={handleSubmitVenta}
          className="space-y-2 rounded-xl bg-moorcado-gray-light p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-moorcado-gray-dark">
              Registrar venta
            </span>
            <button type="button" onClick={() => setFormVentaAbierto(false)} aria-label="Cerrar">
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
      )}

      <Link
        href={`/dashboard/vendedor/editar/${anuncio.id}`}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white py-2 text-xs font-bold text-moorcado-gray-dark ring-1 ring-black/10 hover:bg-moorcado-gray-light"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar publicación
      </Link>
    </div>
  );
}

function EstadoBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 transition ${
        active
          ? "bg-moorcado-green text-white"
          : "text-moorcado-gray-dark/70 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}
