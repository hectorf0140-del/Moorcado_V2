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
 * Redimensiona una foto en el navegador antes de subirla/guardarla, para no
 * mandar fotos de cámara a resolución completa (varios MB cada una).
 */
function redimensionarACanvas(archivo: File, maxAncho: number): Promise<HTMLCanvasElement> {
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
        resolve(canvas);
      };
      img.src = lector.result as string;
    };
    lector.readAsDataURL(archivo);
  });
}

/** Variante data URL (base64) — se mantiene por compatibilidad, ya no se usa para publicar. */
export async function comprimirImagen(
  archivo: File,
  maxAncho = 1280,
  calidad = 0.8
): Promise<string> {
  const canvas = await redimensionarACanvas(archivo, maxAncho);
  return canvas.toDataURL("image/jpeg", calidad);
}

/**
 * Igual que `comprimirImagen`, pero devuelve un Blob JPEG en vez de un data
 * URL — para subir a Supabase Storage en vez de guardar el base64 completo
 * dentro del JSONB del anuncio (eso llenaba el localStorage del navegador y
 * hacía lentas/inestables las cargas del catálogo).
 */
export function comprimirImagenBlob(
  archivo: File,
  maxAncho = 1280,
  calidad = 0.8
): Promise<Blob> {
  return redimensionarACanvas(archivo, maxAncho).then(
    (canvas) =>
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo comprimir la imagen"))),
          "image/jpeg",
          calidad
        );
      })
  );
}
