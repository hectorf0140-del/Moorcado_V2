export default function StatCard({
  icon: Icon,
  label,
  value,
  accent = "green",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: "green" | "gold" | "brown" | "gray";
}) {
  const bg = {
    green: "bg-moorcado-green/10 text-moorcado-green",
    gold: "bg-moorcado-gold/15 text-moorcado-brown",
    brown: "bg-moorcado-brown/10 text-moorcado-brown",
    gray: "bg-moorcado-gray-light text-moorcado-gray-dark",
  }[accent];

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-3 font-display text-2xl font-bold text-moorcado-gray-dark">
        {value}
      </p>
      <p className="text-xs text-moorcado-gray-dark/60">{label}</p>
    </div>
  );
}
