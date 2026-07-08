/**
 * Motor de reglas del chatbot Mooe.
 * Arquitectura desacoplada: la función `responder` contiene toda la lógica
 * de matching por palabras clave sobre texto normalizado (sin tildes,
 * minúsculas), con un fallback por coincidencia parcial de palabras para
 * cubrir preguntas que no calzan exacto con ningún keyword.
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

/** Quita tildes/diacríticos y pasa a minúsculas para comparar sin distinguir acentos. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const RULES: Rule[] = [
  {
    keywords: ["publicar", "anuncio", "lote", "subir", "vender", "como publico", "poner en venta"],
    respuesta:
      '¡Fácil! Ve a "Publicar Animal" en el menú, completa los datos de tu lote (raza, peso, precio, fotos) y listo. Tu anuncio aparece de inmediato en el marketplace. ¿Necesitas ayuda con algún campo?',
  },
  {
    keywords: ["precio", "costo", "cuanto vale", "valoracion", "estimar", "cuanto cuesta"],
    respuesta:
      "En la página de cada animal encontrarás el **Análisis IA Moorcado** con un precio estimado basado en raza, peso y edad. También al publicar tu lote te sugerimos un precio de referencia. La comisión es del 2.5% para plan Gratis y 2% para Premium.",
  },
  {
    keywords: ["pago", "pagar", "transferencia", "deposito", "cobro", "tarjeta"],
    respuesta:
      "El pago se coordina directamente entre comprador y vendedor. Aceptamos transferencia bancaria, depósito y próximamente billeteras móviles (Tigo Money, Ahorro). Moorcado cobra una comisión del 2.5% al cerrar la venta.",
  },
  {
    keywords: ["comision", "porcentaje", "cuanto cobra", "cobran"],
    respuesta:
      "La comisión es del **2.5%** en el plan Gratuito y **2%** en el plan Premium. Si vendes un lote por L 50,000 en plan Gratuito, la comisión sería L 1,250. ¿Quieres ver los detalles de los planes?",
  },
  {
    keywords: ["transporte", "flete", "envio", "llevar", "mover ganado"],
    respuesta:
      "El transporte del ganado es responsabilidad del comprador y vendedor. Puedes encontrar transportistas en nuestra sección **Mapa** o contactarlos directamente. Recomendamos vehículos habilitados por SAG para evitar problemas en retenes.",
  },
  {
    keywords: ["verificar", "verificado", "confiable", "estafa", "seguro", "verificacion"],
    respuesta:
      'Los vendedores con el badge 🏅 "Verificado" han pasado nuestro proceso de validación de identidad y registro SAG. Puedes solicitar tu propia verificación desde tu Perfil > Solicitar verificación. Siempre revisa la calificación, número de ventas y reseñas antes de negociar.',
  },
  {
    keywords: ["contactar", "contacto", "hablar", "vendedor", "comprar"],
    respuesta:
      'En la página de cada animal hay un botón "Contactar vendedor" que abre el chat directo. También puedes enviar WhatsApp o llamar desde la misma página.',
  },
  {
    keywords: ["mensaje", "chat", "conversacion", "no me llegan", "no me llega"],
    respuesta:
      'Tus conversaciones están en el ícono de mensajes 💬 del menú superior. Ahí verás un número rojo cuando tengas mensajes sin leer. Si no te aparece algo, revisa tu conexión y vuelve a intentar — nuestro chat es en tiempo real entre comprador y vendedor.',
  },
  {
    keywords: ["notificacion", "alerta", "no me avisa", "no me notifica"],
    respuesta:
      'Las notificaciones (favoritos, ventas, apelaciones, etc.) están en el ícono de campana 🔔 del menú superior, con un número rojo cuando tienes novedades sin leer. Se marcan como leídas al entrar a la página de Notificaciones.',
  },
  {
    keywords: ["resena", "reseñas", "calificacion", "opinion", "dejar reseña"],
    respuesta:
      "Puedes dejar una reseña con estrellas y comentario después de tratar con un vendedor o comprador desde su perfil. Tus propias reseñas recibidas se ven en tu Perfil y en Verificación, junto con tu calificación promedio.",
  },
  {
    keywords: ["favorito", "me gusta", "guardar animal", "corazon"],
    respuesta:
      'Toca el ícono de corazón ❤️ en cualquier anuncio para guardarlo en "Mis favoritos", visible en tu Perfil. Al vendedor le llega una notificación cuando alguien marca su publicación como favorita.',
  },
  {
    keywords: ["editar", "modificar anuncio", "borrar anuncio", "eliminar publicacion", "cambiar estado"],
    respuesta:
      'Desde tu Panel de vendedor puedes editar la información y fotos de cualquier publicación, y cambiar su estado (Disponible / En negociación / Vendido) desde el selector de cada tarjeta.',
  },
  {
    keywords: ["reportar", "reporte", "denunciar", "publicacion falsa"],
    respuesta:
      'Puedes reportar una publicación o un chat sospechoso con el botón "Reportar" que aparece en esa página. Nuestro equipo de moderación revisa cada reporte con un identificador de seguimiento.',
  },
  {
    keywords: ["raza", "razas", "brahman", "holstein", "angus", "simmental", "gyr", "pardo"],
    respuesta:
      "En Moorcado encontrarás: **Brahman, Holstein, Jersey, Pardo Suizo, Angus, Brangus, Gyr, Simmental, Indubrasil y Criollo**. Puedes filtrar por raza en el marketplace. ¿Te interesa alguna raza en particular?",
  },
  {
    keywords: ["plan", "planes", "premium", "suscripcion", "gratis", "mensual", "mejorar plan"],
    respuesta:
      "Tenemos 3 planes:\n• **Gratis**: hasta 3 lotes activos, comisión 2.5%\n• **Básico** (L 299/mes): hasta 10 lotes, comisión 2.2%\n• **Premium** (L 499/mes): lotes ilimitados, comisión 2%, anuncios destacados\nVe a /planes para más detalles.",
  },
  {
    keywords: ["sag", "registro", "certificado", "senasa", "documentos"],
    respuesta:
      "El Registro SAG es el certificado oficial del Servicio de Administración de Rentas de Honduras para el movimiento de ganado. Al publicar, puedes indicar si tu animal tiene este registro — aumenta la confianza del comprador.",
  },
  {
    keywords: ["contrasena", "clave", "olvide mi clave", "recuperar cuenta", "cambiar correo"],
    respuesta:
      "Por ahora el cambio de contraseña o correo se hace escribiendo a soporte@moorcado.hn con el nombre de tu cuenta para verificarte. Estamos trabajando en un flujo de autoservicio.",
  },
  {
    keywords: ["catalogo", "filtro", "buscar animal", "filtrar"],
    respuesta:
      "En el Catálogo puedes filtrar por raza, departamento, precio y peso. El precio máximo no tiene tope (para lotes de alto valor) y el peso usa un rango típico de ganado. Usa la barra de búsqueda del header para buscar por palabra clave.",
  },
  {
    keywords: ["mapa", "ubicacion", "donde queda", "departamento"],
    respuesta:
      "La sección Mapa muestra los anuncios ubicados en Honduras por departamento, útil para calcular distancia y coordinar transporte con el vendedor.",
  },
  {
    keywords: ["soporte humano", "hablar con alguien", "persona real", "agente", "ayuda humana"],
    respuesta:
      "Si prefieres hablar con una persona del equipo, escríbenos a **soporte@moorcado.hn** y te responderemos lo antes posible.",
  },
  {
    keywords: ["hola", "buenos dias", "buenas", "saludos", "hey", "hi"],
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
 * 1) Busca coincidencia directa (keyword contenido en el texto).
 * 2) Si no hay match directo, busca la regla con más palabras en común
 *    con el input (tolera preguntas mal formuladas o incompletas).
 */
export function responder(input: string): string {
  const normalizado = normalizar(input);

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => normalizado.includes(normalizar(kw)))) {
      return rule.respuesta;
    }
  }

  const palabrasInput = normalizado.split(/\s+/).filter((p) => p.length > 3);
  if (palabrasInput.length > 0) {
    let mejorRegla: Rule | null = null;
    let mejorPuntaje = 0;
    for (const rule of RULES) {
      const keywordsNormalizadas = rule.keywords.map(normalizar);
      const puntaje = palabrasInput.filter((p) =>
        keywordsNormalizadas.some((kw) => kw.includes(p) || p.includes(kw))
      ).length;
      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejorRegla = rule;
      }
    }
    if (mejorRegla && mejorPuntaje > 0) {
      return mejorRegla.respuesta;
    }
  }

  return "Hmm, no encontré información exacta sobre eso. Puedes preguntarme sobre publicar, precios, pagos, planes, verificación, mensajes o notificaciones — o escribirnos a soporte@moorcado.hn para hablar con una persona del equipo. 🐄";
}
