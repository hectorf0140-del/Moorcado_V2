"use client";

import { useState } from "react";
import { BadgeCheck, FileWarning, Gavel, LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";
import UsuariosTab from "@/components/moderacion/UsuariosTab";
import PublicacionesTab from "@/components/moderacion/PublicacionesTab";
import ReportesTab from "@/components/moderacion/ReportesTab";
import ApelacionesTab from "@/components/moderacion/ApelacionesTab";

const TABS = [
  { id: "reportes", label: "Reportes", icon: FileWarning },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "publicaciones", label: "Publicaciones", icon: BadgeCheck },
  { id: "apelaciones", label: "Apelaciones", icon: Gavel },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Panel de moderación día a día — accesible tanto por moderadores como por
 * super_admin (ver useAdminAuthGuard() sin rol requerido). Sin métricas ni
 * planes/pagos: eso queda exclusivo de /admin.
 */
export default function ModeradorClient() {
  const router = useRouter();
  const { adminSesion, loading } = useAdminAuthGuard();
  const logoutAdmin = useAppStore((s) => s.logoutAdmin);

  const [tab, setTab] = useState<TabId>("reportes");

  function handleLogout() {
    logoutAdmin();
    router.push("/admin/login");
  }

  if (loading || !adminSesion) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-moorcado-gray-dark border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
            Panel de Moderación
          </h1>
          <p className="text-moorcado-gray-dark/60">
            Revisa reportes, usuarios, publicaciones y apelaciones de Moorcado.
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

      {tab === "reportes" && (
        <div className="mt-6">
          <ReportesTab token={adminSesion.token} />
        </div>
      )}
      {tab === "usuarios" && <div className="mt-6"><UsuariosTab token={adminSesion.token} /></div>}
      {tab === "publicaciones" && <div className="mt-6"><PublicacionesTab /></div>}
      {tab === "apelaciones" && (
        <div className="mt-6">
          <ApelacionesTab token={adminSesion.token} />
        </div>
      )}
    </div>
  );
}
