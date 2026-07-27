/**
 * Exportar ganancias/reportes financieros del panel de administrador.
 * Todo corre en el navegador a partir de datos ya cargados en el store
 * (transacciones/usuarios) — no hay ruta de servidor, exceljs y jspdf
 * generan el archivo como Blob y se descargan directo.
 */
import type { Anuncio, Transaccion, Usuario } from "./types";
import { calcularComision } from "./comision";
import { formatLempiras } from "./format";

function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

function enRango(fechaIso: string, desde: Date, hasta: Date): boolean {
  const f = new Date(fechaIso).getTime();
  return f >= desde.getTime() && f <= hasta.getTime();
}

interface FilaReporte {
  fecha: string;
  animal: string;
  comprador: string;
  vendedor: string;
  precio: number;
  comision: number;
  neto: number;
}

function construirFilas(
  transacciones: Transaccion[],
  usuarios: Usuario[],
  anuncios: Anuncio[],
  desde: Date,
  hasta: Date
): FilaReporte[] {
  return transacciones
    .filter((t) => enRango(t.fecha, desde, hasta))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .map((t) => {
      const comision = calcularComision(t.precio, "gratuito");
      return {
        fecha: new Date(t.fecha).toLocaleDateString("es-HN"),
        animal: anuncios.find((a) => a.id === t.animalId)?.titulo ?? t.animalId,
        comprador: usuarios.find((u) => u.id === t.compradorId)?.nombre ?? t.compradorId,
        vendedor: usuarios.find((u) => u.id === t.vendedorId)?.nombre ?? t.vendedorId,
        precio: t.precio,
        comision,
        neto: t.precio - comision,
      };
    });
}

export async function generarExcelGanancias(
  transacciones: Transaccion[],
  usuarios: Usuario[],
  anuncios: Anuncio[],
  desde: Date,
  hasta: Date
): Promise<void> {
  const filas = construirFilas(transacciones, usuarios, anuncios, desde, hasta);

  const ExcelJS = (await import("exceljs")).default;
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Ganancias");

  hoja.columns = [
    { header: "Fecha", key: "fecha", width: 14 },
    { header: "Animal", key: "animal", width: 28 },
    { header: "Comprador", key: "comprador", width: 22 },
    { header: "Vendedor", key: "vendedor", width: 22 },
    { header: "Precio (L)", key: "precio", width: 16 },
    { header: "Comisión Moorcado (L)", key: "comision", width: 20 },
    { header: "Neto vendedor (L)", key: "neto", width: 18 },
  ];
  hoja.getRow(1).font = { bold: true };
  hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15492B" } };
  hoja.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  filas.forEach((f) => hoja.addRow(f));

  const totalPrecio = filas.reduce((acc, f) => acc + f.precio, 0);
  const totalComision = filas.reduce((acc, f) => acc + f.comision, 0);
  const totalNeto = filas.reduce((acc, f) => acc + f.neto, 0);
  const filaTotal = hoja.addRow({
    fecha: "",
    animal: "",
    comprador: "",
    vendedor: "Totales",
    precio: totalPrecio,
    comision: totalComision,
    neto: totalNeto,
  });
  filaTotal.font = { bold: true };

  const buffer = await libro.xlsx.writeBuffer();
  const nombre = `moorcado-ganancias-${desde.toISOString().slice(0, 10)}_a_${hasta.toISOString().slice(0, 10)}.xlsx`;
  descargarBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    nombre
  );
}

export async function generarPdfReportes(
  transacciones: Transaccion[],
  usuarios: Usuario[],
  anuncios: Anuncio[],
  desde: Date,
  hasta: Date
): Promise<void> {
  const filas = construirFilas(transacciones, usuarios, anuncios, desde, hasta);

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
  doc.text("Moorcado — Reporte de ganancias", 14, 17);
  doc.setFontSize(10);
  doc.text(
    `${desde.toLocaleDateString("es-HN")} — ${hasta.toLocaleDateString("es-HN")}`,
    14,
    24
  );

  doc.setTextColor(30, 30, 30);
  const totalComision = filas.reduce((acc, f) => acc + f.comision, 0);
  const totalNeto = filas.reduce((acc, f) => acc + f.neto, 0);

  doc.setFontSize(11);
  doc.text(`Ventas en el rango: ${filas.length}`, 14, 38);
  doc.text(`Ingresos por comisión: ${formatLempiras(totalComision)}`, 14, 45);
  doc.text(`Total neto para vendedores: ${formatLempiras(totalNeto)}`, 14, 52);
  doc.setDrawColor(...DORADO);
  doc.setLineWidth(1);
  doc.line(14, 57, 196, 57);

  autoTable(doc, {
    startY: 63,
    head: [["Fecha", "Animal", "Comprador", "Vendedor", "Precio", "Comisión", "Neto"]],
    body: filas.map((f) => [
      f.fecha,
      f.animal,
      f.comprador,
      f.vendedor,
      formatLempiras(f.precio),
      formatLempiras(f.comision),
      formatLempiras(f.neto),
    ]),
    headStyles: { fillColor: VERDE },
    styles: { fontSize: 8 },
  });

  doc.save(
    `moorcado-reporte-${desde.toISOString().slice(0, 10)}_a_${hasta.toISOString().slice(0, 10)}.pdf`
  );
}
