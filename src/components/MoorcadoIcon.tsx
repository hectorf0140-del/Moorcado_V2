export default function MoorcadoIcon({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-moorcado.png"
      alt=""
      aria-hidden="true"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
