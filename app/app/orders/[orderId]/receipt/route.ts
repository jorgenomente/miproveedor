import type PDFKit from "pdfkit";
import { NextResponse, type NextRequest } from "next/server";
import { getOrderDetail, type OrderDetail } from "../../actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PdfProvider = {
  name: string;
  phone?: string | null;
  email?: string | null;
};

type PdfClient = {
  name: string;
  user?: string | null;
  phone?: string | null;
  id?: string | null;
};

type PdfRow = {
  date?: string | null;
  orderNumber: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  balance: number;
};

const PRIMARY = "#4B4EAA";
const TEXT = "#111827";
const MUTED = "#6B7280";
const LINE = "#E6E6E6";
const ROW_ALT = "#FAFAFA";
const HEADER_BG = "#F8F9FA";
const PAGE_MARGIN = 34;

const formatDate = (value?: string | number | Date | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("es-AR");
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

function drawHeader(doc: PDFKit.PDFDocument, issuedAt: Date) {
  const width = doc.page.width - PAGE_MARGIN * 2;
  const y = PAGE_MARGIN;

  doc
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_MARGIN + width, y)
    .strokeColor(LINE)
    .lineWidth(1)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(PRIMARY)
    .text("REMITO", PAGE_MARGIN, y + 12, { width, align: "center" });

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(MUTED)
    .text(`Fecha: ${formatDate(issuedAt)}`, PAGE_MARGIN, y + 36, { width, align: "center" });

  doc
    .moveTo(PAGE_MARGIN, y + 60)
    .lineTo(PAGE_MARGIN + width, y + 60)
    .strokeColor(LINE)
    .lineWidth(1)
    .stroke();

  return y + 78;
}

function drawProviderBlock(doc: PDFKit.PDFDocument, provider: PdfProvider, startY: number) {
  const width = doc.page.width - PAGE_MARGIN * 2;
  const line = [provider.phone ? `Tel: ${provider.phone}` : null, provider.email].filter(Boolean).join(" · ");
  doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT).text("Jorge Pulido", PAGE_MARGIN, startY, {
    width,
    align: "left",
  });
  if (line) {
    doc.font("Helvetica").fontSize(10.5).fillColor(MUTED).text(line, PAGE_MARGIN, startY + 16, { width, align: "left" });
  }
  return startY + 34;
}

function drawClientCard(doc: PDFKit.PDFDocument, client: PdfClient, startY: number) {
  const width = doc.page.width - PAGE_MARGIN * 2;
  const cardHeight = 90;
  doc
    .roundedRect(PAGE_MARGIN, startY, width, cardHeight, 6)
    .strokeColor(LINE)
    .lineWidth(1)
    .fillAndStroke("#FFFFFF", LINE);

  const padding = 14;
  const x = PAGE_MARGIN + padding;
  let y = startY + padding;

  doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT).text(client.name || "Cliente", x, y, { width: width - padding * 2 });
  y += 18;

  const lines = [
    client.user ? `Usuario: ${client.user}` : null,
    client.phone ? `Tel: ${client.phone}` : null,
    client.id ? `ID Cliente: ${client.id}` : null,
  ].filter(Boolean);

  doc.font("Helvetica").fontSize(10.5).fillColor(MUTED);
  lines.forEach((line) => {
    doc.text(line as string, x, y, { width: width - padding * 2, lineBreak: false });
    y += 14;
  });

  return startY + cardHeight + 22;
}

function drawTable(doc: PDFKit.PDFDocument, rows: PdfRow[], startY: number) {
  const availableWidth = doc.page.width - PAGE_MARGIN * 2;
  const weights = [0.14, 0.13, 0.3, 0.09, 0.11, 0.11, 0.12];
  const base = availableWidth / weights.reduce((acc, w) => acc + w, 0);

  const columns: { key: keyof PdfRow; label: string; width: number; align?: "left" | "right"; format?: "money" | "text" | "date" | "number"; noWrap?: boolean }[] =
    [
      { key: "date", label: "Fecha", width: base * weights[0], format: "date", noWrap: true },
      { key: "orderNumber", label: "Pedido", width: base * weights[1], align: "right", noWrap: true },
      { key: "description", label: "Descripción", width: base * weights[2], format: "text" },
      { key: "quantity", label: "Cant.", width: base * weights[3], align: "right", format: "number", noWrap: true },
      { key: "unitPrice", label: "Unitario", width: base * weights[4], align: "right", format: "money", noWrap: true },
      { key: "subtotal", label: "Subtotal", width: base * weights[5], align: "right", format: "money", noWrap: true },
      { key: "balance", label: "Saldo", width: base * weights[6], align: "right", format: "money", noWrap: true },
    ];

  let y = startY;
  const headerHeight = 28;
  const rowHeight = 28;

  const renderHeader = () => {
    doc.rect(PAGE_MARGIN, y, availableWidth, headerHeight).fill(HEADER_BG);
    let x = PAGE_MARGIN + 10;
    columns.forEach((col) => {
      doc
        .fillColor(TEXT)
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .text(col.label, x, y + 8, { width: col.width - 14, align: col.align ?? "left", lineBreak: false });
      x += col.width;
    });
    y += headerHeight;
    doc
      .strokeColor(LINE)
      .lineWidth(0.8)
      .moveTo(PAGE_MARGIN, y)
      .lineTo(PAGE_MARGIN + availableWidth, y)
      .stroke();
  };

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > doc.page.height - PAGE_MARGIN - 120) {
      doc.addPage();
      y = PAGE_MARGIN;
      renderHeader();
    }
  };

  renderHeader();

  rows.forEach((row, index) => {
    const descCol = columns.find((c) => c.key === "description")!;
    const descText = row.description ?? "—";
    const descHeight = doc.heightOfString(descText, {
      width: descCol.width - 14,
      align: "left",
    });
    const dynamicHeight = Math.max(rowHeight, descHeight + 14);

    ensureSpace(dynamicHeight);
    const isAlt = index % 2 === 1;

    doc.rect(PAGE_MARGIN, y, availableWidth, dynamicHeight).fillColor(isAlt ? ROW_ALT : "#FFFFFF").fill();

    let x = PAGE_MARGIN + 10;
    columns.forEach((col) => {
      const raw = row[col.key];
      let text: string;
      switch (col.format) {
        case "money":
          text = `$ ${formatMoney(raw as number)}`;
          break;
        case "date":
          text = formatDate(raw as string);
          break;
        case "number":
          text = Number.isFinite(raw as number) ? new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(raw as number) : "—";
          break;
        default:
          text = (raw as string) ?? "—";
      }

      doc
        .fillColor(TEXT)
        .font("Helvetica")
        .fontSize(10)
        .text(text, x, y + 7, { width: col.width - 14, align: col.align ?? "left", lineBreak: col.noWrap ? false : undefined });
      x += col.width;
    });

    doc
      .strokeColor("#EFEFEF")
      .lineWidth(0.6)
      .moveTo(PAGE_MARGIN, y + dynamicHeight)
      .lineTo(PAGE_MARGIN + availableWidth, y + dynamicHeight)
      .stroke();

    y += dynamicHeight;
  });

  return y + 20;
}

function drawTotals(doc: PDFKit.PDFDocument, totalDue: number, startY: number) {
  const width = doc.page.width - PAGE_MARGIN * 2;
  const cardWidth = 220;
  const cardHeight = 90;
  const x = PAGE_MARGIN + (width - cardWidth);
  const y = startY;

  doc
    .roundedRect(x, y, cardWidth, cardHeight, 8)
    .strokeColor(LINE)
    .lineWidth(1)
    .fillAndStroke("#FFFFFF", LINE);

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(MUTED)
    .text("TOTAL ADEUDADO", x + 14, y + 18, { width: cardWidth - 28, align: "right" });

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(TEXT)
    .text(`$ ${formatMoney(totalDue)}`, x + 14, y + 42, { width: cardWidth - 28, align: "right", lineBreak: false });

  doc
    .moveTo(x + 18, y + cardHeight - 18)
    .lineTo(x + cardWidth - 18, y + cardHeight - 18)
    .strokeColor(LINE)
    .lineWidth(1)
    .stroke();

  return y + cardHeight + 24;
}

function drawFooter(doc: PDFKit.PDFDocument, startY: number) {
  const width = doc.page.width - PAGE_MARGIN * 2;
  const y = Math.max(startY + 24, doc.page.height - PAGE_MARGIN - 120);

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#777777").text("Gracias por su confianza.", PAGE_MARGIN, y, { width });
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#777777")
    .text("Para información de pago consulte alias/CBU con su proveedor habitual.", PAGE_MARGIN, y + 16, { width });
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor("#777777")
    .text("Ante discrepancias, comuníquese dentro de las próximas 48 hs.", PAGE_MARGIN, y + 30, { width });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#9CA3AF")
    .text("Generado con miproveedor.app", PAGE_MARGIN, doc.page.height - PAGE_MARGIN - 14, { width, align: "right" });
}

async function buildPdf(order: OrderDetail): Promise<Buffer> {
  const pdfModule = await import("pdfkit/js/pdfkit.standalone.js");
  const PDFDocument = (pdfModule as any).default ?? (pdfModule as any);
  if (!PDFDocument) {
    throw new Error("pdfkit no disponible en el runtime.");
  }

  const doc: PDFKit.PDFDocument = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
  const buffers: Buffer[] = [];
  doc.on("data", (chunk) => buffers.push(chunk as Buffer));
  const endPromise = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(buffers))));

  const provider: PdfProvider = {
    name: order.provider.name,
    phone: order.provider.contact_phone ?? undefined,
    email: order.provider.contact_email ?? undefined,
  };

  const client: PdfClient = {
    name: order.client.name,
    user: order.contactName ?? order.client.contact_name ?? undefined,
    phone: order.client.contact_phone ?? undefined,
    id: order.client.slug ?? order.client.id ?? undefined,
  };

  const rows: PdfRow[] = order.items.map((item) => {
    const subtotal = item.subtotal ?? item.unitPrice * item.quantity;
    return {
      date: order.createdAt,
      orderNumber: order.id.slice(0, 8),
      description: `${item.productName}${item.unit ? ` (${item.unit})` : ""}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal,
      balance: subtotal,
    };
  });

  const totalDue = rows.reduce((acc, row) => acc + row.balance, 0);

  const afterHeader = drawHeader(doc, new Date(order.createdAt ?? Date.now()));
  const afterProvider = drawProviderBlock(doc, provider, afterHeader + 4);
  const tableStart = drawClientCard(doc, client, afterProvider + 12);
  const afterTable = drawTable(doc, rows, tableStart + 10);

  let totalsY = afterTable;
  if (totalsY > doc.page.height - PAGE_MARGIN - 180) {
    doc.addPage();
    totalsY = PAGE_MARGIN;
  }

  const afterTotals = drawTotals(doc, totalDue, totalsY);
  drawFooter(doc, afterTotals);

  doc.end();
  return endPromise;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const params = await context.params;
  const detail = await getOrderDetail(params.orderId);
  if (!detail.success) {
    return NextResponse.json({ error: detail.errors.join(" · ") }, { status: 404 });
  }

  const pdf = await buildPdf(detail.order);
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="remito-${detail.order.id}.pdf"`,
    },
  });
}
