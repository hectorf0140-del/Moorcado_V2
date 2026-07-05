"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { responder, MOOE_CHIPS } from "@/lib/mooe";

interface Mensaje {
  id: string;
  autor: "usuario" | "mooe";
  texto: string;
}

export default function MooeWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: "welcome",
      autor: "mooe",
      texto: "¡Hola! Soy Mooe 🐄, tu asistente ganadero. ¿En qué te puedo ayudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, escribiendo]);

  function enviar(texto: string) {
    if (!texto.trim()) return;
    const msgUsuario: Mensaje = {
      id: `u-${Date.now()}`,
      autor: "usuario",
      texto: texto.trim(),
    };
    setMensajes((prev) => [...prev, msgUsuario]);
    setInput("");
    setEscribiendo(true);

    setTimeout(() => {
      const resp = responder(texto);
      setEscribiendo(false);
      setMensajes((prev) => [
        ...prev,
        { id: `m-${Date.now()}`, autor: "mooe", texto: resp },
      ]);
    }, 600);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    enviar(input);
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setAbierto((o) => !o)}
        aria-label="Abrir asistente Mooe"
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1F4D2C] text-2xl shadow-lg transition hover:scale-105 active:scale-95 md:bottom-6"
      >
        {abierto ? <X className="h-6 w-6 text-white" /> : <span>🐄</span>}
      </button>

      {/* Panel de chat */}
      {abierto && (
        <div className="fixed bottom-36 right-4 z-50 flex w-80 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 md:bottom-24">
          {/* Header */}
          <div className="flex items-center gap-3 bg-[#1F4D2C] px-4 py-3">
            <span className="text-2xl">🐄</span>
            <div>
              <p className="text-sm font-bold text-white">Mooe</p>
              <p className="text-[11px] text-white/70">Asistente Moorcado</p>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="ml-auto text-white/70 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex max-h-72 flex-col gap-3 overflow-y-auto p-4">
            {mensajes.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.autor === "usuario" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                    m.autor === "usuario"
                      ? "bg-[#1F4D2C] text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {m.texto}
                </div>
              </div>
            ))}
            {escribiendo && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-500">
                  <span className="animate-pulse">•••</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chips */}
          <div className="flex gap-2 overflow-x-auto px-3 pb-2 scrollbar-none">
            {MOOE_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => enviar(chip)}
                className="shrink-0 rounded-full border border-[#1F4D2C]/20 bg-[#1F4D2C]/5 px-3 py-1.5 text-[11px] font-medium text-[#1F4D2C] transition hover:bg-[#1F4D2C]/10"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-black/5 px-3 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1F4D2C]/30"
              aria-label="Mensaje para Mooe"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1F4D2C] text-white disabled:opacity-40"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
