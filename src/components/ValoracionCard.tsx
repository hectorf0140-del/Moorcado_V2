import type { ValoracionResult } from "@/lib/types";
import { formatLempiras } from "@/lib/format";
import { TrendingUp } from "lucide-react";

export default function ValoracionCard({ resultado }: { resultado: ValoracionResult }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1F4D2C]/5 to-[#D9A441]/5 p-5 ring-1 ring-[#1F4D2C]/10">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-moorcado-green" />
        <h3 className="font-display font-bold text-moorcado-gray-dark">
          Análisis IA Moorcado
        </h3>
        <span className="ml-auto rounded-full bg-moorcado-green/10 px-2.5 py-0.5 text-[11px] font-semibold text-moorcado-green">
          Beta
        </span>
      </div>
      <p className="mt-1 text-xs text-moorcado-gray-dark/50">
        Estimación basada en raza, peso y edad del mercado hondureño
      </p>

      <p className="mt-4 font-display text-3xl font-extrabold text-moorcado-green">
        {formatLempiras(resultado.estimado)}
      </p>
      <p className="text-sm text-moorcado-gray-dark/60">
        Rango de mercado:{" "}
        <span className="font-medium text-moorcado-gray-dark">
          {formatLempiras(resultado.rangoMin)} – {formatLempiras(resultado.rangoMax)}
        </span>
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-moorcado-gray-dark/50">Confianza:</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            resultado.confianza === "Alta"
              ? "bg-moorcado-green/15 text-moorcado-green"
              : "bg-moorcado-gold/20 text-moorcado-brown"
          }`}
        >
          {resultado.confianza}
        </span>
      </div>
    </div>
  );
}
