"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Baby,
  Bell,
  Crown,
  Download,
  HeartPulse,
  Lock,
  Milk,
  Phone,
  Plus,
  Sparkles,
  Stethoscope,
  Syringe,
  Wallet,
  X,
} from "lucide-react";
import { formatLempiras } from "@/lib/format";
import type { AnimalHato, RegistroVeterinario, Veterinario } from "@/lib/types";
import { RAZAS_GANADO } from "@/lib/types";
import StatCard from "@/components/StatCard";
import PagoRumiProModal from "@/components/PagoRumiProModal";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppStore } from "@/store/useAppStore";

const ESTADOS: Record<AnimalHato["estado"], { label: string; cls: string }> = {
  sana: { label: "Sana", cls: "bg-moorcado-green/10 text-moorcado-green" },
  en_tratamiento: { label: "En tratamiento", cls: "bg-red-100 text-red-600" },
  prenada: { label: "Preñada", cls: "bg-moorcado-gold/15 text-moorcado-brown" },
  seca: { label: "Seca", cls: "bg-moorcado-gray-light text-moorcado-gray-dark/70" },
};

function diasHasta(fecha: string) {
  return Math.round((new Date(fecha).getTime() - Date.now()) / 86_400_000);
}

function generarIdHato() {
  return `h-${Date.now()}`;
}

function exportarCsv(hato: AnimalHato[]) {
  const encabezado = [
    "Nombre",
    "Raza",
    "Edad (meses)",
    "Estado",
    "Producción (L/día)",
    "Última vacuna",
    "Próxima revisión",
    "Valor estimado",
  ];
  const filas = hato.map((a) => [
    a.nombre,
    a.raza,
    a.edadMeses,
    ESTADOS[a.estado].label,
    a.produccionLitrosDia ?? "",
    a.ultimaVacuna,
    a.proximaRevision,
    a.valorEstimado,
  ]);
  const csv = [encabezado, ...filas]
    .map((fila) => fila.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mi-hato-rumi.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function RumiPage() {
  const { sesion, loading } = useAuthGuard();
  const usuarios = useAppStore((s) => s.usuarios);
  const anuncios = useAppStore((s) => s.anuncios);
  const actualizarUsuario = useAppStore((s) => s.actualizarUsuario);
  const [mostrarModalAnimal, setMostrarModalAnimal] = useState(false);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [razaNueva, setRazaNueva] = useState<string>(RAZAS_GANADO[0]);
  const [edadNueva, setEdadNueva] = useState("12");
  const [produccionNueva, setProduccionNueva] = useState("");
  const [valorNuevo, setValorNuevo] = useState("");
  const [estadoNuevo, setEstadoNuevo] = useState<AnimalHato["estado"]>("sana");
  const [veterinarios, setVeterinarios] = useState<Veterinario[] | null>(null);

  const usuarioActual = sesion ? usuarios.find((u) => u.id === sesion.usuarioId) : undefined;
  const esEmpresa = usuarioActual?.tipo === "empresa";
  const tienePremium = usuarioActual?.plan === "premium";
  const tienePro = Boolean(usuarioActual?.rumiPro);
  const hato = usuarioActual?.hato ?? [];

  useEffect(() => {
    if (!esEmpresa || !tienePro) return;
    let cancelado = false;
    import("@/lib/veterinariosDb").then(({ fetchVeterinarios }) =>
      fetchVeterinarios().then((v) => {
        if (!cancelado) setVeterinarios(v ?? []);
      })
    );
    return () => {
      cancelado = true;
    };
  }, [esEmpresa, tienePro]);

  async function guardarHato(nuevoHato: AnimalHato[]) {
    if (!usuarioActual) return;
    const actualizado = { ...usuarioActual, hato: nuevoHato };
    actualizarUsuario(actualizado);
    const { upsertUsuarioDb } = await import("@/lib/usuariosDb");
    void upsertUsuarioDb(actualizado);
  }

  function registrarAnimal(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreNuevo.trim()) return;
    const hoy = new Date();
    const revision = new Date(hoy);
    revision.setDate(revision.getDate() + 45);
    const id = generarIdHato();
    void guardarHato([
      ...hato,
      {
        id,
        nombre: nombreNuevo,
        raza: razaNueva,
        edadMeses: Number(edadNueva) || 12,
        estado: estadoNuevo,
        proximaRevision: revision.toISOString().split("T")[0],
        ultimaVacuna: hoy.toISOString().split("T")[0],
        valorEstimado: Number(valorNuevo) || 0,
        produccionLitrosDia: produccionNueva ? Number(produccionNueva) : undefined,
      },
    ]);
    setNombreNuevo("");
    setRazaNueva(RAZAS_GANADO[0]);
    setEdadNueva("12");
    setProduccionNueva("");
    setValorNuevo("");
    setEstadoNuevo("sana");
    setMostrarModalAnimal(false);
  }

  function cambiarEstado(id: string, estado: AnimalHato["estado"]) {
    void guardarHato(hato.map((a) => (a.id === id ? { ...a, estado } : a)));
  }

  async function activarRumiPro() {
    if (!usuarioActual) return;
    const actualizado = {
      ...usuarioActual,
      rumiPro: true,
      fechaActivacionRumiPro: new Date().toISOString(),
    };
    actualizarUsuario(actualizado);
    const { upsertUsuarioDb } = await import("@/lib/usuariosDb");
    await upsertUsuarioDb(actualizado);
    setMostrarModalPago(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-moorcado-green border-t-transparent" />
      </div>
    );
  }

  if (!esEmpresa) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-moorcado-gold/15 text-moorcado-brown">
          <Crown className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-moorcado-gray-dark">
          Rumi es exclusivo para cuentas empresariales
        </h1>
        <p className="mt-2 text-moorcado-gray-dark/60">
          El administrador inteligente de hato está disponible solo para cuentas
          de tipo Empresa. Si manejas una empresa ganadera, contáctanos para
          activar tu cuenta.
        </p>
      </div>
    );
  }

  if (!tienePremium) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-moorcado-gold/15 text-moorcado-brown">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-moorcado-gray-dark">
          Rumi requiere el plan Premium
        </h1>
        <p className="mt-2 text-moorcado-gray-dark/60">
          Tu cuenta ya es de tipo Empresa, pero Rumi (gestión de hato) es un
          beneficio del plan Premium. Actualiza tu plan para desbloquearlo.
        </p>
        <Link
          href="/planes"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-moorcado-gold px-5 py-3 text-sm font-bold text-white"
        >
          <Crown className="h-4 w-4" />
          Ver planes
        </Link>
      </div>
    );
  }

  const valorTotal = hato.reduce((acc, a) => acc + a.valorEstimado, 0);
  const produccionTotal = hato.reduce((acc, a) => acc + (a.produccionLitrosDia ?? 0), 0);
  const alertas = hato.filter((a) => diasHasta(a.proximaRevision) <= 14);

  const misAnuncios = usuarioActual
    ? anuncios.filter((a) => a.vendedorId === usuarioActual.id)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-linear-to-br from-moorcado-brown to-moorcado-gray-dark p-6 text-white sm:p-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-moorcado-gold px-3 py-1 text-xs font-bold">
            <Crown className="h-3.5 w-3.5" />
            Módulo Premium{tienePro ? " · Pro activo" : ""}
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Rumi</h1>
          <p className="mt-1 max-w-lg text-sm text-white/80">
            El administrador inteligente de tu hato: salud, producción,
            reproducción y trazabilidad en un solo lugar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMostrarModalAnimal(true)}
            className="flex items-center gap-1.5 rounded-full bg-moorcado-gold px-4 py-2.5 text-sm font-bold text-moorcado-gray-dark"
          >
            <Plus className="h-4 w-4" />
            Registrar Animal
          </button>
          <button
            onClick={() => exportarCsv(hato)}
            disabled={hato.length === 0}
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/30 disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Wallet} label="Valor del hato" value={formatLempiras(valorTotal)} accent="gold" />
        <StatCard icon={HeartPulse} label="Animales registrados" value={hato.length} />
        <StatCard icon={Milk} label="Producción diaria" value={`${produccionTotal} L`} accent="brown" />
        <StatCard icon={Bell} label="Revisiones próximas" value={alertas.length} accent="gold" />
      </div>

      {alertas.length > 0 && (
        <section className="mt-6 rounded-2xl bg-moorcado-gold/10 p-5 ring-1 ring-moorcado-gold/30">
          <h2 className="flex items-center gap-2 font-display font-bold text-moorcado-brown">
            <Bell className="h-5 w-5" /> Alertas y próximas revisiones
          </h2>
          <ul className="mt-3 space-y-2">
            {alertas.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm text-moorcado-gray-dark">
                <span>
                  <strong>{a.nombre}</strong> — revisión el {a.proximaRevision}
                </span>
                <span className="text-xs font-semibold text-moorcado-brown">
                  {diasHasta(a.proximaRevision) <= 0
                    ? "Vencida"
                    : `en ${diasHasta(a.proximaRevision)} días`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-moorcado-gray-dark">
          Mi hato
        </h2>
        {hato.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-white p-6 text-center text-sm text-moorcado-gray-dark/50 shadow-sm ring-1 ring-black/5">
            Aún no has registrado animales en tu hato. Usa &quot;Registrar Animal&quot; para empezar.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full min-w-190 text-left text-sm">
              <thead className="bg-moorcado-gray-light text-xs uppercase text-moorcado-gray-dark/60">
                <tr>
                  <th className="px-4 py-3">Animal</th>
                  <th className="px-4 py-3">Raza</th>
                  <th className="px-4 py-3">Edad</th>
                  <th className="px-4 py-3">Producción</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Última vacuna</th>
                  <th className="px-4 py-3">Próxima revisión</th>
                  <th className="px-4 py-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {hato.map((a) => (
                  <tr key={a.id} className="border-t border-black/5">
                    <td className="px-4 py-3 font-medium text-moorcado-gray-dark">{a.nombre}</td>
                    <td className="px-4 py-3 text-moorcado-gray-dark/70">{a.raza}</td>
                    <td className="px-4 py-3 text-moorcado-gray-dark/70">{a.edadMeses} m</td>
                    <td className="px-4 py-3 text-moorcado-gray-dark/70">
                      {a.produccionLitrosDia ? `${a.produccionLitrosDia} L/día` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={a.estado}
                        onChange={(e) => cambiarEstado(a.id, e.target.value as AnimalHato["estado"])}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none ${ESTADOS[a.estado].cls}`}
                      >
                        {Object.entries(ESTADOS).map(([valor, { label }]) => (
                          <option key={valor} value={valor}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-moorcado-gray-dark/70">{a.ultimaVacuna}</td>
                    <td className="px-4 py-3 text-moorcado-gray-dark/70">{a.proximaRevision}</td>
                    <td className="px-4 py-3 font-semibold text-moorcado-gray-dark">
                      {formatLempiras(a.valorEstimado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-moorcado-gray-dark">
            <Sparkles className="h-5 w-5 text-moorcado-brown" />
            Rumi Pro
          </h2>
          {!tienePro && (
            <button
              onClick={() => setMostrarModalPago(true)}
              className="flex items-center gap-1.5 rounded-full bg-moorcado-brown px-4 py-2.5 text-sm font-bold text-white"
            >
              <Crown className="h-4 w-4" />
              Activar — L. 3,000/mes
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          <RumiTool
            icon={Stethoscope}
            title="Directorio de veterinarios"
            desc="Contacta veterinarios verificados cerca de tu operación."
            bloqueada={!tienePro}
            onClick={tienePro ? undefined : () => setMostrarModalPago(true)}
          />
          <RumiTool
            icon={Syringe}
            title="Historial médico real"
            desc="Registra visitas veterinarias reales en tus publicaciones."
            bloqueada={!tienePro}
            onClick={
              tienePro
                ? () => setMostrarModalHistorial(true)
                : () => setMostrarModalPago(true)
            }
          />
          <RumiTool
            icon={Baby}
            title="Reproducción y partos"
            desc="Marca un animal como preñada desde la tabla de arriba y Rumi le da seguimiento."
            bloqueada={!tienePro}
            onClick={tienePro ? undefined : () => setMostrarModalPago(true)}
          />
        </div>

        {tienePro && (
          <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h3 className="font-display font-semibold text-moorcado-gray-dark">
              Veterinarios verificados
            </h3>
            {veterinarios === null ? (
              <p className="mt-2 text-sm text-moorcado-gray-dark/50">Cargando...</p>
            ) : veterinarios.length === 0 ? (
              <p className="mt-2 text-sm text-moorcado-gray-dark/50">
                No hay veterinarios registrados por ahora.
              </p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {veterinarios.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-moorcado-gray-light p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-moorcado-gray-dark">
                        {v.nombre}
                      </p>
                      <p className="truncate text-xs text-moorcado-gray-dark/60">
                        {v.especialidad} · {v.departamento}
                      </p>
                    </div>
                    <a
                      href={`tel:${v.telefono.replace(/\s/g, "")}`}
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-moorcado-green px-3 py-1.5 text-xs font-bold text-white"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Llamar
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {mostrarModalAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={registrarAnimal}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-moorcado-gray-dark">
                Registrar animal en Rumi
              </h3>
              <button type="button" onClick={() => setMostrarModalAnimal(false)} aria-label="Cerrar">
                <X className="h-5 w-5 text-moorcado-gray-dark/60" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                  Nombre del animal
                </span>
                <input
                  value={nombreNuevo}
                  onChange={(e) => setNombreNuevo(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
                  placeholder="Ej. Bonita"
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">Raza</span>
                <select
                  value={razaNueva}
                  onChange={(e) => setRazaNueva(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
                >
                  {RAZAS_GANADO.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                    Edad (meses)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={edadNueva}
                    onChange={(e) => setEdadNueva(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                    Producción (L/día)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={produccionNueva}
                    onChange={(e) => setProduccionNueva(e.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                  Valor estimado (L.)
                </span>
                <input
                  type="number"
                  min={0}
                  value={valorNuevo}
                  onChange={(e) => setValorNuevo(e.target.value)}
                  placeholder="Ej. 25000"
                  className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">Estado</span>
                <select
                  value={estadoNuevo}
                  onChange={(e) => setEstadoNuevo(e.target.value as AnimalHato["estado"])}
                  className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
                >
                  {Object.entries(ESTADOS).map(([valor, { label }]) => (
                    <option key={valor} value={valor}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="mt-5 w-full rounded-full bg-moorcado-green py-3 text-sm font-bold text-white"
            >
              Registrar
            </button>
          </form>
        </div>
      )}

      {mostrarModalPago && (
        <PagoRumiProModal
          onCancelar={() => setMostrarModalPago(false)}
          onConfirmar={activarRumiPro}
        />
      )}

      {mostrarModalHistorial && usuarioActual && (
        <ModalHistorialVeterinario
          anuncios={misAnuncios}
          onCerrar={() => setMostrarModalHistorial(false)}
        />
      )}
    </div>
  );
}

function RumiTool({
  icon: Icon,
  title,
  desc,
  bloqueada,
  onClick,
}: {
  icon: typeof Syringe;
  title: string;
  desc: string;
  bloqueada?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`relative rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-black/5 transition ${
        onClick ? "hover:-translate-y-0.5 hover:shadow-md" : "cursor-default"
      }`}
    >
      {bloqueada && (
        <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-moorcado-gray-light text-moorcado-gray-dark/50">
          <Lock className="h-3.5 w-3.5" />
        </span>
      )}
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-moorcado-brown/10 text-moorcado-brown">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 font-display font-semibold text-moorcado-gray-dark">{title}</h3>
      <p className="mt-1 text-sm text-moorcado-gray-dark/60">{desc}</p>
      {bloqueada && (
        <p className="mt-2 text-xs font-semibold text-moorcado-brown">Exclusivo Rumi Pro</p>
      )}
    </button>
  );
}

function ModalHistorialVeterinario({
  anuncios,
  onCerrar,
}: {
  anuncios: { id: string; titulo: string; nombre: string }[];
  onCerrar: () => void;
}) {
  const actualizarAnuncioStore = useAppStore((s) => s.actualizarAnuncio);
  const anunciosCompletos = useAppStore((s) => s.anuncios);
  const [anuncioId, setAnuncioId] = useState(anuncios[0]?.id ?? "");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [descripcion, setDescripcion] = useState("");
  const [guardado, setGuardado] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!anuncioId || !descripcion.trim()) return;
    const anuncio = anunciosCompletos.find((a) => a.id === anuncioId);
    if (!anuncio) return;
    const nuevaEntrada: RegistroVeterinario = { fecha, descripcion: descripcion.trim() };
    actualizarAnuncioStore({
      ...anuncio,
      historialVeterinario: [...anuncio.historialVeterinario, nuevaEntrada],
    });
    setGuardado(true);
    setTimeout(onCerrar, 900);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-moorcado-gray-dark">
            Agregar registro veterinario
          </h3>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X className="h-5 w-5 text-moorcado-gray-dark/60" />
          </button>
        </div>

        {guardado ? (
          <p className="mt-6 text-center text-sm font-semibold text-moorcado-green">
            ¡Registro agregado! 🎉
          </p>
        ) : anuncios.length === 0 ? (
          <p className="mt-4 text-sm text-moorcado-gray-dark/60">
            Aún no tienes publicaciones donde agregar historial veterinario.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Publicación
              </span>
              <select
                value={anuncioId}
                onChange={(e) => setAnuncioId(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
              >
                {anuncios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.titulo || a.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">Fecha</span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Descripción
              </span>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Vacuna contra fiebre aftosa aplicada."
                className="w-full resize-none rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-moorcado-green py-3 text-sm font-bold text-white"
            >
              Guardar registro
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
