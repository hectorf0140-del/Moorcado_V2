const TAMANOS = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-4",
} as const;

const COLORES = {
  verde: "border-moorcado-green",
  gris: "border-moorcado-gray-dark",
  blanco: "border-white",
} as const;

export function Spinner({
  tamano = "md",
  color = "verde",
  className = "",
}: {
  tamano?: keyof typeof TAMANOS;
  color?: keyof typeof COLORES;
  className?: string;
}) {
  return (
    <div
      className={`animate-spin rounded-full border-t-transparent ${TAMANOS[tamano]} ${COLORES[color]} ${className}`}
    />
  );
}

/** Spinner centrado a media pantalla — reemplaza el mismo bloque que se repetía en cada página con carga inicial. */
export function PantallaCargando({ color = "verde" }: { color?: keyof typeof COLORES }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner color={color} />
    </div>
  );
}
