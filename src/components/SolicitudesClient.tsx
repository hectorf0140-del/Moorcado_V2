"use client";

import { useEffect, useState } from "react";
import { Check, Megaphone, Plus, Send, X } from "lucide-react";
import { DEPARTAMENTOS_HONDURAS, RAZAS_GANADO, type SolicitudCompra } from "@/lib/types";
import { formatLempiras } from "@/lib/format";
import { useAppStore } from "@/store/useAppStore";

export default function SolicitudesClient() {
  const sesion = useAppStore((s) => s.sesion);
  const usuarios = useAppStore((s) => s.usuarios);
  const enviarMensaje = useAppStore((s) => s.enviarMensaje);
  const [solicitudes, setSolicitudes] = useState<SolicitudCompra[] | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [respondiendoId, setRespondiendoId] = useState<string | null>(null);
  const [cerrandoId, setCerrandoId] = useState<string | null>(null);

  const usuarioActual = sesion ? usuarios.find((u) => u.id === sesion.usuarioId) : undefined;
  const esEmpresa = usuarioActual?.tipo === "empresa";

  async function cargar() {
    const { fetchSolicitudesCompra } = await import("@/lib/solicitudesCompraDb");
    const datos = await fetchSolicitudesCompra();
    setSolicitudes(datos ?? []);
  }

  async function cerrarSolicitud(id: string) {
    setCerrandoId(id);
    const { actualizarSolicitudCompraDb } = await import("@/lib/solicitudesCompraDb");
    await actualizarSolicitudCompraDb(id, false);
    setCerrandoId(null);
    void cargar();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-moorcado-gray-dark">
            <Megaphone className="h-6 w-6 text-moorcado-green" />
            Busco Ganado
          </h1>
          <p className="text-sm text-moorcado-gray-dark/60">
            Empresas publican qué necesitan comprar; cualquier vendedor puede responder.
          </p>
        </div>
        {esEmpresa && (
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 rounded-full bg-moorcado-green px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Publicar solicitud
          </button>
        )}
      </div>

      {!sesion && (
        <p className="mt-4 rounded-2xl bg-moorcado-gold/10 p-4 text-sm text-moorcado-brown ring-1 ring-moorcado-gold/30">
          Inicia sesión para responder a una solicitud o, si tienes cuenta empresa, publicar la tuya.
        </p>
      )}
      {sesion && !esEmpresa && (
        <p className="mt-4 rounded-2xl bg-moorcado-gray-light p-4 text-sm text-moorcado-gray-dark/70">
          Publicar solicitudes de compra es exclusivo de cuentas empresa. Cualquier vendedor puede responder a las que ya existen.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {solicitudes === null ? (
          <p className="text-center text-sm text-moorcado-gray-dark/50">Cargando...</p>
        ) : solicitudes.filter((s) => s.activa).length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-moorcado-gray-dark/50 shadow-sm ring-1 ring-black/5">
            No hay solicitudes de compra activas por ahora.
          </p>
        ) : (
          solicitudes
            .filter((s) => s.activa)
            .map((s) => {
              const comprador = usuarios.find((u) => u.id === s.compradorId);
              return (
                <div key={s.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold text-moorcado-gray-dark">
                        Busca {s.cantidad} cabeza(s) de {s.raza}
                      </p>
                      <p className="text-sm text-moorcado-gray-dark/60">
                        {s.departamento} · Presupuesto hasta {formatLempiras(s.precioMax)}
                      </p>
                      {comprador && (
                        <p className="mt-1 text-xs text-moorcado-gray-dark/50">
                          Publicado por {comprador.nombre}
                          {comprador.nombreEmpresa ? ` · ${comprador.nombreEmpresa}` : ""}
                        </p>
                      )}
                    </div>
                    {sesion && sesion.usuarioId !== s.compradorId && (
                      <button
                        onClick={() => setRespondiendoId(s.id)}
                        className="flex shrink-0 items-center gap-1.5 rounded-full bg-moorcado-green px-4 py-2 text-sm font-semibold text-white"
                      >
                        <Send className="h-4 w-4" />
                        Responder
                      </button>
                    )}
                    {sesion && sesion.usuarioId === s.compradorId && (
                      <button
                        onClick={() => cerrarSolicitud(s.id)}
                        disabled={cerrandoId === s.id}
                        className="flex shrink-0 items-center gap-1.5 rounded-full bg-moorcado-gray-light px-4 py-2 text-sm font-semibold text-moorcado-gray-dark/70 ring-1 ring-black/10 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        {cerrandoId === s.id ? "Cerrando..." : "Marcar cumplida"}
                      </button>
                    )}
                  </div>
                  {s.descripcion && (
                    <p className="mt-3 text-sm text-moorcado-gray-dark/80">{s.descripcion}</p>
                  )}

                  {respondiendoId === s.id && (
                    <RespuestaForm
                      onCancelar={() => setRespondiendoId(null)}
                      onEnviar={async (texto) => {
                        await enviarMensaje(s.compradorId, texto);
                        setRespondiendoId(null);
                      }}
                    />
                  )}
                </div>
              );
            })
        )}
      </div>

      {mostrarForm && usuarioActual && (
        <FormularioSolicitud
          usuarioId={usuarioActual.id}
          onCerrar={() => setMostrarForm(false)}
          onCreada={() => {
            setMostrarForm(false);
            void cargar();
          }}
        />
      )}
    </div>
  );
}

function RespuestaForm({
  onCancelar,
  onEnviar,
}: {
  onCancelar: () => void;
  onEnviar: (texto: string) => Promise<void>;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    await onEnviar(texto.trim());
    setEnviando(false);
    setEnviado(true);
  }

  if (enviado) {
    return (
      <p className="mt-3 rounded-xl bg-moorcado-green/10 p-3 text-sm font-semibold text-moorcado-green">
        Mensaje enviado. Revísalo en tus Mensajes.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Ej. Tengo 5 Brahman disponibles, te escribo..."
        className="flex-1 rounded-full bg-moorcado-gray-light px-4 py-2 text-sm outline-none"
        autoFocus
      />
      <button
        type="submit"
        disabled={!texto.trim() || enviando}
        className="rounded-full bg-moorcado-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        Enviar
      </button>
      <button type="button" onClick={onCancelar} className="text-sm text-moorcado-gray-dark/50">
        Cancelar
      </button>
    </form>
  );
}

function FormularioSolicitud({
  usuarioId,
  onCerrar,
  onCreada,
}: {
  usuarioId: string;
  onCerrar: () => void;
  onCreada: () => void;
}) {
  const [raza, setRaza] = useState<string>(RAZAS_GANADO[0]);
  const [cantidad, setCantidad] = useState("1");
  const [precioMax, setPrecioMax] = useState("");
  const [departamento, setDepartamento] = useState<string>(DEPARTAMENTOS_HONDURAS[0]);
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    const { crearSolicitudCompraDb } = await import("@/lib/solicitudesCompraDb");
    await crearSolicitudCompraDb({
      id: `sol-${Date.now()}`,
      compradorId: usuarioId,
      raza,
      cantidad: Number(cantidad) || 1,
      precioMax: Number(precioMax) || 0,
      departamento,
      descripcion,
      activa: true,
      creadoEn: new Date().toISOString(),
    });
    setEnviando(false);
    onCreada();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-moorcado-gray-dark">
            Publicar solicitud de compra
          </h3>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X className="h-5 w-5 text-moorcado-gray-dark/60" />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">Raza</span>
            <select
              value={raza}
              onChange={(e) => setRaza(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            >
              {RAZAS_GANADO.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">Cantidad</span>
              <input
                type="number"
                min={1}
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Presupuesto máx. (L.)
              </span>
              <input
                type="number"
                min={0}
                required
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">Departamento</span>
            <select
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            >
              {DEPARTAMENTOS_HONDURAS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Descripción (opcional)
            </span>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Preferiblemente con registro SAG, edad 2-3 años..."
              className="w-full resize-none rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="mt-5 w-full rounded-full bg-moorcado-green py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {enviando ? "Publicando..." : "Publicar solicitud"}
        </button>
      </form>
    </div>
  );
}
