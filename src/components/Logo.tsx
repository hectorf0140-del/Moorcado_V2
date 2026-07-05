import Link from "next/link";
import { PawPrint } from "lucide-react";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-moorcado-green text-white">
        <PawPrint className="h-5 w-5" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="font-display text-xl font-bold tracking-tight text-moorcado-gray-dark">
          Moor<span className="text-moorcado-green">cado</span>
        </span>
      )}
    </Link>
  );
}
