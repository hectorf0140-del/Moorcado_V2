"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Crown,
  FileWarning,
  Gavel,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import { PantallaCargando } from "@/components/Spinner";
import type { PlanId } from "@/lib/types";
import { formatLempiras } from "@/lib/format";
import { calcularComision } from "@/lib/comision";
import { VentasChart, VisualizacionesChart, ultimosMeses } from "@/components/DashboardCharts";
import StatCard from "@/components/StatCard";
import UsuariosTab from "@/components/moderacion/UsuariosTab";
import PublicacionesTab from "@/components/moderacion/PublicacionesTab";
import ReportesTab from "@/components/moderacion/ReportesTab";
import ApelacionesTab from "@/components/moderacion/ApelacionesTab";
import ExportarReportes from "@/components/moderacion/ExportarReportes";

const TABS = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "publicaciones", label: "Publicaciones", icon: BadgeCheck },
  { id: "reportes", label: "Reportes", icon: FileWarning },
  { id: "apelaciones", label: "Apelaciones", icon: Gavel },
  { id: "planes", label: "Planes y pagos", icon: Wallet },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PLANES: { id: PlanId; nombre: string }[] = [
  { id: "gratuito", nombre: "Gratuito" },
  { id: "basico", nombre: "Básico" },
  { id: "premium", nombre: "Premium" },
];

const PRECIOS_PLAN: Record<PlanId, number> = { gratuito: 0, basico: 349, premium: 799 };

export default function AdminClient() {
  const router = useRouter();
  const { adminSesion, loading } = useAdminAuthGuard("super_admin");
  const logoutAdmin = useAppStore((s) => s.logoutAdmin);
  const usuarios = useAppStore((s) => s.usuarios);
  const anuncios = useAppStore((s) => s.anuncios);
  const transacciones = useAppStore((s) => s.transacciones);

  const [tab, setTab] = useState<TabId>("resumen");
  const [reportesPendientes, setReportesPendientes] = useState(0);

  useEffect(() => {
    if (!adminSesion) return;
    let cancelado = false;
    import("@/lib/reportesDb").then(({ fetchReportes }) =>
      fetchReportes().then((r) => {
        if (!cancelado) {
          setReportesPendientes((r ?? []).filter((x) => x.estado === "pendiente").length);
        }
      })
    );
    return () => {
      cancelado = true;
    };
  }, [adminSesion]);

  const usuariosPremium = usuarios.filter((u) => u.plan === "premium");
  const empresasSinPremium = usuarios.filter((u) => u.tipo === "empresa" && u.plan !== "premium");

  const ahora = new Date();
  const ingresosDelMes = transacciones
    .filter((t) => {
      const f = new Date(t.fecha);
      return f.getFullYear() === ahora.getFullYear() && f.getMonth() === ahora.getMonth();
    })
    .reduce((acc, t) => acc + calcularComision(t.precio, "gratuito"), 0);

  const etiquetasMeses = ultimosMeses(6);
  const ingresosPorMes = etiquetasMeses.map((mes, i) => {
    const fechaMes = new Date();
    fechaMes.setMonth(fechaMes.getMonth() - (5 - i));
    const valor = transacciones
      .filter((t) => {
        const f = new Date(t.fecha);
        return (
          f.getFullYear() === fechaMes.getFullYear() && f.getMonth() === fechaMes.getMonth()
        );
      })
      .reduce((acc, t) => acc + calcularComision(t.precio, "gratuito"), 0);
    return { mes, valor };
  });
  const usuariosNuevosPorMes = etiquetasMeses.map((mes, i) => {
    const fechaMes = new Date();
    fechaMes.setMonth(fechaMes.getMonth() - (5 - i));
    const valor = usuarios.filter((u) => {
      if (!u.creadoEn) return false;
      const f = new Date(u.creadoEn);
      return f.getFullYear() === fechaMes.getFullYear() && f.getMonth() === fechaMes.getMonth();
    }).length;
    return { mes, valor };
  });

  function handleLogout() {
    logoutAdmin();
    router.push("/admin/login");
  }

  if (loading || !adminSesion) {
    return (
      <PantallaCargando color="gris" />
    );
  }

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
            Panel de Administración
          </h1>
          <p className="text-moorcado-gray-dark/60">
            Métricas de la plataforma y todas las herramientas de moderación.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-moorcado-gray-dark/70">{adminSesion.nombre}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full bg-moorcado-gray-light px-4 py-2 text-sm font-semibold text-moorcado-gray-dark hover:bg-moorcado-gray-light/70"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>

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
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl bg-linear-to-r from-moorcado-green to-moorcado-green-light p-5 text-white shadow-sm">
            <p className="font-display text-lg font-bold">¡Todo en orden, {adminSesion.nombre}!</p>
            <p className="mt-0.5 text-sm text-white/80">
              Así va Moorcado hoy — usuarios, publicaciones y comisiones reales.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Users} label="Usuarios totales" value={usuarios.length} accent="green" />
            <StatCard
              icon={BadgeCheck}
              label="Publicaciones activas"
              value={anuncios.filter((a) => a.activo !== false).length}
              accent="gold"
            />
            <StatCard icon={Wallet} label="Ingresos del mes" value={formatLempiras(ingresosDelMes)} accent="brown" />
            <StatCard icon={FileWarning} label="Reportes pendientes" value={reportesPendientes} accent="gray" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl bg-linear-to-br from-moorcado-green/10 via-white to-white p-5 shadow-sm ring-1 ring-moorcado-green/10">
              <h3 className="mb-3 flex items-center gap-2 font-display font-bold text-moorcado-gray-dark">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moorcado-green/15 text-moorcado-green">
                  <Wallet className="h-4 w-4" />
                </span>
                Ingresos por mes (comisiones reales)
              </h3>
              <VentasChart data={ingresosPorMes} />
            </div>
            <div className="rounded-2xl bg-linear-to-br from-moorcado-gold/10 via-white to-white p-5 shadow-sm ring-1 ring-moorcado-gold/15">
              <h3 className="mb-3 flex items-center gap-2 font-display font-bold text-moorcado-gray-dark">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moorcado-gold/15 text-moorcado-brown">
                  <Users className="h-4 w-4" />
                </span>
                Usuarios nuevos por mes
              </h3>
              <VisualizacionesChart data={usuariosNuevosPorMes} />
            </div>
          </div>
        </div>
      )}

      {tab === "usuarios" && <div className="mt-6"><UsuariosTab token={adminSesion.token} /></div>}

      {tab === "publicaciones" && <div className="mt-6"><PublicacionesTab token={adminSesion.token} /></div>}

      {tab === "reportes" && (
        <div className="mt-6">
          <ReportesTab token={adminSesion.token} />
        </div>
      )}

      {tab === "apelaciones" && (
        <div className="mt-6">
          <ApelacionesTab token={adminSesion.token} />
        </div>
      )}

      {tab === "planes" && (
        <div className="mt-6 space-y-6">
          <ExportarReportes transacciones={transacciones} usuarios={usuarios} anuncios={anuncios} />

          <section className="grid gap-4 sm:grid-cols-3">
            {PLANES.map((p) => {
              const cantidad = usuarios.filter((u) => u.plan === p.id).length;
              return (
                <div key={p.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <p className="flex items-center gap-1.5 font-display font-bold text-moorcado-gray-dark">
                    <ShieldCheck className="h-4 w-4 text-moorcado-green" />
                    {p.nombre}
                  </p>
                  <p className="mt-2 text-sm text-moorcado-gray-dark/60">
                    {cantidad} usuarios activos
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-moorcado-green">
                    {formatLempiras(cantidad * PRECIOS_PLAN[p.id])}
                    <span className="text-xs font-normal text-moorcado-gray-dark/50">/mes</span>
                  </p>
                </div>
              );
            })}
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h3 className="flex items-center gap-1.5 font-display font-bold text-moorcado-gray-dark">
                <Crown className="h-4 w-4 text-moorcado-gold" />
                Usuarios con Premium ({usuariosPremium.length})
              </h3>
              {usuariosPremium.length === 0 ? (
                <p className="mt-3 text-sm text-moorcado-gray-dark/50">
                  Todavía nadie tiene el plan Premium.
                </p>
              ) : (
                <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {usuariosPremium.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-moorcado-gray-light px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-moorcado-gray-dark">
                          {u.nombre}
                        </p>
                        <p className="truncate text-xs text-moorcado-gray-dark/60">{u.correo}</p>
                      </div>
                      {u.fechaActivacionRumiPro && (
                        <span className="shrink-0 rounded-full bg-moorcado-gold/20 px-2 py-0.5 text-[10px] font-bold text-moorcado-brown">
                          + Rumi Pro
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h3 className="font-display font-bold text-moorcado-gray-dark">
                Cuentas Empresa sin Premium ({empresasSinPremium.length})
              </h3>
              <p className="mt-1 text-xs text-moorcado-gray-dark/50">
                Ven un recordatorio para suscribirse en todo el sitio hasta que lo hagan.
              </p>
              {empresasSinPremium.length === 0 ? (
                <p className="mt-3 text-sm text-moorcado-gray-dark/50">
                  Todas las cuentas Empresa ya tienen Premium.
                </p>
              ) : (
                <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {empresasSinPremium.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-moorcado-gray-light px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-moorcado-gray-dark">
                          {u.nombre}
                        </p>
                        <p className="truncate text-xs text-moorcado-gray-dark/60">{u.correo}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold capitalize text-moorcado-gray-dark/60 ring-1 ring-black/10">
                        {u.plan}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Wallet}
              label="Ingresos recurrentes proyectados"
              value={formatLempiras(
                usuarios.reduce((acc, u) => acc + PRECIOS_PLAN[u.plan], 0)
              )}
              accent="gold"
            />
            <StatCard
              icon={BadgeCheck}
              label="Comisiones del mes (ventas reales)"
              value={formatLempiras(ingresosDelMes)}
              accent="brown"
            />
            <StatCard
              icon={Users}
              label="Tasa de conversión a plan pago"
              value={
                usuarios.length > 0
                  ? `${Math.round((usuarios.filter((u) => u.plan !== "gratuito").length / usuarios.length) * 100)}%`
                  : "—"
              }
            />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h3 className="mb-3 font-display font-bold text-moorcado-gray-dark">
                Comisiones reales por mes
              </h3>
              <VentasChart data={ingresosPorMes} />
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h3 className="mb-3 font-display font-bold text-moorcado-gray-dark">
                Usuarios nuevos por mes
              </h3>
              <VisualizacionesChart data={usuariosNuevosPorMes} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
