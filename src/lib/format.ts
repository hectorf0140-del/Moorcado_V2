export function formatEdad(meses: number): string {
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  if (anios === 0) return `${resto} meses`;
  if (resto === 0) return `${anios} ${anios === 1 ? "año" : "años"}`;
  return `${anios} ${anios === 1 ? "año" : "años"} ${resto} m`;
}

export function formatLempiras(valor: number): string {
  return `L. ${valor.toLocaleString("es-HN")}`;
}

export function formatearCodigoReporte(numero: number): string {
  return `REP-${String(numero).padStart(6, "0")}`;
}
