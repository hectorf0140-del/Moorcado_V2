import Link from "next/link";
import MoorcadoIcon from "./MoorcadoIcon";

export default function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <MoorcadoIcon className="h-9 w-9" />
      {!compact && (
        <span
          className={`font-display text-xl font-bold tracking-tight ${light ? "text-white" : "text-moorcado-gray-dark"}`}
        >
          Moor<span className={light ? "text-white/80" : "text-moorcado-green"}>cado</span>
        </span>
      )}
    </Link>
  );
}
