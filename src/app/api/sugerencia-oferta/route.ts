/**
 * Sugerencia de IA para negociar una oferta (opt-in, el vendedor la pide
 * a mano — no se llama sola en cada mensaje, para no gastar de más).
 * Único lugar que ve OPENAI_API_KEY; nunca debe llegar al navegador.
 * Modelo gpt-5-nano: el más barato de OpenAI, alcanza para un consejo
 * corto de 1-2 frases.
 */
import { calcularComision } from "@/lib/comision";
import type { PlanId } from "@/lib/types";

const PLANES_VALIDOS: PlanId[] = ["gratuito", "basico", "premium"];

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, error: "IA no configurada" }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as {
    precioPedido?: number;
    ofertaMonto?: number;
    plan?: PlanId;
    raza?: string;
  } | null;

  const precioPedido = Number(body?.precioPedido);
  const ofertaMonto = Number(body?.ofertaMonto);
  const plan = body?.plan;

  if (!(precioPedido > 0) || !(ofertaMonto > 0) || !plan || !PLANES_VALIDOS.includes(plan)) {
    return Response.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }

  const comision = calcularComision(ofertaMonto, plan);
  const neto = ofertaMonto - comision;
  const raza = typeof body?.raza === "string" ? body.raza.slice(0, 60) : "";

  const prompt = `Sos un consultor breve para un vendedor de ganado en Honduras que te pregunta "¿me conviene vender?" dentro de un chat de negociación. Datos reales de esta oferta:
- Precio pedido: L ${precioPedido.toLocaleString("es-HN")}
- Oferta recibida: L ${ofertaMonto.toLocaleString("es-HN")}
- Comisión de Moorcado: L ${comision.toLocaleString("es-HN")}
- Le quedarían al vendedor: L ${neto.toLocaleString("es-HN")}
${raza ? `- Raza: ${raza}` : ""}

Respondé directo a esa pregunta (máximo 2 frases, en español de Honduras, sin inventar datos que no te di): decile si le sale rentable vender a este precio neto o si mejor rechaza/negocia un punto medio. No repitas los números, andá directo al consejo.`;

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 600,
        reasoning_effort: "minimal",
      }),
    });

    if (!resp.ok) {
      const detalle = await resp.text().catch(() => "");
      console.error("OpenAI error", resp.status, detalle);
      return Response.json({ ok: false, error: "La IA no pudo responder" }, { status: 502 });
    }

    const data = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const sugerencia = data.choices?.[0]?.message?.content?.trim();
    if (!sugerencia) {
      console.error("OpenAI sin contenido", JSON.stringify(data));
      return Response.json({ ok: false, error: "La IA no pudo responder" }, { status: 502 });
    }

    return Response.json({ ok: true, sugerencia });
  } catch {
    return Response.json({ ok: false, error: "No se pudo contactar a la IA" }, { status: 502 });
  }
}
