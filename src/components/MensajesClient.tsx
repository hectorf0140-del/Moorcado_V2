"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircle, Send, Smile } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import VerifiedBadge from "./VerifiedBadge";

const EMOJIS = ["👍", "❤️", "😊", "🐄", "✅", "🙏"];
const INTERVALO_ACTUALIZACION_MS = 5000;

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MensajesClient() {
  const sesion = useAppStore((s) => s.sesion);
  const usuarios = useAppStore((s) => s.usuarios);
  const mensajes = useAppStore((s) => s.mensajes);
  const enviarMensaje = useAppStore((s) => s.enviarMensaje);
  const cargarBandejaMensajes = useAppStore((s) => s.cargarBandejaMensajes);

  const [activaId, setActivaId] = useState("");
  const [texto, setTexto] = useState("");
  const [vistaMovilChat, setVistaMovilChat] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!sesion) return;
    cargarBandejaMensajes();
    const id = setInterval(() => cargarBandejaMensajes(), INTERVALO_ACTUALIZACION_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion?.usuarioId]);

  const conversaciones = useMemo(() => {
    if (!sesion) return [];
    return Object.entries(mensajes)
      .map(([convId, hilo]) => {
        if (hilo.length === 0) return null;
        const ultimo = hilo[hilo.length - 1];
        const otroId =
          ultimo.autorId === sesion.usuarioId ? ultimo.destinatarioId : ultimo.autorId;
        const otro = usuarios.find((u) => u.id === otroId);
        if (!otro) return null;
        return { convId, otro, ultimo };
      })
      .filter((c) => c !== null)
      .sort(
        (a, b) => new Date(b.ultimo.creadoEn).getTime() - new Date(a.ultimo.creadoEn).getTime()
      );
  }, [mensajes, usuarios, sesion]);

  const activa = conversaciones.find((c) => c.convId === activaId);
  const hiloActivo = activaId ? mensajes[activaId] ?? [] : [];

  if (!sesion) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <MessageCircle className="mx-auto h-10 w-10 text-moorcado-gray-dark/30" />
        <p className="mt-3 text-moorcado-gray-dark/60">
          Inicia sesión para ver tus mensajes.
        </p>
      </div>
    );
  }

  async function handleEnviar() {
    const t = texto.trim();
    if (!t || !activa || enviando) return;
    setTexto("");
    setEnviando(true);
    await enviarMensaje(activa.otro.id, t, activa.ultimo.animalId);
    setEnviando(false);
    void cargarBandejaMensajes();
  }

  return (
    <div className="mx-auto max-w-6xl px-0 py-0 sm:px-6 sm:py-6">
      <div className="grid h-[calc(100vh-4rem)] overflow-hidden rounded-none bg-white shadow-sm ring-1 ring-black/5 sm:h-[calc(100vh-8rem)] sm:grid-cols-[320px_1fr] sm:rounded-2xl">
        <div
          className={`flex-col overflow-y-auto border-r border-black/5 ${
            vistaMovilChat ? "hidden" : "flex"
          } sm:flex`}
        >
          <div className="border-b border-black/5 p-4">
            <h1 className="font-display text-lg font-bold text-moorcado-gray-dark">
              Mensajes
            </h1>
          </div>
          {conversaciones.length === 0 && (
            <p className="p-4 text-center text-sm text-moorcado-gray-dark/50">
              Aún no tienes conversaciones. Contacta a un vendedor desde un
              anuncio para empezar a chatear.
            </p>
          )}
          {conversaciones.map(({ convId, otro, ultimo }) => (
            <button
              key={convId}
              onClick={() => {
                setActivaId(convId);
                setVistaMovilChat(true);
              }}
              className={`flex w-full items-center gap-3 border-b border-black/5 p-4 text-left transition hover:bg-moorcado-gray-light ${
                activaId === convId ? "bg-moorcado-green/5" : ""
              }`}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: otro.avatarColor }}
              >
                {otro.iniciales}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-moorcado-gray-dark">
                    {otro.nombre}
                  </p>
                  <span className="shrink-0 text-[11px] text-moorcado-gray-dark/50">
                    {formatHora(ultimo.creadoEn)}
                  </span>
                </div>
                <p className="truncate text-xs text-moorcado-gray-dark/60">
                  {ultimo.autorId === sesion.usuarioId ? "Tú: " : ""}
                  {ultimo.texto}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className={`flex-col ${vistaMovilChat ? "flex" : "hidden"} sm:flex`}>
          {activa ? (
            <>
              <div className="flex items-center gap-3 border-b border-black/5 p-4">
                <button
                  onClick={() => setVistaMovilChat(false)}
                  className="text-moorcado-gray-dark sm:hidden"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: activa.otro.avatarColor }}
                >
                  {activa.otro.iniciales}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-moorcado-gray-dark">
                    {activa.otro.nombre}
                  </p>
                  {activa.otro.verificado && <VerifiedBadge />}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-moorcado-gray-light/60 p-4">
                {hiloActivo.map((m) => {
                  const propio = m.autorId === sesion.usuarioId;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${propio ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          propio
                            ? "rounded-br-sm bg-moorcado-green text-white"
                            : "rounded-bl-sm bg-white text-moorcado-gray-dark"
                        }`}
                      >
                        {m.texto}
                        <p
                          className={`mt-1 text-right text-[10px] ${
                            propio ? "text-white/70" : "text-moorcado-gray-dark/40"
                          }`}
                        >
                          {formatHora(m.creadoEn)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 border-t border-black/5 p-3">
                <div className="relative flex-1">
                  <input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
                    placeholder="Escribe un mensaje..."
                    className="w-full rounded-full bg-moorcado-gray-light px-4 py-2.5 pr-9 text-sm outline-none"
                  />
                  <div className="group absolute right-2 top-1/2 -translate-y-1/2">
                    <button
                      className="text-moorcado-gray-dark/50"
                      aria-label="Emojis"
                      type="button"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-9 right-0 hidden gap-1 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/10 group-hover:flex">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setTexto((t) => t + e)}
                          className="text-lg"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleEnviar}
                  disabled={!texto.trim() || enviando}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-moorcado-green text-white disabled:opacity-40"
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="hidden flex-1 items-center justify-center text-moorcado-gray-dark/50 sm:flex">
              Selecciona una conversación
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
