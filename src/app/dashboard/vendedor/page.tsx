"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Eye,
  FileStack,
  MessageCircle,
  ShoppingBag,
  CircleCheck,
  PackageOpen,
  Handshake,
  Square,
  Users,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import StatCard from "@/components/StatCard";
import AnimalCard from "@/components/AnimalCard";
import { VentasChart, VisualizacionesChart, ultimosMeses } from "@/components/DashboardCharts";
import GestionarAnuncio from "@/components/GestionarAnuncio";
import { esAnuncioVisible } from "@/lib/anuncios";

export default function DashboardVendedorPage() {
  const sesion = useAppStore((s) => s.sesion);
  const usuarios = useAppStore((s) => s.usuarios);
  const anuncios = useAppStore((s) => s.anuncios);
  const mensajes = useAppStore((s) => s.mensajes);
  const transacciones = useAppStore((s) => s.transacciones);
  const actualizarAnuncio = useAppStore((s) => s.actualizarAnuncio);

  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const usuario = sesion
    ? usuarios.find((u) => u.id === sesion.usuarioId)
    : undefined;
  const esEmpresa = usuario?.tipo === "empresa";

  const publicaciones = useMemo(
    () => (usuario ? anuncios.filter((a) => a.vendedorId === usuario.id) : []),
    [usuario, anuncios]
  );
  const disponibles = publicaciones.filter(esAnuncioVisible);
  const enNegociacion = publicaciones.filter((a) => !a.vendido && a.enNegociacion);
  const vendidos = publicaciones.filter((a) => a.vendido);
  const vistasTotales = publicaciones.reduce((acc, a) => acc + a.vistas, 0);

  const idsPublicaciones = new Set(publicaciones.map((a) => a.id));
  const mensajesRecibidos = usuario
    ? Object.values(mensajes).reduce((total, hilo) => {
        return (
          total +
          hilo.filter(
            (m) => m.animalId && idsPublicaciones.has(m.animalId) && m.autorId !== usuario.id
          ).length
        );
      }, 0)
    : 0;

  const etiquetasMeses = ultimosMeses(6);
  const ventasPorMes = usuario
    ? etiquetasMeses.map((mes, i) => {
        const fechaMes = new Date();
        fechaMes.setMonth(fechaMes.getMonth() - (5 - i));
        const ventasDelMes = transacciones.filter((t) => {
          if (t.vendedorId !== usuario.id) return false;
          const f = new Date(t.fecha);
          return (
            f.getFullYear() === fechaMes.getFullYear() &&
            f.getMonth() === fechaMes.getMonth()
          );
        }).length;
        return { mes, valor: ventasDelMes };
      })
    : etiquetasMeses.map((mes) => ({ mes, valor: 0 }));

  // Aún no registramos vistas por mes (solo el total acumulado por anuncio),
  // así que el historial mensual queda en cero hasta tener esa métrica real.
  const visualizacionesPorMes = etiquetasMeses.map((mes) => ({ mes, valor: 0 }));

  // Clientes (solo empresa): cada persona que ha escrito por alguna de mis
  // publicaciones, con cuántas publicaciones distintas preguntó y cuándo fue
  // el último mensaje — derivado directo del chat, sin tabla nueva.
  const clientes = useMemo(() => {
    if (!usuario || !esEmpresa) return [];
    const idsPropios = new Set(publicaciones.map((a) => a.id));
    const porCliente = new Map<
      string,
      { clienteId: string; animales: Set<string>; ultimoMensaje: string }
    >();
    for (const hilo of Object.values(mensajes)) {
      for (const m of hilo) {
        if (!m.animalId || !idsPropios.has(m.animalId)) continue;
        const clienteId = m.autorId === usuario.id ? m.destinatarioId : m.autorId;
        if (clienteId === usuario.id) continue;
        const actual = porCliente.get(clienteId);
        if (!actual) {
          porCliente.set(clienteId, {
            clienteId,
            animales: new Set([m.animalId]),
            ultimoMensaje: m.creadoEn,
          });
        } else {
          actual.animales.add(m.animalId);
          if (m.creadoEn > actual.ultimoMensaje) actual.ultimoMensaje = m.creadoEn;
        }
      }
    }
    return Array.from(porCliente.values())
      .map((c) => ({ ...c, usuario: usuarios.find((u) => u.id === c.clienteId) }))
      .filter((c) => c.usuario)
      .sort((a, b) => new Date(b.ultimoMensaje).getTime() - new Date(a.ultimoMensaje).getTime());
  }, [usuario, esEmpresa, mensajes, publicaciones, usuarios]);

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  function aplicarAccionLote(cambio: { vendido: boolean; enNegociacion: boolean; activo: boolean }) {
    for (const a of publicaciones) {
      if (!seleccionados.has(a.id)) continue;
      actualizarAnuncio({ ...a, ...cambio });
    }
    setSeleccionados(new Set());
    setModoSeleccion(false);
  }

  if (!usuario) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <p className="text-center text-base text-moorcado-gray-dark/70">
            Inicia sesión para ver tu panel de vendedor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
            Panel de Vendedor
          </h1>
          <p className="text-moorcado-gray-dark/60">
            Hola, {usuario.nombre}. Así va tu actividad en Moorcado.
          </p>
        </div>
        <Link
          href="/publicar"
          className="rounded-full bg-moorcado-green px-5 py-2.5 text-sm font-semibold text-white"
        >
          + Publicar Animal
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <StatCard icon={FileStack} label="Publicaciones" value={publicaciones.length} />
        <StatCard icon={Eye} label="Visualizaciones" value={vistasTotales} accent="gold" />
        <StatCard icon={MessageCircle} label="Mensajes recibidos" value={mensajesRecibidos} accent="brown" />
        <StatCard icon={ShoppingBag} label="Ventas" value={usuario.numeroVentas} />
        <StatCard icon={CircleCheck} label="Animales vendidos" value={vendidos.length} accent="gold" />
        <StatCard icon={PackageOpen} label="Disponibles" value={disponibles.length} accent="brown" />
        <StatCard icon={Handshake} label="En negociación" value={enNegociacion.length} />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display font-bold text-moorcado-gray-dark">
            Visualizaciones (últimos 6 meses)
          </h2>
          <VisualizacionesChart data={visualizacionesPorMes} />
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display font-bold text-moorcado-gray-dark">
            Ventas por mes
          </h2>
          <VentasChart data={ventasPorMes} />
        </div>
      </div>

      {esEmpresa && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-moorcado-gray-dark">
            <Users className="h-5 w-5 text-moorcado-brown" />
            Clientes
          </h2>
          {clientes.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-moorcado-gray-dark/50 shadow-sm ring-1 ring-black/5">
              Aún nadie te ha escrito por tus publicaciones.
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <table className="w-full text-left text-sm">
                <thead className="bg-moorcado-gray-light text-xs uppercase text-moorcado-gray-dark/60">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Publicaciones consultadas</th>
                    <th className="px-4 py-3">Último mensaje</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.clienteId} className="border-t border-black/5">
                      <td className="px-4 py-3 font-medium text-moorcado-gray-dark">
                        {c.usuario!.nombre}
                      </td>
                      <td className="px-4 py-3 text-moorcado-gray-dark/70">
                        {c.animales.size}
                      </td>
                      <td className="px-4 py-3 text-moorcado-gray-dark/70">
                        {new Date(c.ultimoMensaje).toLocaleDateString("es-HN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href="/mensajes" className="text-sm font-semibold text-moorcado-green">
                          Ver chat
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-moorcado-gray-dark">
            Mis publicaciones
          </h2>
          {esEmpresa && publicaciones.length > 0 && (
            <button
              onClick={() => {
                setModoSeleccion((v) => !v);
                setSeleccionados(new Set());
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                modoSeleccion
                  ? "bg-moorcado-gray-dark text-white"
                  : "bg-white text-moorcado-gray-dark ring-1 ring-black/10"
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              {modoSeleccion ? "Cancelar selección" : "Seleccionar varias"}
            </button>
          )}
        </div>

        {modoSeleccion && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-moorcado-gray-light p-3">
            <span className="text-sm font-medium text-moorcado-gray-dark">
              {seleccionados.size} seleccionada(s)
            </span>
            <button
              disabled={seleccionados.size === 0}
              onClick={() => aplicarAccionLote({ vendido: false, enNegociacion: false, activo: true })}
              className="rounded-full bg-moorcado-green px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            >
              Marcar como Disponible
            </button>
            <button
              disabled={seleccionados.size === 0}
              onClick={() => aplicarAccionLote({ vendido: false, enNegociacion: true, activo: true })}
              className="rounded-full bg-moorcado-gold px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            >
              Marcar como En negociación
            </button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {publicaciones.map((a) => (
            <div key={a.id} className="relative space-y-2">
              {modoSeleccion && (
                <button
                  type="button"
                  onClick={() => toggleSeleccion(a.id)}
                  aria-label={seleccionados.has(a.id) ? "Quitar de la selección" : "Agregar a la selección"}
                  className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/10"
                >
                  {seleccionados.has(a.id) ? (
                    <CheckSquare className="h-5 w-5 text-moorcado-green" />
                  ) : (
                    <Square className="h-5 w-5 text-moorcado-gray-dark/40" />
                  )}
                </button>
              )}
              <AnimalCard animal={a} />
              <GestionarAnuncio
                anuncio={a}
                vendedorId={usuario.id}
                usuarios={usuarios}
                mensajes={mensajes}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
