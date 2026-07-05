"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Baby,
  Bell,
  Crown,
  HeartPulse,
  Milk,
  Plus,
  Stethoscope,
  Syringe,
  Wallet,
  X,
} from "lucide-react";
import { hato as hatoInicial } from "@/lib/mock-data";
import { formatLempiras } from "@/lib/format";
import type { AnimalHato } from "@/lib/types";
import StatCard from "@/components/StatCard";

const HOY = new Date("2026-06-30");

const ESTADOS: Record<AnimalHato["estado"], { label: string; cls: string }> = {
  sana: { label: "Sana", cls: "bg-moorcado-green/10 text-moorcado-green" },
  en_tratamiento: { label: "En tratamiento", cls: "bg-red-100 text-red-600" },
  prenada: { label: "Preñada", cls: "bg-moorcado-gold/15 text-moorcado-brown" },
  seca: { label: "Seca", cls: "bg-moorcado-gray-light text-moorcado-gray-dark/70" },
};

function diasHasta(fecha: string) {
  return Math.round((new Date(fecha).getTime() - HOY.getTime()) / 86_400_000);
}

export default function RumiPage() {
  const [hato, setHato] = useState<AnimalHato[]>(hatoInicial);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");

  const valorTotal = hato.reduce((acc, a) => acc + a.valorEstimado, 0);
  const produccionTotal = hato.reduce((acc, a) => acc + (a.produccionLitrosDia ?? 0), 0);
  const alertas = hato.filter((a) => diasHasta(a.proximaRevision) <= 14);

  function registrarAnimal(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreNuevo.trim()) return;
    setHato((prev) => [
      ...prev,
      {
        id: `h${prev.length + 1}`,
        nombre: nombreNuevo,
        raza: "Sin especificar",
        edadMeses: 12,
        estado: "sana",
        proximaRevision: "2026-08-15",
        ultimaVacuna: "2026-06-01",
        valorEstimado: 25000,
      },
    ]);
    setNombreNuevo("");
    setMostrarModal(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-moorcado-brown to-moorcado-gray-dark p-6 text-white sm:p-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-moorcado-gold px-3 py-1 text-xs font-bold">
            <Crown className="h-3.5 w-3.5" />
            Módulo Premium
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Rumi</h1>
          <p className="mt-1 max-w-lg text-sm text-white/80">
            El administrador inteligente de tu hato: salud, producción,
            reproducción y trazabilidad en un solo lugar.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-moorcado-gold px-4 py-2.5 text-sm font-bold text-moorcado-gray-dark"
          >
            <Plus className="h-4 w-4" />
            Registrar Animal
          </button>
          <Link
            href="/mensajes"
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/30"
          >
            <Stethoscope className="h-4 w-4" />
            Contactar veterinario
          </Link>
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
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full min-w-[720px] text-left text-sm">
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
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADOS[a.estado].cls}`}>
                      {ESTADOS[a.estado].label}
                    </span>
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
      </section>

      <section className="mt-8 grid gap-5 sm:grid-cols-3">
        <RumiTool icon={Syringe} title="Vacunas y desparasitaciones" desc="Registra y programa tratamientos preventivos." />
        <RumiTool icon={Baby} title="Reproducción y partos" desc="Lleva el control de montas, preñeces y nacimientos." />
        <RumiTool icon={Stethoscope} title="Historial médico" desc="Consulta el historial clínico completo de cada animal." />
      </section>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={registrarAnimal}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-moorcado-gray-dark">
                Registrar animal en Rumi
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5 text-moorcado-gray-dark/60" />
              </button>
            </div>
            <label className="mt-4 block">
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
            <button
              type="submit"
              className="mt-5 w-full rounded-full bg-moorcado-green py-3 text-sm font-bold text-white"
            >
              Registrar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function RumiTool({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Syringe;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-moorcado-brown/10 text-moorcado-brown">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 font-display font-semibold text-moorcado-gray-dark">{title}</h3>
      <p className="mt-1 text-sm text-moorcado-gray-dark/60">{desc}</p>
    </div>
  );
}
