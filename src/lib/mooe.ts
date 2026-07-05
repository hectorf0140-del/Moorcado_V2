/**
 * Motor de reglas del chatbot Mooe.
 * Arquitectura desacoplada: la función `responder` contiene toda la lógica
 * de matching por palabras clave.
 *
 * PRODUCCIÓN: Para conectar un LLM real, reemplazar el cuerpo de `responder`
 * con una llamada a la API de Groq:
 *   const response = await groq.chat.completions.create({
 *     model: "llama3-70b-8192",
 *     messages: [{ role: "user", content: input }],
 *   });
 *   return response.choices[0].message.content;
 *
 * Las constantes RULES y CHIPS pueden usarse como few-shot examples al LLM.
 */

interface Rule {
  keywords: string[];
  respuesta: string;
}

const RULES: Rule[] = [
  {
    keywords: ["publicar", "anuncio", "lote", "subir", "vender"],
    respuesta:
      '¡Fácil! Ve a "Publicar Animal" en el menú, completa los datos de tu lote (raza, peso, precio, fotos) y listo. Tu anuncio aparece de inmediato en el marketplace. ¿Necesitas ayuda con algún campo?',
  },
  {
    keywords: ["precio", "costo", "cuanto vale", "cuánto vale", "valoración", "valoracion", "estimar"],
    respuesta:
      "En la página de cada animal encontrarás el **Análisis IA Moorcado** con un precio estimado basado en raza, peso y edad. También al publicar tu lote te sugerimos un precio de referencia. La comisión es del 2.5% para plan Gratis y 2% para Premium.",
  },
  {
    keywords: ["pago", "pagar", "transferencia", "deposito", "depósito", "cobro"],
    respuesta:
      "El pago se coordina directamente entre comprador y vendedor. Aceptamos transferencia bancaria, depósito y próximamente billeteras móviles (Tigo Money, Ahorro). Moorcado cobra una comisión del 2.5% al cerrar la venta.",
  },
  {
    keywords: ["comision", "comisión", "porcentaje", "cuanto cobra", "cuánto cobra"],
    respuesta:
      "La comisión es del **2.5%** en el plan Gratuito y **2%** en el plan Premium. Si vendes un lote por L 50,000 en plan Gratuito, la comisión sería L 1,250. ¿Quieres ver los detalles de los planes?",
  },
  {
    keywords: ["transporte", "flete", "envio", "envío", "llevar", "mover ganado"],
    respuesta:
      "El transporte del ganado es responsabilidad del comprador y vendedor. Puedes encontrar transportistas en nuestra sección **Mapa** o contactarlos directamente. Recomendamos vehículos habilitados por SAG para evitar problemas en retenes.",
  },
  {
    keywords: ["verificar", "verificado", "confiable", "estafa", "seguro"],
    respuesta:
      'Los vendedores con el badge 🏅 "Verificado" han pasado nuestro proceso de validación de identidad y registro SAG. Siempre revisa la calificación, número de ventas y reseñas antes de negociar.',
  },
  {
    keywords: ["contactar", "contacto", "hablar", "chat", "vendedor", "comprar"],
    respuesta:
      'En la página de cada animal hay un botón "Contactar vendedor" que abre el chat directo. También puedes enviar WhatsApp o llamar desde la misma página.',
  },
  {
    keywords: ["raza", "razas", "tipo", "tipos", "brahman", "holstein", "angus", "simmental", "gyr", "pardo"],
    respuesta:
      "En Moorcado encontrarás: **Brahman, Holstein, Jersey, Pardo Suizo, Angus, Brangus, Gyr, Simmental, Indubrasil y Criollo**. Puedes filtrar por raza en el marketplace. ¿Te interesa alguna raza en particular?",
  },
  {
    keywords: ["plan", "planes", "premium", "suscripcion", "suscripción", "gratis", "mensual"],
    respuesta:
      "Tenemos 3 planes:\n• **Gratis**: hasta 3 lotes activos, comisión 2.5%\n• **Básico** (L 299/mes): hasta 10 lotes, comisión 2.2%\n• **Premium** (L 499/mes): lotes ilimitados, comisión 2%, anuncios destacados\nVe a /planes para más detalles.",
  },
  {
    keywords: ["sag", "registro", "certificado", "senasa", "documentos"],
    respuesta:
      "El Registro SAG es el certificado oficial del Servicio de Administración de Rentas de Honduras para el movimiento de ganado. Al publicar, puedes indicar si tu animal tiene este registro — aumenta la confianza del comprador.",
  },
  {
    keywords: ["hola", "buenos días", "buenas", "saludos", "hey", "hi"],
    respuesta:
      "¡Hola! Soy Mooe 🐄, tu asistente ganadero en Moorcado. Puedo ayudarte a publicar lotes, entender precios, conocer los planes o contactar vendedores. ¿En qué te puedo ayudar hoy?",
  },
  {
    keywords: ["gracias", "thank", "perfecto", "excelente", "listo"],
    respuesta:
      "¡Con gusto! Si tienes más preguntas sobre el marketplace o necesitas ayuda con tu publicación, aquí estoy. 🐄",
  },
];

/** Chips de preguntas sugeridas para mostrar en la UI */
export const MOOE_CHIPS = [
  "¿Cómo publico un lote?",
  "¿Cuánto cobra Moorcado?",
  "¿Cómo contacto a un vendedor?",
  "¿Qué razas hay disponibles?",
  "¿Cómo verifican a los vendedores?",
];

/**
 * Devuelve la respuesta del chatbot para un input dado.
 * La función es pura y determinista: mismo input → misma respuesta.
 */
export function responder(input: string): string {
  const normalizado = input.toLowerCase().trim();

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => normalizado.includes(kw))) {
      return rule.respuesta;
    }
  }

  return "Hmm, no encontré información sobre eso. Puedes escribirnos a soporte@moorcado.hn o revisar nuestro centro de ayuda. ¿Puedo ayudarte con algo más sobre el marketplace? 🐄";
}
