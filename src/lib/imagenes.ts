// Palabra clave en inglés por raza para que las fotos de ejemplo (loremflickr)
// muestren un animal parecido a la raza anunciada en vez de una vaca genérica.
const PALABRA_CLAVE_POR_RAZA: Record<string, string> = {
  Brahman: "brahman,cattle",
  Holstein: "holstein,cow",
  Jersey: "jersey,cow",
  "Pardo Suizo": "brownswiss,cattle",
  Angus: "angus,cattle",
  Brangus: "brangus,cattle",
  Indubrasil: "indubrasil,zebu",
  Gyr: "gyr,zebu",
  Criollo: "creole,cattle",
  Simmental: "simmental,cattle",
};

export function imagenPlaceholderPorRaza(
  raza: string,
  seed: string | number,
  w = 800,
  h = 600
): string {
  const palabraClave = PALABRA_CLAVE_POR_RAZA[raza] ?? "cow,cattle";
  return `https://loremflickr.com/${w}/${h}/${palabraClave}?lock=${seed}`;
}

/**
 * Redimensiona y comprime una foto en el navegador antes de guardarla,
 * para no inflar el JSONB de Supabase con fotos de cámara a resolución
 * completa (varios MB cada una).
 */
export function comprimirImagen(
  archivo: File,
  maxAncho = 1280,
  calidad = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(lector.error);
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.onload = () => {
        const escala = Math.min(1, maxAncho / img.width);
        const ancho = Math.round(img.width * escala);
        const alto = Math.round(img.height * escala);

        const canvas = document.createElement("canvas");
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo procesar la imagen"));
          return;
        }
        ctx.drawImage(img, 0, 0, ancho, alto);
        resolve(canvas.toDataURL("image/jpeg", calidad));
      };
      img.src = lector.result as string;
    };
    lector.readAsDataURL(archivo);
  });
}
