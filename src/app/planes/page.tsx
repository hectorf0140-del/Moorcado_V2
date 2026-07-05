import { Check, Crown } from "lucide-react";

const planes = [
  {
    id: "gratuito",
    nombre: "Gratuito",
    precio: "L. 0",
    periodo: "/siempre",
    descripcion: "Para empezar a vender sin costo.",
    beneficios: ["5 publicaciones", "Chat con compradores", "Favoritos"],
    destacado: false,
  },
  {
    id: "basico",
    nombre: "Básico",
    precio: "L. 349",
    periodo: "/mes",
    descripcion: "Para ganaderos que venden con frecuencia.",
    beneficios: [
      "Publicaciones ilimitadas",
      "Estadísticas de tus publicaciones",
      "IA para recomendaciones",
    ],
    destacado: false,
  },
  {
    id: "premium",
    nombre: "Premium",
    precio: "L. 799",
    periodo: "/mes",
    descripcion: "La experiencia completa de Moorcado.",
    beneficios: [
      "Todo lo del plan Básico",
      "Gestión del hato con Rumi",
      "Veterinarios certificados",
      "Registro SAG y trazabilidad",
      "IA avanzada de recomendaciones",
      "Prioridad en resultados de búsqueda",
    ],
    destacado: true,
  },
];

export default function PlanesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-moorcado-gray-dark">
          Elige tu plan
        </h1>
        <p className="mt-2 text-moorcado-gray-dark/60">
          Impulsa tus ventas y gestiona tu hato con las herramientas
          adecuadas.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {planes.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-3xl bg-white p-7 shadow-sm ring-1 ${
              plan.destacado
                ? "ring-2 ring-moorcado-gold sm:-translate-y-3"
                : "ring-black/5"
            }`}
          >
            {plan.destacado && (
              <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-moorcado-gold px-3.5 py-1.5 text-xs font-bold text-white shadow">
                <Crown className="h-3.5 w-3.5" />
                Más popular
              </span>
            )}
            <h2 className="font-display text-xl font-bold text-moorcado-gray-dark">
              {plan.nombre}
            </h2>
            <p className="mt-1 text-sm text-moorcado-gray-dark/60">
              {plan.descripcion}
            </p>
            <p className="mt-5">
              <span className="font-display text-3xl font-extrabold text-moorcado-gray-dark">
                {plan.precio}
              </span>
              <span className="text-sm text-moorcado-gray-dark/50">
                {plan.periodo}
              </span>
            </p>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.beneficios.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-moorcado-gray-dark/80">
                  <Check
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      plan.destacado ? "text-moorcado-gold" : "text-moorcado-green"
                    }`}
                  />
                  {b}
                </li>
              ))}
            </ul>

            <button
              className={`mt-7 w-full rounded-full py-3 text-sm font-bold transition ${
                plan.destacado
                  ? "bg-moorcado-gold text-white hover:brightness-105"
                  : "bg-moorcado-green text-white hover:bg-moorcado-green/90"
              }`}
            >
              {plan.id === "gratuito" ? "Comenzar gratis" : "Elegir plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
