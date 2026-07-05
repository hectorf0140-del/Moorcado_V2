import { Beef } from "lucide-react";

export default function AnimalImage({
  colorPrimario,
  colorSecundario,
  className = "",
  iconClassName = "w-10 h-10",
}: {
  colorPrimario: string;
  colorSecundario: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
      }}
    >
      <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
      <Beef className={`${iconClassName} text-white/90 drop-shadow`} strokeWidth={1.5} />
    </div>
  );
}
