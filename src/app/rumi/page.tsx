"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Baby,
  Bell,
  Crown,
  Download,
  FileText,
  HeartPulse,
  Lock,
  Mail,
  MessageCircle,
  Milk,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Wallet,
} from "lucide-react";
import { formatLempiras } from "@/lib/format";
import type { AnimalHato, Veterinario } from "@/lib/types";
import {
  ESTADOS_HATO,
  TIPOS_CITA,
  citasPorRecordar,
  diasHasta,
  proximaRevisionDe,
  registrarSnapshot,
  ultimaVacunaCompletadaDe,
} from "@/lib/hato";
import { telefonoAWhatsappUrl } from "@/lib/telefono";
import { generarPdfHato } from "@/lib/exportarHatoPdf";
import StatCard from "@/components/StatCard";
import PagoRumiProModal from "@/components/PagoRumiProModal";
import PremiumBadge from "@/components/PremiumBadge";
import HatoAnimalModal from "@/components/rumi/HatoAnimalModal";
import CitaModal from "@/components/rumi/CitaModal";
import HistorialAnimalPanel from "@/components/rumi/HistorialAnimalPanel";
import HatoProduccionChart from "@/components/rumi/HatoProduccionChart";
import HatoTable from "@/components/rumi/HatoTable";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppStore } from "@/store/useAppStore";
import { PantallaCargando } from "@/components/Spinner";

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
    ESTADOS_HATO[a.estado].label,
    a.produccionLitrosDia ?? "",
    ultimaVacunaCompletadaDe(a) ?? "",
    proximaRevisionDe(a) ?? "",
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
  const actualizarUsuario = useAppStore((s) => s.actualizarUsuario);
  const [animalEnEdicionId, setAnimalEnEdicionId] = useState<string | "nueva" | null>(null);
  const [citaRapidaAnimalId, setCitaRapidaAnimalId] = useState<string | null>(null);
  const [historialAnimalId, setHistorialAnimalId] = useState<string | null>(null);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [veterinarios, setVeterinarios] = useState<Veterinario[] | null>(null);

  const usuarioActual = sesion ? usuarios.find((u) => u.id === sesion.usuarioId) : undefined;
  const esEmpresa = usuarioActual?.tipo === "empresa";
  const tienePremium = usuarioActual?.plan === "premium";
  const tienePro = Boolean(usuarioActual?.rumiPro);
  const hato = usuarioActual?.hato ?? [];

  const animalEnEdicion =
    animalEnEdicionId && animalEnEdicionId !== "nueva"
      ? hato.find((a) => a.id === animalEnEdicionId)
      : undefined;
  const citaRapidaAnimal = citaRapidaAnimalId ? hato.find((a) => a.id === citaRapidaAnimalId) ?? null : null;
  const historialAnimal = historialAnimalId ? hato.find((a) => a.id === historialAnimalId) ?? null : null;

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
    const actualizado = registrarSnapshot({ ...usuarioActual, hato: nuevoHato });
    actualizarUsuario(actualizado);
    const { upsertUsuarioDb } = await import("@/lib/usuariosDb");
    void upsertUsuarioDb(actualizado);
  }

  // Recordatorio real (campanita) para citas pendientes dentro de 3 días, una
  // sola vez por cita (marca recordatorioEnviado para no repetirlo en cada carga).
  useEffect(() => {
    if (!usuarioActual || hato.length === 0) return;
    const pendientes = citasPorRecordar(hato, 3);
    if (pendientes.length === 0) return;
    let cancelado = false;
    (async () => {
      const { crearNotificacionDb } = await import("@/lib/notificacionesDb");
      const idsNotificadas = new Set<string>();
      for (const { animal, cita } of pendientes) {
        const ok = await crearNotificacionDb({
          usuarioId: usuarioActual.id,
          tipo: "cita_veterinaria",
          titulo: `Cita próxima: ${animal.nombre}`,
          descripcion: `${TIPOS_CITA[cita.tipo]} el ${cita.fecha}${
            cita.veterinarioNombre ? ` con ${cita.veterinarioNombre}` : ""
          }.`,
          referenciaId: animal.id,
        });
        if (ok) idsNotificadas.add(cita.id);
      }
      if (cancelado || idsNotificadas.size === 0) return;
      void guardarHato(
        hato.map((a) => ({
          ...a,
          citas: (a.citas ?? []).map((c) =>
            idsNotificadas.has(c.id) ? { ...c, recordatorioEnviado: true } : c
          ),
        }))
      );
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioActual, hato]);

  function guardarAnimal(animal: AnimalHato) {
    const yaExiste = hato.some((a) => a.id === animal.id);
    void guardarHato(yaExiste ? hato.map((a) => (a.id === animal.id ? animal : a)) : [...hato, animal]);
    setAnimalEnEdicionId(null);
  }

  function eliminarAnimal(id: string) {
    void guardarHato(hato.filter((a) => a.id !== id));
  }

  function cambiarEstado(id: string, estado: AnimalHato["estado"]) {
    void guardarHato(hato.map((a) => (a.id === id ? { ...a, estado } : a)));
  }

  function actualizarCitasDeAnimal(animalId: string, nuevasCitas: AnimalHato["citas"]) {
    void guardarHato(hato.map((a) => (a.id === animalId ? { ...a, citas: nuevasCitas } : a)));
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
      <PantallaCargando />
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
  const alertas = hato
    .map((a) => ({ animal: a, fecha: proximaRevisionDe(a) }))
    .filter((x): x is { animal: AnimalHato; fecha: string } => x.fecha !== null && diasHasta(x.fecha) <= 14);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-linear-to-br from-moorcado-brown to-moorcado-gray-dark p-6 text-white sm:p-8">
        <div>
          <PremiumBadge>Módulo Premium{tienePro ? " · Pro activo" : ""}</PremiumBadge>
          <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Rumi</h1>
          <p className="mt-1 max-w-lg text-sm text-white/80">
            El administrador inteligente de tu hato: salud, producción,
            reproducción y trazabilidad en un solo lugar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAnimalEnEdicionId("nueva")}
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
          <button
            onClick={() => usuarioActual && void generarPdfHato(usuarioActual, hato, { resumenEjecutivo: tienePro })}
            disabled={hato.length === 0}
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/30 disabled:opacity-40"
          >
            <FileText className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Wallet} label="Valor del hato" value={formatLempiras(valorTotal)} accent="gold" />
        <StatCard icon={HeartPulse} label="Animales registrados" value={hato.length} />
        <StatCard icon={Milk} label="Producción diaria" value={`${produccionTotal} L`} accent="brown" />
        <StatCard icon={Bell} label="Revisiones próximas" value={alertas.length} accent="gold" />
      </div>

      <HatoProduccionChart historial={usuarioActual?.hatoHistorial ?? []} />

      {alertas.length > 0 && (
        <section className="mt-6 rounded-2xl bg-moorcado-gold/10 p-5 ring-1 ring-moorcado-gold/30">
          <h2 className="flex items-center gap-2 font-display font-bold text-moorcado-brown">
            <Bell className="h-5 w-5" /> Alertas y próximas revisiones
          </h2>
          <ul className="mt-3 space-y-2">
            {alertas.map(({ animal, fecha }) => (
              <li key={animal.id} className="flex items-center justify-between text-sm text-moorcado-gray-dark">
                <span>
                  <strong>{animal.nombre}</strong> — revisión el {fecha}
                </span>
                <span className="text-xs font-semibold text-moorcado-brown">
                  {diasHasta(fecha) <= 0 ? "Vencida" : `en ${diasHasta(fecha)} días`}
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
        <HatoTable
          hato={hato}
          onCambiarEstado={cambiarEstado}
          onEditar={(a) => setAnimalEnEdicionId(a.id)}
          onEliminar={eliminarAnimal}
          onAgendarCita={(a) => setCitaRapidaAnimalId(a.id)}
          onVerHistorial={(a) => setHistorialAnimalId(a.id)}
        />
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

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <RumiTool
            icon={Stethoscope}
            title="Directorio de veterinarios"
            desc="Contacta veterinarios verificados cerca de tu operación, y asígnalos a las citas de tus animales."
            bloqueada={!tienePro}
            onClick={tienePro ? undefined : () => setMostrarModalPago(true)}
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
                      <p className="flex flex-wrap items-center gap-1.5 truncate text-sm font-semibold text-moorcado-gray-dark">
                        {v.nombre}
                        {v.verificado && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-moorcado-green" />}
                      </p>
                      <p className="truncate text-xs text-moorcado-gray-dark/60">
                        {v.especialidad} · {v.departamento}
                      </p>
                      {v.correo && (
                        <p className="flex items-center gap-1 truncate text-xs text-moorcado-gray-dark/50">
                          <Mail className="h-3 w-3 shrink-0" />
                          {v.correo}
                        </p>
                      )}
                    </div>
                    <a
                      href={telefonoAWhatsappUrl(v.telefono)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-moorcado-green px-3 py-1.5 text-xs font-bold text-white"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {animalEnEdicionId && (
        <HatoAnimalModal
          animalInicial={animalEnEdicion}
          onGuardar={guardarAnimal}
          onCerrar={() => setAnimalEnEdicionId(null)}
        />
      )}

      {mostrarModalPago && (
        <PagoRumiProModal
          onCancelar={() => setMostrarModalPago(false)}
          onConfirmar={activarRumiPro}
        />
      )}

      {citaRapidaAnimal && (
        <CitaModal
          animal={citaRapidaAnimal}
          veterinarios={veterinarios}
          onGuardar={(cita) => {
            actualizarCitasDeAnimal(citaRapidaAnimal.id, [...(citaRapidaAnimal.citas ?? []), cita]);
            setCitaRapidaAnimalId(null);
          }}
          onCerrar={() => setCitaRapidaAnimalId(null)}
        />
      )}

      {historialAnimal && (
        <HistorialAnimalPanel
          animal={historialAnimal}
          veterinarios={veterinarios}
          onActualizarCitas={(citas) => actualizarCitasDeAnimal(historialAnimal.id, citas)}
          onCerrar={() => setHistorialAnimalId(null)}
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
  icon: typeof Stethoscope;
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
