/**
 * Filtro de IA para publicaciones nuevas: revisa las fotos de un anuncio
 * recién creado y aprueba/rechaza automáticamente si es (o no) ganado real.
 * Igual que /api/sugerencia-oferta, este es el único lugar donde vive
 * OPENAI_API_KEY para este flujo — nunca llega al navegador.
 *
 * La escritura del resultado pasa por el RPC ia_moderar_anuncio(), que solo
 * acepta el cambio si le llega IA_MODERACION_SECRET correcto (ver
 * supabase/migracion_moderacion_ia.sql) — así un anuncio no puede
 * "auto-aprobarse" llamando este endpoint con datos falsos, porque la
 * decisión real siempre la toma la IA acá adentro, nunca el cliente.
 */
import { supabase } from "@/lib/supabase";
import type { Anuncio } from "@/lib/types";

const MODEL = "gpt-5-nano";
const REINTENTOS = 3;
const ESPERA_MS = 1000;

async function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buscarAnuncioConReintento(anuncioId: string): Promise<Anuncio | null> {
  for (let intento = 0; intento < REINTENTOS; intento++) {
    const { data, error } = await supabase
      .from("anuncios")
      .select("data")
      .eq("id", anuncioId)
      .maybeSingle();
    if (!error && data) return data.data as Anuncio;
    await esperar(ESPERA_MS);
  }
  return null;
}

async function clasificarConIA(
  imagenes: string[],
  descripcionTexto: string
): Promise<{ aprobado: boolean; motivo: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || imagenes.length === 0) return null;

  const prompt = `Sos el filtro de contenido de Moorcado, un marketplace de ganado en Honduras, revisando la(s) foto(s) de una publicación nueva (título/raza: "${descripcionTexto.slice(0, 150)}").

Tu único trabajo es detectar si la foto NO es un animal de granja — no evalúes calidad, encuadre, ángulo, iluminación ni qué tan "profesional" se ve. Los vendedores son personas del campo tomando fotos con el celular: primeros planos, fotos borrosas, animales de lado, de espaldas o comiendo son TODOS válidos y deben aprobarse, siempre que se reconozca un animal de granja real (vaca, toro, cerdo, cabra, oveja, caballo, gallina, etc.), aunque sea parcial o de cerca.

Rechazá SOLO si la foto claramente NO muestra ningún animal de granja: memes, personas, paisajes vacíos, capturas de pantalla, objetos, otro tipo de animal (mascota, animal salvaje) o contenido inapropiado.

Ante la duda, aprobá — el objetivo es filtrar spam obvio, no ser estricto con fotos imperfectas.

Respondé SOLO un JSON válido, sin texto extra: {"aprobado": true o false, "motivo": "una frase corta en español explicando la decisión"}`;

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              ...imagenes.slice(0, 2).map((url) => ({
                type: "image_url",
                image_url: { url },
              })),
            ],
          },
        ],
        max_completion_tokens: 300,
        reasoning_effort: "minimal",
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      console.error("OpenAI error (moderar-publicacion)", resp.status, await resp.text().catch(() => ""));
      return null;
    }

    const data = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    const contenido = data.choices?.[0]?.message?.content?.trim();
    if (!contenido) return null;

    const parsed = JSON.parse(contenido) as { aprobado?: unknown; motivo?: unknown };
    if (typeof parsed.aprobado !== "boolean") return null;
    return {
      aprobado: parsed.aprobado,
      motivo: typeof parsed.motivo === "string" ? parsed.motivo.slice(0, 300) : "",
    };
  } catch (error) {
    console.error("clasificarConIA falló:", error);
    return null;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { anuncioId?: string } | null;
  const anuncioId = body?.anuncioId;
  if (!anuncioId) {
    return Response.json({ ok: false, error: "Falta anuncioId" }, { status: 400 });
  }

  const secreto = process.env.IA_MODERACION_SECRET;
  if (!secreto) {
    // Sin secreto configurado, ni siquiera vale la pena llamar a la IA: el
    // RPC lo va a rechazar de todas formas. Se queda "en revisión".
    return Response.json({ ok: true, resultado: "sin_configurar" });
  }

  const anuncio = await buscarAnuncioConReintento(anuncioId);
  if (!anuncio) {
    return Response.json({ ok: false, error: "Anuncio no encontrado" }, { status: 404 });
  }

  const clasificacion = await clasificarConIA(
    anuncio.imagenes ?? [],
    `${anuncio.titulo ?? anuncio.nombre ?? ""} ${anuncio.raza ?? ""}`
  );
  if (!clasificacion) {
    // IA no disponible/sin fotos/error — se queda en revisión para que un
    // moderador lo vea a mano, no se auto-aprueba por defecto.
    return Response.json({ ok: true, resultado: "sin_clasificar" });
  }

  const { data: aplicado, error } = await supabase.rpc("ia_moderar_anuncio", {
    p_anuncio_id: anuncioId,
    p_secreto: secreto,
    p_aprobado: clasificacion.aprobado,
    p_motivo: clasificacion.motivo,
  });

  if (error || !aplicado) {
    return Response.json({ ok: false, error: "No se pudo aplicar la decisión" }, { status: 500 });
  }

  if (!clasificacion.aprobado) {
    const { crearNotificacionDb } = await import("@/lib/notificacionesDb");
    void crearNotificacionDb({
      usuarioId: anuncio.vendedorId,
      tipo: "publicacion_rechazada",
      titulo: "Tu publicación no fue aprobada",
      descripcion: clasificacion.motivo || "El contenido no parece ser ganado o un animal de granja.",
      referenciaId: anuncioId,
    });
  }

  return Response.json({ ok: true, resultado: clasificacion.aprobado ? "aprobado" : "rechazado" });
}
