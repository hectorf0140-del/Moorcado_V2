import type { Anuncio, Usuario } from "@/lib/types";
import { formatEdad, formatLempiras } from "@/lib/format";
import AnimalImage from "@/components/AnimalImage";

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-lg bg-white p-2">
      <p className="text-[10px] uppercase text-moorcado-gray-dark/40">{label}</p>
      <p className="truncate font-medium text-moorcado-gray-dark">{valor}</p>
    </div>
  );
}

/** Detalle completo de una publicación, para que un moderador la revise sin salir del panel. */
export default function AnuncioResumenModeracion({
  anuncio,
  vendedor,
}: {
  anuncio: Anuncio;
  vendedor?: Usuario;
}) {
  return (
    <div className="space-y-3">
      {anuncio.imagenes && anuncio.imagenes.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {anuncio.imagenes.map((src, i) => (
            <AnimalImage
              key={i}
              src={src}
              colorPrimario={anuncio.colorPrimario}
              colorSecundario={anuncio.colorSecundario}
              className="h-20 w-28 shrink-0 rounded-lg"
            />
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <Campo label="Título" valor={anuncio.titulo} />
        <Campo label="Precio" valor={formatLempiras(anuncio.precio)} />
        <Campo label="Raza" valor={anuncio.raza} />
        <Campo label="Edad" valor={formatEdad(anuncio.edadMeses)} />
        <Campo label="Peso" valor={`${anuncio.pesoKg} kg`} />
        <Campo label="Sexo" valor={anuncio.sexo} />
        <Campo label="Registro SAG" valor={anuncio.registroSag ? "Sí" : "No"} />
        <Campo label="Vistas" valor={String(anuncio.vistas)} />
        <Campo
          label="Publicado"
          valor={new Date(anuncio.creadoEn).toLocaleDateString("es-HN")}
        />
        <Campo label="Vendedor" valor={vendedor?.nombre ?? anuncio.vendedorId} />
        <Campo label="Correo vendedor" valor={vendedor?.correo ?? "—"} />
        <Campo
          label="Ubicación"
          valor={`${anuncio.departamento} · ${anuncio.municipio}`}
        />
      </div>
      {anuncio.descripcion && (
        <p className="rounded-lg bg-white p-2.5 text-xs text-moorcado-gray-dark/70">
          {anuncio.descripcion}
        </p>
      )}
      {anuncio.retiradoPorModeracion && (
        <p className="rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-600">
          Retirada por moderación: {anuncio.retiradoMotivo || "sin motivo registrado"}
        </p>
      )}
    </div>
  );
}
