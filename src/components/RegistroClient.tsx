"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Stethoscope, Tag } from "lucide-react";
import type { PlanId, UserType } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { getUsuarios, setUsuarios, setSesion } from "@/lib/storage";
import { fetchUsuariosDb, upsertUsuarioDb } from "@/lib/usuariosDb";

const tiposUsuario: { id: UserType; label: string; icon: typeof Tag }[] = [
  { id: "vendedor", label: "Vendedor", icon: Tag },
  { id: "empresa", label: "Empresa", icon: Building2 },
  { id: "veterinario", label: "Veterinario", icon: Stethoscope },
];

const planesDisponibles: { id: PlanId; nombre: string; precio: string }[] = [
  { id: "gratuito", nombre: "Gratuito", precio: "L. 0" },
  { id: "basico", nombre: "Básico", precio: "L. 349/mes" },
  { id: "premium", nombre: "Premium", precio: "L. 799/mes" },
];

export default function RegistroClient({ initialPlan }: { initialPlan?: PlanId }) {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const actualizarUsuario = useAppStore((s) => s.actualizarUsuario);
  const [tipo, setTipo] = useState<UserType>("vendedor");
  const [plan, setPlan] = useState<PlanId>(initialPlan ?? "gratuito");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (contrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const locales = getUsuarios();
      const remotos = (await fetchUsuariosDb()) ?? [];
      const usuarios = [...locales, ...remotos].reduce((acc, u) => {
        if (!acc.some((usuario) => usuario.id === u.id)) {
          acc.push(u);
        }
        return acc;
      }, [] as typeof locales);
      if (usuarios.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) {
        setError("Este correo ya está registrado.");
        return;
      }

      const iniciales = nombre
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("");

      const colores = ["#1F4D2C", "#8B5E3C", "#7FA05E", "#D9A441", "#424242"];
      const avatarColor = colores[Math.floor(Math.random() * colores.length)];

      const nuevoUsuario = {
        id: `u-${Date.now()}`,
        nombre,
        tipo,
        avatarColor,
        iniciales,
        verificado: false,
        calificacion: 0,
        numeroVentas: 0,
        publicacionesActivas: 0,
        resenas: 0,
        plan,
        telefono: "",
        correo,
        departamento: "",
        password: contrasena,
        creadoEn: new Date().toISOString(),
      };

      setUsuarios([...getUsuarios(), nuevoUsuario]);
      await upsertUsuarioDb(nuevoUsuario);

      const sesion = {
        usuarioId: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        iniciales: nuevoUsuario.iniciales,
        avatarColor: nuevoUsuario.avatarColor,
      };
      setSesion(sesion);
      login(sesion);
      actualizarUsuario(nuevoUsuario);

      setEnviado(true);
      setTimeout(() => router.push("/dashboard"), 800);
    } catch (error) {
      console.error("Error en registro:", error);
      setError(
        "Ocurrió un error al crear tu cuenta. Por favor inténtalo de nuevo más tarde."
      );
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center px-4 py-10 sm:px-6">
      <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-linear-to-br from-[#1F4D2C] to-[#8B5E3C] p-10 text-white lg:flex">
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight">
              Únete a la comunidad ganadera más grande de Honduras
            </h2>
            <ul className="mt-8 space-y-4 text-sm text-white/90">
              <li>✓ Publica tus animales en minutos</li>
              <li>✓ Contacta clientes verificados</li>
              <li>✓ Valoración de precio con IA</li>
              <li>✓ Chat directo con compradores y vendedores</li>
            </ul>
          </div>
          <p className="text-xs text-white/70">
            Al registrarte aceptas nuestros Términos y Política de Privacidad.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10">
          <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark">
            Crear cuenta
          </h1>
          <p className="mt-1 text-sm text-moorcado-gray-dark/60">
            Es rápido, sencillo y gratis.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {tiposUsuario.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setTipo(id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition ${
                  tipo === id
                    ? "border-moorcado-green bg-moorcado-green/10 text-moorcado-green"
                    : "border-black/10 text-moorcado-gray-dark/70 hover:border-black/20"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
              Plan
            </span>
            <div className="grid grid-cols-3 gap-2">
              {planesDisponibles.map(({ id, nombre, precio }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setPlan(id)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition ${
                    plan === id
                      ? "border-moorcado-green bg-moorcado-green/10 text-moorcado-green"
                      : "border-black/10 text-moorcado-gray-dark/70 hover:border-black/20"
                  }`}
                >
                  {nombre}
                  <span className="font-normal text-moorcado-gray-dark/50">{precio}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Nombre completo
              </span>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. José Martínez"
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Correo electrónico
              </span>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Contraseña
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Confirmar contraseña
              </span>
              <input
                type="password"
                required
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={enviado}
            className="mt-7 w-full rounded-full bg-moorcado-green py-3.5 text-base font-bold text-white transition hover:bg-moorcado-green/90 disabled:opacity-70"
          >
            {enviado ? "Creando cuenta..." : "Crear Cuenta"}
          </button>

          <p className="mt-5 text-center text-sm text-moorcado-gray-dark/70">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-moorcado-green">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
