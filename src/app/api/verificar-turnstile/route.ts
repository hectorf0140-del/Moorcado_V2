/**
 * Verifica un token de Cloudflare Turnstile (captcha de registro/login).
 * Único endpoint de servidor de la app — necesario porque la verificación
 * real requiere la llave secreta (TURNSTILE_SECRET_KEY), que nunca debe
 * llegar al navegador. Si no hay llave secreta configurada, se rechaza
 * (fail-closed): más vale bloquear que dejar pasar un captcha sin validar.
 */
export async function POST(request: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return Response.json({ ok: false, error: "Turnstile no configurado" }, { status: 500 });
  }

  const { token } = (await request.json()) as { token?: string };
  if (!token) {
    return Response.json({ ok: false, error: "Falta el token" }, { status: 400 });
  }

  try {
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
    });
    const data = (await resp.json()) as { success: boolean };
    return Response.json({ ok: data.success === true });
  } catch {
    return Response.json({ ok: false, error: "No se pudo contactar a Turnstile" }, { status: 502 });
  }
}
