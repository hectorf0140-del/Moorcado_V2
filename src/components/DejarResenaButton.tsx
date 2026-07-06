"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function DejarResenaButton({ vendedorId }: { vendedorId: string }) {
  const sesion = useAppStore((s) => s.sesion);
  const usuarios = useAppStore((s) => s.usuarios);
  const actualizarUsuario = useAppStore((s) => s.actualizarUsuario);
  const [abierto, setAbierto] = useState(false);
  const [calificacion, setCalificacion] = useState(0);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  if (!sesion) {
    return (
      <Link
        href="/login"
        className="block text-center text-xs font-semibold text-moorcado-green hover:underline"
      >
        Inicia sesión para dejar una reseña
      </Link>
    );
  }

  if (sesion.usuarioId === vendedorId) return null;

  if (enviado) {
    return (
      <p className="text-center text-xs font-medium text-moorcado-green">
        ¡Gracias por tu reseña!
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (calificacion === 0 || !texto.trim() || enviando) return;
    setEnviando(true);

    const { crearResenaDb, fetchResenasDeUsuario } = await import("@/lib/resenasDb");
    const resena = {
      id: `res-${Date.now()}`,
      objetivoId: vendedorId,
      autorId: sesion!.usuarioId,
      calificacion,
      texto: texto.trim(),
      creadoEn: new Date().toISOString(),
    };
    await crearResenaDb(resena);

    // Recalcula la calificación promedio real del vendedor con todas sus reseñas.
    const todasLasResenas = await fetchResenasDeUsuario(vendedorId);
    const vendedor = usuarios.find((u) => u.id === vendedorId);
    if (vendedor && todasLasResenas) {
      const promedio =
        todasLasResenas.reduce((acc, r) => acc + r.calificacion, 0) / todasLasResenas.length;
      const actualizado = {
        ...vendedor,
        calificacion: Math.round(promedio * 10) / 10,
        resenas: todasLasResenas.length,
      };
      actualizarUsuario(actualizado);
      const { upsertUsuarioDb } = await import("@/lib/usuariosDb");
      void upsertUsuarioDb(actualizado);
    }

    setEnviando(false);
    setEnviado(true);
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-moorcado-green hover:underline"
      >
        <Star className="h-3.5 w-3.5" />
        Dejar una reseña
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-xl bg-moorcado-gray-light p-3">
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCalificacion(n)}
            aria-label={`${n} estrellas`}
          >
            <Star
              className={`h-5 w-5 ${
                n <= calificacion
                  ? "fill-moorcado-gold text-moorcado-gold"
                  : "text-moorcado-gray-dark/25"
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Comparte tu experiencia con este vendedor..."
        rows={2}
        className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-moorcado-green"
      />
      <button
        type="submit"
        disabled={calificacion === 0 || !texto.trim() || enviando}
        className="w-full rounded-full bg-moorcado-green py-2 text-xs font-bold text-white disabled:opacity-40"
      >
        {enviando ? "Enviando..." : "Enviar reseña"}
      </button>
    </form>
  );
}
