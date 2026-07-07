import { Eye, Flag, Lock, ShieldCheck } from "lucide-react";

const PRACTICAS = [
  {
    icon: ShieldCheck,
    titulo: "Cuentas verificadas",
    texto:
      "Los vendedores pueden solicitar verificación de su identidad y datos desde su perfil. Busca la insignia de verificado antes de cerrar un trato.",
  },
  {
    icon: Lock,
    titulo: "Nunca compartas tu contraseña",
    texto:
      "Moorcado nunca te va a pedir tu contraseña por chat, WhatsApp o correo. Si alguien lo hace, repórtalo de inmediato.",
  },
  {
    icon: Eye,
    titulo: "Verifica antes de pagar",
    texto:
      "Recomendamos ver al animal en persona o pedir fotos/videos recientes antes de hacer cualquier pago. Desconfía de precios demasiado bajos para la raza y el peso.",
  },
  {
    icon: Flag,
    titulo: "Reporta comportamiento sospechoso",
    texto:
      "Cada publicación y cada chat tiene un botón \"Reportar\". Úsalo ante hostigamiento, información falsa o cualquier intento de fraude — nuestro equipo de moderación revisa todos los reportes.",
  },
];

export default function SeguridadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
        Seguridad en Moorcado
      </h1>
      <p className="mt-2 text-moorcado-gray-dark/60">
        Consejos para comprar y vender ganado de forma segura en la plataforma.
      </p>

      <div className="mt-8 space-y-4">
        {PRACTICAS.map(({ icon: Icon, titulo, texto }) => (
          <div key={titulo} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="flex items-center gap-2 font-display font-bold text-moorcado-gray-dark">
              <Icon className="h-5 w-5 shrink-0 text-moorcado-green" />
              {titulo}
            </h2>
            <p className="mt-2 text-sm text-moorcado-gray-dark/70">{texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
