"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Tag } from "lucide-react";
import type { PlanId, UserType } from "@/lib/types";
import { DEPARTAMENTOS_HONDURAS } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { getUsuarios, setUsuarios, setSesion } from "@/lib/storage";
import { fetchUsuariosDb, upsertUsuarioDb } from "@/lib/usuariosDb";

// "Veterinario" queda fuera del registro por ahora: no desbloquea ninguna
// pantalla ni función propia en el resto de la app (a diferencia de
// "Empresa", que sí da acceso a Rumi) — se puede reactivar cuando haya
// algo específico para veterinarios.
const tiposUsuario: { id: UserType; label: string; icon: typeof Tag }[] = [
  { id: "vendedor", label: "Vendedor", icon: Tag },
  { id: "empresa", label: "Empresa", icon: Building2 },
];

const NOMBRES_PLAN: Record<PlanId, string> = {
  gratuito: "Gratuito",
  basico: "Básico",
  premium: "Premium",
};

export default function RegistroClient({ initialPlan }: { initialPlan?: PlanId }) {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const actualizarUsuario = useAppStore((s) => s.actualizarUsuario);
  // El plan Premium (Rumi, búsquedas guardadas con alerta, prioridad en
  // resultados) solo funciona para cuentas Empresa — si vienen de "Elegir
  // plan" con Premium, arrancamos con ese tipo ya seleccionado.
  const [tipo, setTipo] = useState<UserType>(initialPlan === "premium" ? "empresa" : "vendedor");
  const [nombre, setNombre] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [rtn, setRtn] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // El plan de pago no se otorga aquí — toda cuenta nueva arranca en
  // gratuito. Si venía de "Elegir plan" en /planes con un plan pago, se le
  // redirige a pagarlo ahí mismo justo después de crear la cuenta, en vez
  // de dárselo gratis.
  const plan: PlanId = "gratuito";

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
    if (tipo === "empresa" && (!nombreEmpresa.trim() || !rtn.trim())) {
      setError("Completa el nombre de la empresa y el RTN.");
      return;
    }
    if (!aceptaTerminos) {
      setError("Debes aceptar los Términos y Condiciones y la Política de Privacidad.");
      return;
    }

    setCargando(true);
    try {
      const locales = getUsuarios();
      const remotosResultado = await fetchUsuariosDb();

      // Igual que en login: si Supabase falla y no hay cache local, no
      // podemos garantizar que el correo no esté ya registrado en otro
      // dispositivo — mejor avisar del problema de conexión que dejar
      // registrar una cuenta duplicada silenciosamente.
      if (remotosResultado === null && locales.length === 0) {
        setError(
          "No pudimos conectar con el servidor para verificar tu correo. Revisa tu conexión e inténtalo de nuevo."
        );
        return;
      }

      const remotos = remotosResultado ?? [];
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
        telefono,
        correo,
        departamento,
        password: contrasena,
        creadoEn: new Date().toISOString(),
        terminosAceptados: true,
        fechaAceptacionTerminos: new Date().toISOString(),
        ...(tipo === "empresa" ? { nombreEmpresa: nombreEmpresa.trim(), rtn: rtn.trim() } : {}),
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
      const destino =
        initialPlan && initialPlan !== "gratuito"
          ? `/planes?plan=${initialPlan}`
          : "/dashboard";
      setTimeout(() => router.push(destino), 800);
    } catch (error) {
      console.error("Error en registro:", error);
      setError(
        "Ocurrió un error al crear tu cuenta. Por favor inténtalo de nuevo más tarde."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center px-4 py-10 sm:px-6">
      <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 lg:grid-cols-2">
        <div
          className="relative hidden flex-col justify-between overflow-hidden bg-moorcado-green bg-cover bg-center p-10 text-white lg:flex"
          style={{ backgroundImage: "url('/registro-campo-vacas.jpg')" }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-[#1F4D2C]/90 via-[#1F4D2C]/55 to-[#1F4D2C]/90" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold leading-tight drop-shadow-sm">
              Únete a la comunidad ganadera más grande de Honduras
            </h2>
            <ul className="mt-8 space-y-4 text-sm text-white/90">
              <li>✓ Publica tus animales en minutos</li>
              <li>✓ Contacta clientes verificados</li>
              <li>✓ Valoración de precio con IA</li>
              <li>✓ Chat directo con compradores y vendedores</li>
            </ul>
          </div>
          <p className="relative text-xs text-white/70">
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

          {initialPlan && initialPlan !== "gratuito" && (
            <p className="mt-3 rounded-xl bg-moorcado-gold/10 px-4 py-2.5 text-xs font-medium text-moorcado-brown">
              Después de crear tu cuenta te pediremos el pago para activar el
              plan {NOMBRES_PLAN[initialPlan]}.
              {initialPlan === "premium" &&
                " Sus beneficios principales (Rumi, búsquedas con alerta, prioridad) son exclusivos de cuentas Empresa."}
            </p>
          )}

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

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                {tipo === "empresa" ? "Nombre de quien registra la cuenta" : "Nombre completo"}
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
            {tipo === "empresa" && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                    Nombre de la empresa
                  </span>
                  <input
                    type="text"
                    required
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
                    required
                    value={rtn}
                    onChange={(e) => setRtn(e.target.value)}
                    placeholder="Ej. 08019999123456"
                    className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
                  />
                </label>
              </>
            )}
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
                Teléfono <span className="font-normal text-moorcado-gray-dark/50">(opcional)</span>
              </span>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. +504 9999-8888"
                className="w-full rounded-xl border border-black/10 bg-moorcado-gray-light px-4 py-2.5 text-sm outline-none focus:border-moorcado-green focus:ring-2 focus:ring-moorcado-green/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-moorcado-gray-dark">
                Departamento
              </span>
              <select
                required
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

          <label className="mt-5 flex items-start gap-2.5 text-sm text-moorcado-gray-dark/80">
            <input
              type="checkbox"
              required
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 text-moorcado-green focus:ring-moorcado-green/30"
            />
            <span>
              He leído y acepto los{" "}
              <Link href="/terminos" target="_blank" className="font-semibold text-moorcado-green hover:underline">
                Términos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" target="_blank" className="font-semibold text-moorcado-green hover:underline">
                Política de Privacidad
              </Link>{" "}
              de Moorcado.
            </span>
          </label>

          <button
            type="submit"
            disabled={cargando || enviado || !aceptaTerminos}
            className="mt-5 w-full rounded-full bg-moorcado-green py-3.5 text-base font-bold text-white transition hover:bg-moorcado-green/90 disabled:opacity-70"
          >
            {cargando || enviado ? "Creando cuenta..." : "Crear Cuenta"}
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
