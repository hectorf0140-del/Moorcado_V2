"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Ban,
  Check,
  ChevronDown,
  FileWarning,
  Flag,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import type { Anuncio, PlanId, Usuario } from "@/lib/types";
import { formatEdad, formatLempiras } from "@/lib/format";
import { VentasChart, VisualizacionesChart, ultimosMeses } from "@/components/DashboardCharts";
import type { Reporte } from "@/lib/reportesDb";
import StatCard from "@/components/StatCard";

const TABS = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "publicaciones", label: "Publicaciones", icon: BadgeCheck },
  { id: "reportes", label: "Reportes", icon: Flag },
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
  const { adminSesion, loading } = useAdminAuthGuard();
  const logoutAdmin = useAppStore((s) => s.logoutAdmin);
  const usuarios = useAppStore((s) => s.usuarios);
  const anuncios = useAppStore((s) => s.anuncios);
  const transacciones = useAppStore((s) => s.transacciones);
  const actualizarUsuario = useAppStore((s) => s.actualizarUsuario);
  const actualizarAnuncio = useAppStore((s) => s.actualizarAnuncio);

  const [tab, setTab] = useState<TabId>("resumen");
  const [busquedaUsuarios, setBusquedaUsuarios] = useState("");
  const [busquedaPublicaciones, setBusquedaPublicaciones] = useState("");
  const [usuarioExpandido, setUsuarioExpandido] = useState<string | null>(null);
  const [publicacionExpandida, setPublicacionExpandida] = useState<string | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargandoReportes, setCargandoReportes] = useState(true);

  useEffect(() => {
    if (!adminSesion) return;
    let cancelado = false;
    import("@/lib/reportesDb").then(({ fetchReportes }) =>
      fetchReportes().then((r) => {
        if (!cancelado) {
          setReportes(r ?? []);
          setCargandoReportes(false);
        }
      })
    );
    return () => {
      cancelado = true;
    };
  }, [adminSesion]);

  const ahora = new Date();
  const ingresosDelMes = transacciones
    .filter((t) => {
      const f = new Date(t.fecha);
      return f.getFullYear() === ahora.getFullYear() && f.getMonth() === ahora.getMonth();
    })
    .reduce((acc, t) => acc + Math.round(t.precio * 0.025), 0);

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
      .reduce((acc, t) => acc + Math.round(t.precio * 0.025), 0);
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

  const reportesPendientes = reportes.filter((r) => r.estado === "pendiente");

  const usuariosFiltrados = usuarios
    .filter((u) => {
      const q = busquedaUsuarios.trim().toLowerCase();
      if (!q) return true;
      return (
        (u.nombre ?? "").toLowerCase().includes(q) ||
        (u.correo ?? "").toLowerCase().includes(q) ||
        (u.tipo ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => Number(b.verificacionSolicitada) - Number(a.verificacionSolicitada));

  const publicacionesFiltradas = anuncios.filter((a) => {
    const q = busquedaPublicaciones.trim().toLowerCase();
    if (!q) return true;
    const vendedor = usuarios.find((u) => u.id === a.vendedorId);
    return (
      (a.nombre ?? "").toLowerCase().includes(q) ||
      (a.titulo ?? "").toLowerCase().includes(q) ||
      (a.raza ?? "").toLowerCase().includes(q) ||
      (vendedor?.nombre ?? "").toLowerCase().includes(q)
    );
  });

  function handleLogout() {
    logoutAdmin();
    router.push("/admin/login");
  }

  async function verificarUsuario(usuario: Usuario) {
    const actualizado = { ...usuario, verificado: true, verificacionSolicitada: false };
    actualizarUsuario(actualizado);
    const { upsertUsuarioDb } = await import("@/lib/usuariosDb");
    void upsertUsuarioDb(actualizado);
  }

  async function rechazarVerificacion(usuario: Usuario) {
    const actualizado = { ...usuario, verificacionSolicitada: false };
    actualizarUsuario(actualizado);
    const { upsertUsuarioDb } = await import("@/lib/usuariosDb");
    void upsertUsuarioDb(actualizado);
  }

  async function toggleActivoAnuncio(anuncio: Anuncio) {
    const actualizado = { ...anuncio, activo: anuncio.activo === false };
    actualizarAnuncio(actualizado);
    const { upsertAnuncioDb } = await import("@/lib/anunciosDb");
    void upsertAnuncioDb(actualizado);
  }

  async function cambiarEstadoReporte(id: string, estado: "resuelto" | "descartado") {
    setReportes((prev) => prev.map((r) => (r.id === id ? { ...r, estado } : r)));
    const { actualizarEstadoReporteDb } = await import("@/lib/reportesDb");
    void actualizarEstadoReporteDb(id, estado);
  }

  if (loading || !adminSesion) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-moorcado-gray-dark border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
            Panel de Administración
          </h1>
          <p className="text-moorcado-gray-dark/60">
            Modera usuarios, publicaciones y gestiona la plataforma Moorcado.
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Users} label="Usuarios totales" value={usuarios.length} />
            <StatCard
              icon={BadgeCheck}
              label="Publicaciones activas"
              value={anuncios.filter((a) => a.activo !== false).length}
              accent="gold"
            />
            <StatCard icon={Wallet} label="Ingresos del mes" value={formatLempiras(ingresosDelMes)} accent="brown" />
            <StatCard icon={Flag} label="Reportes pendientes" value={reportesPendientes.length} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h3 className="mb-3 font-display font-bold text-moorcado-gray-dark">
                Ingresos por mes (comisiones reales)
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

      {tab === "usuarios" && (
        <section className="mt-6 space-y-4">
          <BuscadorInput
            value={busquedaUsuarios}
            onChange={setBusquedaUsuarios}
            placeholder="Buscar por nombre, correo o tipo..."
          />
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-moorcado-gray-dark">
                Usuarios ({usuariosFiltrados.length})
              </h2>
              <p className="text-xs text-moorcado-gray-dark/50">
                Los que solicitaron verificación aparecen primero
              </p>
            </div>
            {usuariosFiltrados.length === 0 ? (
              <p className="mt-3 text-sm text-moorcado-gray-dark/50">
                No se encontraron usuarios.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {usuariosFiltrados.map((u) => {
                  const expandido = usuarioExpandido === u.id;
                  return (
                    <li key={u.id} className="rounded-xl bg-moorcado-gray-light">
                      <button
                        onClick={() => setUsuarioExpandido(expandido ? null : u.id)}
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
                            </p>
                            <p className="text-xs capitalize text-moorcado-gray-dark/60">
                              {u.tipo} · {u.departamento || "sin departamento"}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-moorcado-gray-dark/40 transition-transform ${
                            expandido ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {expandido && (
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
                          {!u.verificado && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => verificarUsuario(u)}
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moorcado-green/10 py-2 text-xs font-bold text-moorcado-green hover:bg-moorcado-green/20"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Verificar
                              </button>
                              <button
                                onClick={() => rechazarVerificacion(u)}
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-100 py-2 text-xs font-bold text-red-600 hover:bg-red-200"
                              >
                                <X className="h-3.5 w-3.5" />
                                Rechazar solicitud
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}

      {tab === "publicaciones" && (
        <section className="mt-6 space-y-4">
          <BuscadorInput
            value={busquedaPublicaciones}
            onChange={setBusquedaPublicaciones}
            placeholder="Buscar por nombre, raza o vendedor..."
          />
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="font-display font-bold text-moorcado-gray-dark">
              Publicaciones ({publicacionesFiltradas.length})
            </h2>
            {publicacionesFiltradas.length === 0 ? (
              <p className="mt-3 text-sm text-moorcado-gray-dark/50">
                No se encontraron publicaciones.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {publicacionesFiltradas.map((a) => {
                  const expandido = publicacionExpandida === a.id;
                  const vendedor = usuarios.find((u) => u.id === a.vendedorId);
                  const desactivada = a.activo === false;
                  return (
                    <li key={a.id} className="rounded-xl bg-moorcado-gray-light">
                      <button
                        onClick={() => setPublicacionExpandida(expandido ? null : a.id)}
                        className="flex w-full items-center justify-between gap-3 p-3 text-left"
                      >
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-moorcado-gray-dark">
                            {a.nombre} · {a.raza}
                            {desactivada && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                Desactivada
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-moorcado-gray-dark/60">
                            {formatLempiras(a.precio)} · {a.departamento} · {vendedor?.nombre ?? a.vendedorId}
                          </p>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-moorcado-gray-dark/40 transition-transform ${
                            expandido ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {expandido && (
                        <div className="space-y-3 border-t border-black/5 px-3 pb-3 pt-3">
                          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                            <Campo label="Título" valor={a.titulo} />
                            <Campo label="Edad" valor={formatEdad(a.edadMeses)} />
                            <Campo label="Peso" valor={`${a.pesoKg} kg`} />
                            <Campo label="Sexo" valor={a.sexo} />
                            <Campo label="Registro SAG" valor={a.registroSag ? "Sí" : "No"} />
                            <Campo label="Fotos" valor={String(a.imagenes?.length ?? 0)} />
                            <Campo label="Vistas" valor={String(a.vistas)} />
                            <Campo
                              label="Publicado"
                              valor={new Date(a.creadoEn).toLocaleDateString("es-HN")}
                            />
                          </div>
                          {a.descripcion && (
                            <p className="rounded-lg bg-white p-2.5 text-xs text-moorcado-gray-dark/70">
                              {a.descripcion}
                            </p>
                          )}
                          <button
                            onClick={() => toggleActivoAnuncio(a)}
                            className={`flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold ${
                              desactivada
                                ? "bg-moorcado-green/10 text-moorcado-green hover:bg-moorcado-green/20"
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
                          >
                            {desactivada ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Reactivar publicación
                              </>
                            ) : (
                              <>
                                <Ban className="h-3.5 w-3.5" />
                                Desactivar publicación
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}

      {tab === "reportes" && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="flex items-center gap-2 font-display font-bold text-moorcado-gray-dark">
            <FileWarning className="h-5 w-5 text-red-500" />
            Reportes de la comunidad
          </h2>
          <p className="mt-1 text-xs text-moorcado-gray-dark/50">
            Reportes enviados por compradores sobre publicaciones o
            conversaciones de chat (por ejemplo, hostigamiento).
          </p>

          {cargandoReportes ? (
            <p className="mt-3 text-sm text-moorcado-gray-dark/50">Cargando reportes...</p>
          ) : reportesPendientes.length === 0 ? (
            <p className="mt-3 text-sm text-moorcado-gray-dark/50">
              No hay reportes pendientes.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {reportesPendientes.map((r) => {
                const autor = usuarios.find((u) => u.id === r.autorId);
                return (
                  <li key={r.id} className="rounded-xl bg-moorcado-gray-light p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-moorcado-gray-dark">
                          {r.motivo}
                          <span className="rounded-full bg-moorcado-gray-dark/10 px-2 py-0.5 text-[10px] font-bold capitalize text-moorcado-gray-dark/70">
                            {r.tipo}
                          </span>
                        </p>
                        <p className="text-xs text-moorcado-gray-dark/50">
                          Reportado por {autor?.nombre ?? "un usuario"} ·{" "}
                          {new Date(r.creadoEn).toLocaleDateString("es-HN")}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <ActionBtn
                          icon={Check}
                          variant="approve"
                          onClick={() => cambiarEstadoReporte(r.id, "resuelto")}
                        />
                        <ActionBtn
                          icon={X}
                          variant="reject"
                          onClick={() => cambiarEstadoReporte(r.id, "descartado")}
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-moorcado-gray-dark/60">{r.detalle}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "planes" && (
        <div className="mt-6 space-y-6">
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

function BuscadorInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/10">
      <Search className="h-4 w-4 text-moorcado-gray-dark/50" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-moorcado-gray-dark/40"
      />
    </label>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-lg bg-white p-2">
      <p className="text-[10px] uppercase text-moorcado-gray-dark/40">{label}</p>
      <p className="truncate font-medium text-moorcado-gray-dark">{valor}</p>
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
