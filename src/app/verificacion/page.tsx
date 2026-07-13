"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Clock, Star } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppStore } from "@/store/useAppStore";
import { DEPARTAMENTOS_HONDURAS } from "@/lib/types";
import type { Resena } from "@/lib/resenasDb";
import VerifiedBadge from "@/components/VerifiedBadge";
import { PantallaCargando } from "@/components/Spinner";

export default function VerificacionPage() {
  const { sesion, loading } = useAuthGuard();
  const usuarios = useAppStore((s) => s.usuarios);
  const actualizarUsuario = useAppStore((s) => s.actualizarUsuario);

  const usuario = sesion ? usuarios.find((u) => u.id === sesion.usuarioId) : undefined;

  const [telefono, setTelefono] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [documentoIdentidad, setDocumentoIdentidad] = useState("");
  const [registroSag, setRegistroSag] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const [resenas, setResenas] = useState<Resena[] | null>(null);

  // Sincroniza los campos del formulario cuando cambia la identidad del
  // usuario (ej. al terminar de hidratar). Se ajusta durante el render en
  // vez de en un efecto para no disparar una segunda pasada de render.
  const [usuarioIdCargado, setUsuarioIdCargado] = useState<string | undefined>(undefined);
  if (usuario && usuario.id !== usuarioIdCargado) {
    setUsuarioIdCargado(usuario.id);
    setTelefono(usuario.telefono ?? "");
    setDepartamento(usuario.departamento ?? "");
    setDocumentoIdentidad(usuario.documentoIdentidad ?? "");
    setRegistroSag(usuario.registroSag ?? "");
  }

  useEffect(() => {
    if (!usuario?.verificado) return;
    let cancelado = false;
    import("@/lib/resenasDb").then(({ fetchResenasDeUsuario }) =>
      fetchResenasDeUsuario(usuario.id).then((r) => {
        if (!cancelado) setResenas(r ?? []);
      })
    );
    return () => {
      cancelado = true;
    };
  }, [usuario?.id, usuario?.verificado]);

  if (loading || !usuario) {
    return (
      <PantallaCargando />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario) return;
    setEnviando(true);

    const actualizado = {
      ...usuario,
      telefono,
      departamento,
      documentoIdentidad,
      registroSag,
      verificacionSolicitada: true,
    };
    actualizarUsuario(actualizado);
    const { upsertUsuarioDb } = await import("@/lib/usuariosDb");
    await upsertUsuarioDb(actualizado);

    setEnviando(false);
    setEnviado(true);
  }

  // ── Cuenta verificada: mostrar reseñas reales ──────────────────────────────
  if (usuario.verificado) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3 rounded-2xl bg-moorcado-green/5 p-5 ring-1 ring-moorcado-green/20">
          <VerifiedBadge size="md" />
          <div>
            <p className="font-display font-bold text-moorcado-gray-dark">
              Tu cuenta está verificada
            </p>
            <p className="text-sm text-moorcado-gray-dark/60">
              ⭐ {usuario.calificacion || "Sin calificación"} · {usuario.resenas} reseñas
            </p>
          </div>
        </div>

        <h1 className="mt-8 font-display text-xl font-bold text-moorcado-gray-dark">
          Reseñas sobre ti
        </h1>

        {resenas === null ? (
          <p className="mt-4 text-sm text-moorcado-gray-dark/50">Cargando reseñas...</p>
        ) : resenas.length === 0 ? (
          <p className="mt-4 text-sm text-moorcado-gray-dark/50">
            Aún no tienes reseñas. Cuando otros usuarios interactúen contigo y
            dejen su opinión, aparecerán aquí.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {resenas.map((r) => {
              const autor = usuarios.find((u) => u.id === r.autorId);
              return (
                <div
                  key={r.id}
                  className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-moorcado-gray-dark">
                      {autor?.nombre ?? "Usuario de Moorcado"}
                    </p>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < r.calificacion
                              ? "fill-moorcado-gold text-moorcado-gold"
                              : "text-moorcado-gray-dark/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-moorcado-gray-dark/70">{r.texto}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Cuenta sin verificar: formulario de solicitud ──────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-moorcado-green/10 text-moorcado-green">
          <BadgeCheck className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-moorcado-gray-dark">
          Verifica tu cuenta
        </h1>
        <p className="mt-2 text-moorcado-gray-dark/60">
          Completa tu información para que nuestro equipo pueda verificar tu
          cuenta. Las cuentas verificadas generan más confianza con
          compradores y vendedores.
        </p>
      </div>

      {enviado || usuario.verificacionSolicitada ? (
        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-moorcado-gold/10 p-5 ring-1 ring-moorcado-gold/30">
          <Clock className="h-6 w-6 shrink-0 text-moorcado-brown" />
          <div>
            <p className="font-semibold text-moorcado-gray-dark">
              Tu solicitud está en revisión
            </p>
            <p className="text-sm text-moorcado-gray-dark/60">
              Nuestro equipo revisará tu información pronto. Puedes actualizar
              tus datos aquí mientras tanto.
            </p>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
            Teléfono
          </span>
          <input
            type="tel"
            required
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej. +504 9999-8888"
            className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
            Departamento
          </span>
          <select
            required
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
          >
            <option value="">Selecciona un departamento</option>
            {DEPARTAMENTOS_HONDURAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
            Número de identidad (DNI o RTN)
          </span>
          <input
            type="text"
            required
            value={documentoIdentidad}
            onChange={(e) => setDocumentoIdentidad(e.target.value)}
            placeholder="Ej. 0801-1990-12345"
            className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
            Registro SAG <span className="font-normal text-moorcado-gray-dark/50">(opcional)</span>
          </span>
          <input
            type="text"
            value={registroSag}
            onChange={(e) => setRegistroSag(e.target.value)}
            placeholder="Ej. SAG-OL-04521"
            className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
          />
        </label>

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-full bg-moorcado-green py-3.5 text-base font-bold text-white transition hover:bg-moorcado-green/90 disabled:opacity-70"
        >
          {enviando
            ? "Enviando..."
            : usuario.verificacionSolicitada
              ? "Actualizar información"
              : "Enviar para verificación"}
        </button>
      </form>
    </div>
  );
}
