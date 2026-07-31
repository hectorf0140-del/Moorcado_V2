/**
 * Arma un link de WhatsApp (wa.me) a partir de un teléfono guardado en el
 * formato del sitio ("+504 9999-8888" o local de 8 dígitos). wa.me exige el
 * número completo sin signos ni espacios, con código de país.
 */
export function telefonoAWhatsappUrl(telefono: string, mensaje?: string): string {
  const digitos = telefono.replace(/\D/g, "");
  const conCodigo = digitos.length === 8 ? `504${digitos}` : digitos;
  const base = `https://wa.me/${conCodigo}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}
