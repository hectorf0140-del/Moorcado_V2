import { HelpCircle, MessageCircle, ShieldCheck, ShoppingBag } from "lucide-react";

const PREGUNTAS = [
  {
    icon: ShoppingBag,
    pregunta: "¿Cómo publico un animal en venta?",
    respuesta:
      "Inicia sesión, ve a \"Publicar Animal\" desde el menú superior o tu panel de vendedor, completa la información (raza, peso, edad, precio, ubicación) y sube al menos una foto real del animal.",
  },
  {
    icon: MessageCircle,
    pregunta: "¿Cómo contacto a un vendedor?",
    respuesta:
      "Entra al detalle del animal que te interesa y usa el botón \"Enviar mensaje\". La conversación queda guardada en tu bandeja de Mensajes para que puedas seguir hablando cuando quieras.",
  },
  {
    icon: ShieldCheck,
    pregunta: "¿Qué significa que una cuenta esté verificada?",
    respuesta:
      "Una cuenta verificada envió su información (teléfono, documento de identidad y, si aplica, registro SAG) y nuestro equipo confirmó que es real. Puedes solicitar tu verificación desde tu perfil.",
  },
  {
    icon: HelpCircle,
    pregunta: "¿Qué hago si algo no funciona o veo contenido inapropiado?",
    respuesta:
      "Puedes reportar una publicación o una conversación de chat directamente desde esos apartados con el botón \"Reportar\". Nuestro equipo de moderación revisa cada reporte.",
  },
];

export default function AyudaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-moorcado-gray-dark sm:text-3xl">
        Centro de ayuda
      </h1>
      <p className="mt-2 text-moorcado-gray-dark/60">
        Respuestas rápidas a las preguntas más comunes sobre Moorcado.
      </p>

      <div className="mt-8 space-y-4">
        {PREGUNTAS.map(({ icon: Icon, pregunta, respuesta }) => (
          <div
            key={pregunta}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
          >
            <h2 className="flex items-center gap-2 font-display font-bold text-moorcado-gray-dark">
              <Icon className="h-5 w-5 shrink-0 text-moorcado-green" />
              {pregunta}
            </h2>
            <p className="mt-2 text-sm text-moorcado-gray-dark/70">{respuesta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
