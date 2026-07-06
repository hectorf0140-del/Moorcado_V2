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
