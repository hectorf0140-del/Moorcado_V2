"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, MessageCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { conversacionId } from "@/lib/mensajesDb";
import ReportarButton from "@/components/ReportarButton";

interface Props {
  animalId: string;
  vendedorId: string;
  vendedorNombre: string;
}

const INTERVALO_ACTUALIZACION_MS = 4000;

export default function ChatPanel({ animalId, vendedorId, vendedorNombre }: Props) {
  const sesion = useAppStore((s) => s.sesion);
  const mensajes = useAppStore((s) => s.mensajes);
  const enviarMensaje = useAppStore((s) => s.enviarMensaje);
  const cargarConversacion = useAppStore((s) => s.cargarConversacion);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const convId = sesion ? conversacionId(sesion.usuarioId, vendedorId) : "";
  const hilo = mensajes[convId] ?? [];

  useEffect(() => {
    if (!sesion || sesion.usuarioId === vendedorId) return;
    cargarConversacion(vendedorId);
    const id = setInterval(() => cargarConversacion(vendedorId), INTERVALO_ACTUALIZACION_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion?.usuarioId, vendedorId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [hilo.length]);

  if (!sesion) {
    return (
      <div className="rounded-2xl bg-moorcado-gray-light p-6 text-center">
        <MessageCircle className="mx-auto h-8 w-8 text-moorcado-gray-dark/40" />
        <p className="mt-2 text-sm text-moorcado-gray-dark/70">
          Inicia sesión para contactar al vendedor
        </p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-full bg-moorcado-green px-5 py-2 text-sm font-semibold text-white transition hover:bg-moorcado-green/90"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (sesion.usuarioId === vendedorId) {
    return (
      <div className="rounded-2xl bg-moorcado-gray-light p-6 text-center text-sm text-moorcado-gray-dark/60">
        Este es tu propio anuncio.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || enviando) return;
    setInput("");
    setEnviando(true);
    await enviarMensaje(vendedorId, texto, animalId);
    setEnviando(false);
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-moorcado-green" />
          <p className="font-semibold text-moorcado-gray-dark">
            Chat con {vendedorNombre}
          </p>
        </div>
        <ReportarButton tipo="chat" objetivoId={convId} label="Reportar" />
      </div>

      {/* Messages */}
      <div className="flex max-h-60 min-h-30 flex-col gap-3 overflow-y-auto p-4">
        {hilo.length === 0 && (
          <p className="text-center text-xs text-moorcado-gray-dark/50">
            Envía un mensaje para iniciar la negociación
          </p>
        )}
        {hilo.map((m) => {
          const esMio = m.autorId === sesion.usuarioId;
          return (
            <div
              key={m.id}
              className={`flex ${esMio ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  esMio
                    ? "bg-moorcado-green text-white"
                    : "bg-moorcado-gray-light text-moorcado-gray-dark"
                }`}
              >
                <p>{m.texto}</p>
                <p className={`mt-0.5 text-[10px] ${esMio ? "text-white/60" : "text-moorcado-gray-dark/50"}`}>
                  {new Date(m.creadoEn).toLocaleTimeString("es-HN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-black/5 px-3 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="flex-1 rounded-full bg-moorcado-gray-light px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-moorcado-green/30"
          aria-label="Mensaje"
        />
        <button
          type="submit"
          disabled={!input.trim() || enviando}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-moorcado-green text-white disabled:opacity-40"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
