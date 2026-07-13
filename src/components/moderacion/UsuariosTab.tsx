"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ShieldCheck, ShieldOff, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Usuario } from "@/lib/types";
import BuscadorInput from "../BuscadorInput";
import Paginacion from "./Paginacion";
import { Spinner } from "../Spinner";

type AccionUsuario = "verificar" | "rechazar" | "suspender" | "reactivar";

const POR_PAGINA = 10;

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-lg bg-white p-2">
      <p className="text-[10px] uppercase text-moorcado-gray-dark/40">{label}</p>
      <p className="truncate font-medium text-moorcado-gray-dark">{valor}</p>
    </div>
  );
}

export default function UsuariosTab({ token }: { token: string }) {
  const usuarios = useAppStore((s) => s.usuarios);
  const actualizarUsuario = useAppStore((s) => s.actualizarUsuario);

  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [suspendiendoId, setSuspendiendoId] = useState<string | null>(null);
  const [motivoSuspension, setMotivoSuspension] = useState("");
  const [accionEnCurso, setAccionEnCurso] = useState<{ id: string; tipo: AccionUsuario } | null>(
    null
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios
      .filter((u) => {
        if (!q) return true;
        return (
          (u.nombre ?? "").toLowerCase().includes(q) ||
          (u.correo ?? "").toLowerCase().includes(q) ||
          (u.tipo ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => Number(b.verificacionSolicitada) - Number(a.verificacionSolicitada));
  }, [usuarios, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  async function verificarUsuario(usuario: Usuario) {
    setAccionEnCurso({ id: usuario.id, tipo: "verificar" });
    const { verificarUsuarioRpc } = await import("@/lib/moderadoresDb");
    const ok = await verificarUsuarioRpc(token, usuario.id);
    setAccionEnCurso(null);
    if (!ok) return;
    actualizarUsuario({ ...usuario, verificado: true, verificacionSolicitada: false });
  }

  async function rechazarVerificacion(usuario: Usuario) {
    setAccionEnCurso({ id: usuario.id, tipo: "rechazar" });
    const { rechazarVerificacionRpc } = await import("@/lib/moderadoresDb");
    const ok = await rechazarVerificacionRpc(token, usuario.id);
    setAccionEnCurso(null);
    if (!ok) return;
    actualizarUsuario({ ...usuario, verificacionSolicitada: false });
  }

  async function confirmarSuspension(usuario: Usuario) {
    const motivo = motivoSuspension.trim();
    if (!motivo) return;

    setAccionEnCurso({ id: usuario.id, tipo: "suspender" });
    // La cascada que desactiva las publicaciones del vendedor ahora vive
    // en el RPC (antes era un loop cliente por cada anuncio).
    const { suspenderUsuarioRpc } = await import("@/lib/moderadoresDb");
    const ok = await suspenderUsuarioRpc(token, usuario.id, motivo);
    setAccionEnCurso(null);
    if (!ok) return;

    actualizarUsuario({ ...usuario, estadoCuenta: "suspendido", estadoCuentaMotivo: motivo });

    const { crearNotificacionDb } = await import("@/lib/notificacionesDb");
    void crearNotificacionDb({
      usuarioId: usuario.id,
      tipo: "cuenta_suspendida",
      titulo: "Tu cuenta fue suspendida",
      descripcion: motivo,
    });

    setSuspendiendoId(null);
    setMotivoSuspension("");
  }

  async function reactivarCuenta(usuario: Usuario) {
    setAccionEnCurso({ id: usuario.id, tipo: "reactivar" });
    const { reactivarUsuarioRpc } = await import("@/lib/moderadoresDb");
    const ok = await reactivarUsuarioRpc(token, usuario.id);
    setAccionEnCurso(null);
    if (!ok) return;
    actualizarUsuario({ ...usuario, estadoCuenta: "activo", estadoCuentaMotivo: undefined });
  }

  return (
    <section className="space-y-4">
      <BuscadorInput
        value={busqueda}
        onChange={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        placeholder="Buscar por nombre, correo o tipo..."
      />
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-moorcado-gray-dark">
            Usuarios ({filtrados.length})
          </h2>
          <p className="text-xs text-moorcado-gray-dark/50">
            Los que solicitaron verificación aparecen primero
          </p>
        </div>
        {visibles.length === 0 ? (
          <p className="mt-3 text-sm text-moorcado-gray-dark/50">No se encontraron usuarios.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {visibles.map((u) => {
              const expandidoActual = expandido === u.id;
              const suspendido = u.estadoCuenta === "suspendido";
              return (
                <li key={u.id} className="rounded-xl bg-moorcado-gray-light">
                  <button
                    onClick={() => setExpandido(expandidoActual ? null : u.id)}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: u.avatarColor }}
                      >
                        {u.iniciales}
                      </span>
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-moorcado-gray-dark">
                          {u.nombre}
                          {u.verificado && <ShieldCheck className="h-3.5 w-3.5 text-moorcado-green" />}
                          {!u.verificado && u.verificacionSolicitada && (
                            <span className="rounded-full bg-moorcado-gold/20 px-2 py-0.5 text-[10px] font-bold text-moorcado-brown">
                              Pendiente
                            </span>
                          )}
                          {suspendido && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                              Suspendida
                            </span>
                          )}
                        </p>
                        <p className="text-xs capitalize text-moorcado-gray-dark/60">
                          {u.tipo} · {u.departamento || "sin departamento"}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-moorcado-gray-dark/40 transition-transform ${
                        expandidoActual ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandidoActual && (
                    <div className="space-y-3 border-t border-black/5 px-3 pb-3 pt-3">
                      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                        <Campo label="Correo" valor={u.correo} />
                        <Campo label="Teléfono" valor={u.telefono || "—"} />
                        <Campo label="Departamento" valor={u.departamento || "—"} />
                        <Campo label="Documento" valor={u.documentoIdentidad || "—"} />
                        <Campo label="Registro SAG" valor={u.registroSag || "—"} />
                        <Campo label="Plan" valor={u.plan} />
                        <Campo label="Calificación" valor={`${u.calificacion} ⭐ (${u.resenas} reseñas)`} />
                        <Campo label="Ventas" valor={String(u.numeroVentas)} />
                        <Campo
                          label="Registrado"
                          valor={u.creadoEn ? new Date(u.creadoEn).toLocaleDateString("es-HN") : "—"}
                        />
                      </div>

                      {suspendido && u.estadoCuentaMotivo && (
                        <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
                          Motivo de suspensión: {u.estadoCuentaMotivo}
                        </p>
                      )}

                      {!u.verificado && !suspendido && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => verificarUsuario(u)}
                            disabled={accionEnCurso?.id === u.id}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moorcado-green/10 py-2 text-xs font-bold text-moorcado-green transition hover:bg-moorcado-green/20 disabled:opacity-50"
                          >
                            {accionEnCurso?.id === u.id && accionEnCurso.tipo === "verificar" ? (
                              <Spinner tamano="sm" color="verde" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            {accionEnCurso?.id === u.id && accionEnCurso.tipo === "verificar"
                              ? "Verificando..."
                              : "Verificar"}
                          </button>
                          <button
                            onClick={() => rechazarVerificacion(u)}
                            disabled={accionEnCurso?.id === u.id}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-100 py-2 text-xs font-bold text-red-600 transition hover:bg-red-200 disabled:opacity-50"
                          >
                            {accionEnCurso?.id === u.id && accionEnCurso.tipo === "rechazar" ? (
                              <Spinner tamano="sm" color="gris" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                            {accionEnCurso?.id === u.id && accionEnCurso.tipo === "rechazar"
                              ? "Rechazando..."
                              : "Rechazar solicitud"}
                          </button>
                        </div>
                      )}

                      {suspendido ? (
                        <button
                          onClick={() => reactivarCuenta(u)}
                          disabled={accionEnCurso?.id === u.id}
                          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-moorcado-green/10 py-2 text-xs font-bold text-moorcado-green transition hover:bg-moorcado-green/20 disabled:opacity-50"
                        >
                          {accionEnCurso?.id === u.id && accionEnCurso.tipo === "reactivar" ? (
                            <Spinner tamano="sm" color="verde" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          )}
                          {accionEnCurso?.id === u.id && accionEnCurso.tipo === "reactivar"
                            ? "Reactivando..."
                            : "Reactivar cuenta"}
                        </button>
                      ) : suspendiendoId === u.id ? (
                        <div className="space-y-2 rounded-lg bg-white p-3">
                          <textarea
                            value={motivoSuspension}
                            onChange={(e) => setMotivoSuspension(e.target.value)}
                            placeholder="Motivo de la suspensión (obligatorio)..."
                            className="w-full resize-none rounded-lg border border-black/10 p-2 text-xs outline-none focus:border-moorcado-gray-dark"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmarSuspension(u)}
                              disabled={!motivoSuspension.trim() || accionEnCurso?.id === u.id}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-600 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-40"
                            >
                              {accionEnCurso?.id === u.id && accionEnCurso.tipo === "suspender" && (
                                <Spinner tamano="sm" color="blanco" />
                              )}
                              {accionEnCurso?.id === u.id && accionEnCurso.tipo === "suspender"
                                ? "Suspendiendo..."
                                : "Confirmar suspensión"}
                            </button>
                            <button
                              onClick={() => {
                                setSuspendiendoId(null);
                                setMotivoSuspension("");
                              }}
                              className="rounded-full bg-moorcado-gray-light px-4 py-2 text-xs font-bold text-moorcado-gray-dark transition hover:bg-moorcado-gray-light/70"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSuspendiendoId(u.id)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-red-100 py-2 text-xs font-bold text-red-600 transition hover:bg-red-200"
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                          Suspender cuenta
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <Paginacion paginaActual={paginaActual} totalPaginas={totalPaginas} onCambiar={setPagina} />
      </div>
    </section>
  );
}
