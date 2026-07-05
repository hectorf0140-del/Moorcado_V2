import { ShieldCheck } from "lucide-react";

export default function VerifiedBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const cls =
    size === "sm"
      ? "text-[10px] px-1.5 py-0.5 gap-0.5"
      : "text-xs px-2 py-1 gap-1";
  return (
    <span
      className={`inline-flex items-center rounded-full bg-moorcado-green/10 font-semibold text-moorcado-green ${cls}`}
    >
      <ShieldCheck className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      Verificado
    </span>
  );
}
