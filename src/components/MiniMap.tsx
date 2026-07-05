import { MapPin } from "lucide-react";
import { latLngToPercent } from "@/lib/geo";

export default function MiniMap({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label?: string;
}) {
  const { x, y } = latLngToPercent(lat, lng);

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-[#dfeee0]">
      <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#2E7D32" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div
        className="absolute -translate-x-1/2 -translate-y-full"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <MapPin className="h-8 w-8 fill-moorcado-green text-white drop-shadow" />
      </div>
      {label && (
        <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-moorcado-gray-dark shadow">
          {label}
        </span>
      )}
    </div>
  );
}
