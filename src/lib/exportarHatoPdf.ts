/**
 * Reporte PDF del hato de Rumi — mismo patrón que exportarReportes.ts
 * (jsPDF + jspdf-autotable, todo client-side, sin ruta de servidor).
 * Con `resumenEjecutivo` (Rumi Pro) agrega tendencia de valor, salud del
 * hato y agenda veterinaria — el diferencial de la sección Pro.
 */
import type { AnimalHato, Usuario } from "./types";
import { formatLempiras } from "./format";
import {
  TIPOS_CITA,
  citasPendientesOrdenadas,
  proximaRevisionDe,
  tendenciaValorHato,
  ultimaVacunaCompletadaDe,
} from "./hato";

/** jspdf-autotable anota `lastAutoTable` en el doc en tiempo de ejecución, sin tipo propio. */
type DocConAutoTable = { lastAutoTable?: { finalY: number } };

const ESTADO_LABEL: Record<AnimalHato["estado"], string> = {
  sana: "Sana",
  en_tratamiento: "En tratamiento",
  prenada: "Preñada",
  seca: "Seca",
};

export async function generarPdfHato(
  usuario: Usuario,
  hato: AnimalHato[],
  opts?: { resumenEjecutivo?: boolean }
): Promise<void> {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF();
  const VERDE: [number, number, number] = [21, 73, 43];
  const DORADO: [number, number, number] = [227, 171, 70];

  doc.setFillColor(...VERDE);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("Moorcado — Reporte de mi hato (Rumi)", 14, 17);
  doc.setFontSize(10);
  doc.text(
    `${usuario.nombreEmpresa ?? usuario.nombre} · ${new Date().toLocaleDateString("es-HN")}`,
    14,
    24
  );

  doc.setTextColor(30, 30, 30);
  const valorTotal = hato.reduce((acc, a) => acc + a.valorEstimado, 0);
  const produccionTotal = hato.reduce((acc, a) => acc + (a.produccionLitrosDia ?? 0), 0);

  doc.setFontSize(11);
  doc.text(`Animales registrados: ${hato.length}`, 14, 38);
  doc.text(`Valor estimado del hato: ${formatLempiras(valorTotal)}`, 14, 45);
  doc.text(`Producción diaria total: ${produccionTotal} L`, 14, 52);
  doc.setDrawColor(...DORADO);
  doc.setLineWidth(1);
  doc.line(14, 57, 196, 57);

  autoTable(doc, {
    startY: 63,
    head: [["Animal", "Raza", "Edad", "Estado", "Producción", "Última vacuna", "Próxima revisión", "Valor"]],
    body: hato.map((a) => [
      a.nombre,
      a.raza,
      `${a.edadMeses} m`,
      ESTADO_LABEL[a.estado],
      a.produccionLitrosDia ? `${a.produccionLitrosDia} L/día` : "—",
      ultimaVacunaCompletadaDe(a) ?? "—",
      proximaRevisionDe(a) ?? "—",
      formatLempiras(a.valorEstimado),
    ]),
    headStyles: { fillColor: VERDE },
    styles: { fontSize: 8 },
  });

  if (opts?.resumenEjecutivo) {
    let y = ((doc as unknown as DocConAutoTable).lastAutoTable?.finalY ?? 63) + 12;

    doc.setTextColor(...VERDE);
    doc.setFontSize(13);
    doc.text("Resumen ejecutivo — Rumi Pro", 14, y);
    y += 8;

    const tendencia = tendenciaValorHato(usuario.hatoHistorial ?? []);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.text(
      tendencia.cambioPct === null
        ? "Tendencia de valor: aún no hay suficiente historial (vuelve en unos días)."
        : `Tendencia de valor vs. hace 30 días: ${tendencia.cambioPct >= 0 ? "+" : ""}${tendencia.cambioPct.toFixed(1)}% (${formatLempiras(tendencia.hace30Dias ?? 0)} → ${formatLempiras(tendencia.actual)})`,
      14,
      y
    );
    y += 10;

    const conteoEstados = hato.reduce(
      (acc, a) => ({ ...acc, [a.estado]: (acc[a.estado] ?? 0) + 1 }),
      {} as Record<AnimalHato["estado"], number>
    );
    autoTable(doc, {
      startY: y,
      head: [["Estado de salud del hato", "Animales"]],
      body: (Object.keys(ESTADO_LABEL) as AnimalHato["estado"][]).map((estado) => [
        ESTADO_LABEL[estado],
        String(conteoEstados[estado] ?? 0),
      ]),
      headStyles: { fillColor: VERDE },
      styles: { fontSize: 9 },
      tableWidth: 90,
    });

    y = ((doc as unknown as DocConAutoTable).lastAutoTable?.finalY ?? y) + 10;

    const agenda = hato.flatMap((a) =>
      citasPendientesOrdenadas(a).map((c) => [
        a.nombre,
        TIPOS_CITA[c.tipo],
        c.fecha,
        c.veterinarioNombre ?? "Sin asignar",
      ])
    );
    doc.setFontSize(12);
    doc.setTextColor(...VERDE);
    doc.text("Agenda veterinaria", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Animal", "Tipo de visita", "Fecha", "Veterinario"]],
      body: agenda.length > 0 ? agenda : [["—", "Sin citas pendientes", "—", "—"]],
      headStyles: { fillColor: DORADO },
      styles: { fontSize: 8 },
    });
  }

  doc.save(`mi-hato-rumi-${new Date().toISOString().slice(0, 10)}.pdf`);
}
