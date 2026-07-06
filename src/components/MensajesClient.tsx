"use client";

import { useState } from "react";
import {
  Camera,
  FileText,
  MapPin,
  Paperclip,
  Send,
  Smile,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import VerifiedBadge from "./VerifiedBadge";

const EMOJIS = ["👍", "❤️", "😊", "🐄", "✅", "🙏"];

export default function MensajesClient() {
  const sesion = useAppStore((s) => s.sesion);
  const mensajes = useAppStore((s) => s.mensajes);
  const anuncios = useAppStore((s) => s.anuncios);
  const usuarios = useAppStore((s) => s.usuarios);
  const enviarMensajeStore = useAppStore((s) => s.enviarMensaje);

  const [activaId, setActivaId] = useState("");
  const [texto, setTexto] = useState("");
  const [mostrarAdjuntos, setMostrarAdjuntos] = useState(false);
  const [vistaMovilChat, setVistaMovilChat] = useState(false);

  // Conversaciones reales: un hilo por animal con mensajes en la BD
  const conversaciones = useMemo(() => {
    return Object.entries(mensajes)
      .filter(([, msgs]) => msgs.length > 0)
      .map(([animalId, msgs]) => {
        const animal = anuncios.find((a) => a.id === animalId);
        const vendedor = usuarios.find((u) => u.id === animal?.vendedorId);
        const ultimo = msgs[msgs.length - 1];
        return {
          id: animalId,
          animalTitulo: animal?.titulo ?? animal?.nombre ?? "Anuncio",
          vendedorId: animal?.vendedorId ?? "",
          contacto: vendedor,
          ultimoMensaje: ultimo.texto,
          hora: ultimo.hora,
          mensajes: msgs,
        };
      });
  }, [mensajes, anuncios, usuarios]);

  const activa =
    conversaciones.find((c) => c.id === activaId) ?? conversaciones[0];
  const contacto = activa?.contacto;

  function enviarMensaje(txt: string) {
    if (!txt.trim() || !activa) return;
    enviarMensajeStore(activa.id, activa.vendedorId, txt.trim());
    setTexto("");
    setMostrarAdjuntos(false);
  }

  if (!sesion) {
    return (
      <EstadoVacio
        titulo="Inicia sesión para ver tus mensajes"
        cta="Iniciar sesión"
        href="/login"
      />
    );
  }

  if (conversaciones.length === 0) {
    return (
      <EstadoVacio
        titulo="Aún no tienes conversaciones. Contacta a un vendedor desde la página de un animal."
        cta="Explorar catálogo"
        href="/catalogo"
      />
    );
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
          {conversaciones.map((c) => {
            const u = c.contacto;
            if (!u) return null;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActivaId(c.id);
                  setVistaMovilChat(true);
                }}
                className={`flex w-full items-center gap-3 border-b border-black/5 p-4 text-left transition hover:bg-moorcado-gray-light ${
                  activaId === c.id ? "bg-moorcado-green/5" : ""
                }`}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: u.avatarColor }}
                >
                  {u.iniciales}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-moorcado-gray-dark">
                      {u.nombre}
                    </p>
                    <span className="shrink-0 text-[11px] text-moorcado-gray-dark/50">
                      {c.hora}
                    </span>
                  </div>
                  <p className="truncate text-xs font-medium text-moorcado-green/80">
                    {c.animalTitulo}
                  </p>
                  <p className="truncate text-xs text-moorcado-gray-dark/60">
                    {c.ultimoMensaje}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className={`flex-col ${vistaMovilChat ? "flex" : "hidden"} sm:flex`}>
          {activa && contacto ? (
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
                  style={{ background: contacto.avatarColor }}
                >
                  {contacto.iniciales}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-moorcado-gray-dark">
                    {contacto.nombre}
                  </p>
                  {contacto.verificado && <VerifiedBadge />}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-moorcado-gray-light/60 p-4">
                {activa.mensajes.map((m) => {
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
                        {m.texto.startsWith("Ubicación") ? (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" /> {m.texto}
                          </span>
                        ) : (
                          m.texto
                        )}
                        <p
                          className={`mt-1 text-right text-[10px] ${
                            propio ? "text-white/70" : "text-moorcado-gray-dark/40"
                          }`}
                        >
                          {m.hora}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {mostrarAdjuntos && (
                <div className="flex gap-2 border-t border-black/5 bg-white p-3">
                  <AdjuntoBtn
                    icon={Camera}
                    label="Foto"
                    onClick={() => enviarMensaje("📷 Fotografía enviada")}
                  />
                  <AdjuntoBtn
                    icon={FileText}
                    label="Documento"
                    onClick={() => enviarMensaje("📄 Documento enviado")}
                  />
                  <AdjuntoBtn
                    icon={MapPin}
                    label="Ubicación"
                    onClick={() =>
                      enviarMensaje("Ubicación compartida: Finca La Esperanza")
                    }
                  />
                </div>
              )}

              <div className="flex items-center gap-2 border-t border-black/5 p-3">
                <button
                  onClick={() => setMostrarAdjuntos((v) => !v)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-moorcado-gray-dark/60 hover:bg-moorcado-gray-light"
                  aria-label="Adjuntar"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <div className="relative flex-1">
                  <input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && enviarMensaje(texto)}
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
                  onClick={() => enviarMensaje(texto)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-moorcado-green text-white"
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

function EstadoVacio({
  titulo,
  cta,
  href,
}: {
  titulo: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-moorcado-gray-dark/70">{titulo}</p>
      <Link
        href={href}
        className="rounded-full bg-moorcado-green px-6 py-2.5 text-sm font-bold text-white"
      >
        {cta}
      </Link>
    </div>
  );
}

function AdjuntoBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Camera;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-moorcado-gray-light py-3 text-xs font-medium text-moorcado-gray-dark"
    >
      <Icon className="h-5 w-5 text-moorcado-green" />
      {label}
    </button>
  );
}
