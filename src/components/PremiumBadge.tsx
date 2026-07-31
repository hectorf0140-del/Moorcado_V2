import { Crown } from "lucide-react";

/** Pill dorada con corona — el lenguaje visual de "esto es premium" usado en
 * Rumi, /planes y cualquier otra vitrina de un beneficio de pago. */
export default function PremiumBadge({
  children,
  floating = false,
  compact = false,
}: {
  children: React.ReactNode;
  floating?: boolean;
  compact?: boolean;
}) {
  if (floating) {
    return (
      <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-moorcado-gold px-3.5 py-1.5 text-xs font-bold text-white shadow">
        <Crown className="h-3.5 w-3.5" />
        {children}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-moorcado-gold font-bold text-white ${
        compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      <Crown className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {children}
    </span>
  );
}
