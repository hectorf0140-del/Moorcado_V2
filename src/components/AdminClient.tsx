"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Check,
  FileWarning,
  Flag,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { animales, usuarios } from "@/lib/mock-data";
import { formatLempiras } from "@/lib/format";
import StatCard from "@/components/StatCard";

const TABS = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "publicaciones", label: "Publicaciones", icon: BadgeCheck },
  { id: "reportes", label: "Reportes", icon: Flag },
  { id: "planes", label: "Planes y pagos", icon: Wallet },
] as const;

type TabId = (typeof TABS)[number]["id"];

const reportesIniciales = [
  {
    id: "r1",
    motivo: "Precio sospechoso",
    detalle: "Publicación 'Trueno' reportada por precio fuera de mercado.",
    estado: "pendiente" as const,
  },
  {
    id: "r2",
    motivo: "Información falsa",
    detalle: "Usuario reporta datos de vacunación inconsistentes.",
    estado: "pendiente" as const,
  },
];

export default function AdminClient() {
  const [tab, setTab] = useState<TabId>("resumen");
  const [pendientesVerificacion, setPendientesVerificacion] = useState(
    usuarios.filter((u) => !u.verificado)
  );
  const [pendientesPublicacion, setPendientesPublicacion] = useState(
    animales.filter((a) => !a.registroSag).slice(0, 3)
  );
  const [reportes, setReportes] = useState(reportesIniciales);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
        Panel de Administración
      </h1>
      <p className="text-moorcado-gray-dark/60">
        Modera usuarios, publicaciones y gestiona la plataforma Moorcado.
      </p>

      <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              tab === id
                ? "bg-moorcado-green text-white"
                : "bg-white text-moorcado-gray-dark ring-1 ring-black/10"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "resumen" && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Users} label="Usuarios totales" value={usuarios.length + 214} />
          <StatCard icon={BadgeCheck} label="Publicaciones activas" value={animales.length + 58} accent="gold" />
          <StatCard icon={Wallet} label="Ingresos del mes" value="L. 128,400" accent="brown" />
          <StatCard icon={Flag} label="Reportes pendientes" value={reportes.filter((r) => r.estado === "pendiente").length} />
        </div>
      )}

      {tab === "usuarios" && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display font-bold text-moorcado-gray-dark">
            Vendedores pendientes de verificación
          </h2>
          {pendientesVerificacion.length === 0 ? (
            <p className="mt-3 text-sm text-moorcado-gray-dark/50">
              No hay usuarios pendientes.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {pendientesVerificacion.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-moorcado-gray-light p-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: u.avatarColor }}
                    >
                      {u.iniciales}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-moorcado-gray-dark">
                        {u.nombre}
                      </p>
                      <p className="text-xs capitalize text-moorcado-gray-dark/60">
                        {u.tipo} · {u.departamento}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ActionBtn
                      icon={Check}
                      variant="approve"
                      onClick={() =>
                        setPendientesVerificacion((prev) =>
                          prev.filter((x) => x.id !== u.id)
                        )
                      }
                    />
                    <ActionBtn
                      icon={X}
                      variant="reject"
                      onClick={() =>
                        setPendientesVerificacion((prev) =>
                          prev.filter((x) => x.id !== u.id)
                        )
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "publicaciones" && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display font-bold text-moorcado-gray-dark">
            Publicaciones pendientes de aprobación
          </h2>
          {pendientesPublicacion.length === 0 ? (
            <p className="mt-3 text-sm text-moorcado-gray-dark/50">
              No hay publicaciones pendientes.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {pendientesPublicacion.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-moorcado-gray-light p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-moorcado-gray-dark">
                      {a.nombre} · {a.raza}
                    </p>
                    <p className="text-xs text-moorcado-gray-dark/60">
                      {formatLempiras(a.precio)} · {a.departamento}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <ActionBtn
                      icon={Check}
                      variant="approve"
                      onClick={() =>
                        setPendientesPublicacion((prev) =>
                          prev.filter((x) => x.id !== a.id)
                        )
                      }
                    />
                    <ActionBtn
                      icon={X}
                      variant="reject"
                      onClick={() =>
                        setPendientesPublicacion((prev) =>
                          prev.filter((x) => x.id !== a.id)
                        )
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "reportes" && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="flex items-center gap-2 font-display font-bold text-moorcado-gray-dark">
            <FileWarning className="h-5 w-5 text-red-500" />
            Reportes de contenido
          </h2>
          {reportes.length === 0 ? (
            <p className="mt-3 text-sm text-moorcado-gray-dark/50">
              No hay reportes pendientes.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {reportes.map((r) => (
                <li key={r.id} className="rounded-xl bg-moorcado-gray-light p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-moorcado-gray-dark">
                      {r.motivo}
                    </p>
                    <div className="flex gap-2">
                      <ActionBtn
                        icon={Check}
                        variant="approve"
                        onClick={() =>
                          setReportes((prev) => prev.filter((x) => x.id !== r.id))
                        }
                      />
                      <ActionBtn
                        icon={X}
                        variant="reject"
                        onClick={() =>
                          setReportes((prev) => prev.filter((x) => x.id !== r.id))
                        }
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-moorcado-gray-dark/60">{r.detalle}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "planes" && (
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { nombre: "Gratuito", usuarios: 412, ingreso: "L. 0" },
            { nombre: "Básico", usuarios: 96, ingreso: "L. 33,504" },
            { nombre: "Premium", usuarios: 41, ingreso: "L. 32,759" },
          ].map((p) => (
            <div key={p.nombre} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="flex items-center gap-1.5 font-display font-bold text-moorcado-gray-dark">
                <ShieldCheck className="h-4 w-4 text-moorcado-green" />
                {p.nombre}
              </p>
              <p className="mt-2 text-sm text-moorcado-gray-dark/60">
                {p.usuarios} usuarios activos
              </p>
              <p className="mt-1 font-display text-xl font-bold text-moorcado-green">
                {p.ingreso}
                <span className="text-xs font-normal text-moorcado-gray-dark/50">/mes</span>
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  variant,
  onClick,
}: {
  icon: typeof Check;
  variant: "approve" | "reject";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={variant}
      className={`flex h-8 w-8 items-center justify-center rounded-full ${
        variant === "approve"
          ? "bg-moorcado-green/10 text-moorcado-green hover:bg-moorcado-green/20"
          : "bg-red-100 text-red-600 hover:bg-red-200"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
