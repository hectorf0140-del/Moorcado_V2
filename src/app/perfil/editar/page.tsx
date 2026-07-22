"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAppStore } from "@/store/useAppStore";
import { DEPARTAMENTOS_HONDURAS } from "@/lib/types";
import { PantallaCargando } from "@/components/Spinner";
import {
  esTelefonoValido,
  filtrarTelefono,
  soloDigitos,
  MAX_NOMBRE,
  MAX_RTN,
} from "@/lib/validacion";

export default function EditarPerfilPage() {
  const router = useRouter();
  const { sesion, loading } = useAuthGuard();
  const usuarios = useAppStore((s) => s.usuarios);
  const actualizarUsuario = useAppStore((s) => s.actualizarUsuario);

  const usuario = sesion ? usuarios.find((u) => u.id === sesion.usuarioId) : undefined;

  const [nombre, setNombre] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [rtn, setRtn] = useState("");
  const [telefono, setTelefono] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Sincroniza los campos del formulario cuando cambia la identidad del
  // usuario (ej. al terminar de hidratar). Se ajusta durante el render en
  // vez de en un efecto para no disparar una segunda pasada de render.
  const [usuarioIdCargado, setUsuarioIdCargado] = useState<string | undefined>(undefined);
  if (usuario && usuario.id !== usuarioIdCargado) {
    setUsuarioIdCargado(usuario.id);
    setNombre(usuario.nombre ?? "");
    setNombreEmpresa(usuario.nombreEmpresa ?? "");
    setRtn(usuario.rtn ?? "");
    setTelefono(usuario.telefono ?? "");
    setDepartamento(usuario.departamento ?? "");
  }

  if (loading || !usuario) {
    return (
      <PantallaCargando />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario || !nombre.trim() || nombre.trim().length > MAX_NOMBRE) return;
    if (telefono && !esTelefonoValido(telefono)) return;
    if (usuario.tipo === "empresa" && (!nombreEmpresa.trim() || !rtn.trim())) return;
    if (usuario.tipo === "empresa" && rtn.length !== MAX_RTN) return;
    setGuardando(true);

    const actualizado = {
      ...usuario,
      nombre: nombre.trim(),
      iniciales: nombre
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join(""),
      telefono,
      departamento,
      ...(usuario.tipo === "empresa"
        ? { nombreEmpresa: nombreEmpresa.trim(), rtn: rtn.trim() }
        : {}),
    };
    actualizarUsuario(actualizado);
    const { upsertUsuarioDb } = await import("@/lib/usuariosDb");
    await upsertUsuarioDb(actualizado);

    setGuardando(false);
    setGuardado(true);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <button
        onClick={() => router.push("/perfil")}
        className="flex items-center gap-1.5 text-sm font-semibold text-moorcado-gray-dark/70 hover:text-moorcado-gray-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mi perfil
      </button>

      <h1 className="mt-4 font-display text-2xl font-bold text-moorcado-gray-dark">
        Editar perfil
      </h1>
      <p className="mt-1 text-sm text-moorcado-gray-dark/60">
        Actualiza tu nombre y datos de contacto. Para cambiar tu correo o
        contraseña, o para verificar tu cuenta, ve a{" "}
        <span className="font-semibold">Verificación</span>.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
      >
        {guardado && (
          <p className="rounded-xl bg-moorcado-green/10 px-4 py-2.5 text-sm text-moorcado-green">
            Tus cambios se guardaron.
          </p>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
            Nombre completo
          </span>
          <input
            type="text"
            required
            maxLength={MAX_NOMBRE}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
          />
        </label>

        {usuario.tipo === "empresa" && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Nombre de la empresa
              </span>
              <input
                type="text"
                required
                maxLength={MAX_NOMBRE}
                value={nombreEmpresa}
                onChange={(e) => setNombreEmpresa(e.target.value)}
                placeholder="Ej. Ganadera del Valle S. de R.L."
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                RTN
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={MAX_RTN}
                value={rtn}
                onChange={(e) => setRtn(soloDigitos(e.target.value, MAX_RTN))}
                placeholder="Ej. 08019999123456"
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
              />
            </label>
          </>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
            Teléfono
          </span>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(filtrarTelefono(e.target.value))}
            placeholder="Ej. +504 9999-8888"
            className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
            Departamento
          </span>
          <select
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green"
          >
            <option value="">Selecciona un departamento</option>
            {DEPARTAMENTOS_HONDURAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={
            guardando ||
            !nombre.trim() ||
            (usuario.tipo === "empresa" && (!nombreEmpresa.trim() || !rtn.trim()))
          }
          className="w-full rounded-full bg-moorcado-green py-3.5 text-base font-bold text-white transition hover:bg-moorcado-green/90 disabled:opacity-70"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
