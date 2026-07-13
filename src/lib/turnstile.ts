/** Llama a /api/verificar-turnstile (el único lugar que ve la llave secreta). */
export async function verificarTurnstile(token: string): Promise<boolean> {
  try {
    const resp = await fetch("/api/verificar-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = (await resp.json()) as { ok: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}
