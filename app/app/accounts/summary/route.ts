import type PDFKit from "pdfkit";
import { NextResponse, type NextRequest } from "next/server";
import { formatCurrency } from "@/lib/whatsapp";
import { getClientAccounts, type ClientAccount, type ProviderRow } from "../actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TransactionRow = {
  date: string;
  orderNumber: string;
  description: string;
  status: "pendiente" | "pagado" | "parcial" | "cancelado";
  amount: number;
  payments: number;
  balance: number;
};

type SummaryTotals = {
  totalOrders: number;
  totalPaid: number;
  totalDue: number;
};

const PRIMARY = "#4B4EAA";
const TEXT = "#111827";
const MUTED = "#4B5563";
const LINE = "#E5E7EB";
const PAGE_MARGIN = 40;

const shortId = (id: string) => (id?.length > 8 ? id.slice(0, 8) : id);
const formatDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("es-AR");
};

function buildTransactions(account: ClientAccount): { transactions: TransactionRow[]; summary: SummaryTotals } {
  const transactions: TransactionRow[] = account.orders
    .filter((order) => order.status !== "cancelado")
    .map((order) => {
      const approvedPayments = account.payments.filter((payment) => payment.orderId === order.id && payment.status === "approved");
      const paidTotal = approvedPayments.reduce((acc, payment) => acc + payment.amount, 0);
      const balance = Math.max(order.total - paidTotal, 0);
      const status: TransactionRow["status"] =
        balance <= 0 ? "pagado" : paidTotal > 0 ? "parcial" : "pendiente";

      return {
        date: order.createdAt ?? "",
        orderNumber: shortId(order.id),
        description: `Pedido ${shortId(order.id)}`,
        status,
        amount: order.total,
        payments: paidTotal,
        balance,
      };
    })
    .sort((a, b) => new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime());

  const summary = transactions.reduce(
    (acc, trx) => {
      acc.totalOrders += trx.amount;
      acc.totalPaid += trx.payments;
      acc.totalDue += trx.balance;
      return acc;
    },
    { totalOrders: 0, totalPaid: 0, totalDue: 0 } satisfies SummaryTotals,
  );

  return { transactions, summary };
}

function drawHeader(doc: PDFKit.PDFDocument, provider: ProviderRow, account: ClientAccount) {
  const pageWidth = doc.page.width - PAGE_MARGIN * 2;
  const titleY = PAGE_MARGIN;

  // Título centrado dominante
  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor(PRIMARY)
    .text("RESUMEN DE CUENTA", PAGE_MARGIN, titleY, { width: pageWidth, align: "center" });

  // Proveedor alineado a la izquierda (mediano) con espacio vertical
  const providerY = titleY + 30;
  doc.font("Helvetica-Bold").fontSize(16).fillColor(PRIMARY).text(provider.name ?? "Proveedor", PAGE_MARGIN, providerY, {
    width: pageWidth / 2,
    align: "left",
  });

  // Contacto izquierda
  const contactY = providerY + 18;
  const contactLine = [provider.contactPhone, provider.contactEmail].filter(Boolean).join(" · ");
  doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(contactLine, PAGE_MARGIN, contactY, {
    width: pageWidth / 2,
    align: "left",
  });

  // Fecha a la derecha, línea separada
  const issuedY = contactY + 14;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(MUTED)
    .text(`Emitido: ${new Date().toLocaleString("es-AR")}`, PAGE_MARGIN + pageWidth / 2, issuedY, {
      width: pageWidth / 2,
      align: "right",
    });

  const clientBlockY = issuedY + 22;
  doc.font("Helvetica-Bold").fontSize(13).fillColor(TEXT).text("Cliente:", PAGE_MARGIN, clientBlockY, {
    width: pageWidth,
    align: "center",
  });
  const clientDetails = [account.client.name, account.client.address, account.client.contactPhone].filter(Boolean).join(" · ");
  doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(clientDetails || "Sin datos", PAGE_MARGIN, clientBlockY + 16, {
    width: pageWidth,
    align: "center",
  });
}

function drawStatBlocks(doc: PDFKit.PDFDocument, summary: SummaryTotals, yStart: number) {
  const blocks = [
    { label: "Pedidos pendientes", value: formatCurrency(summary.totalDue) },
    { label: "Pagos registrados", value: formatCurrency(summary.totalPaid) },
    { label: "Saldo total adeudado", value: formatCurrency(summary.totalDue) },
  ];
  const width = 160;
  const height = 64;

  blocks.forEach((block, index) => {
    const x = PAGE_MARGIN + index * (width + 12);
    doc
      .rect(x, yStart, width, height)
      .lineWidth(1)
      .strokeColor(PRIMARY)
      .stroke();
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(block.label.toUpperCase(), x + 12, yStart + 10);
    doc.font("Helvetica-Bold").fontSize(18).fillColor(TEXT).text(block.value, x + 12, yStart + 28);
  });
}

function drawTable(
  doc: PDFKit.PDFDocument,
  transactions: TransactionRow[],
  startY: number,
) {
  const columns: { key: keyof TransactionRow; label: string; width: number; align?: "left" | "right" }[] = [
    { key: "date", label: "Fecha", width: 62 },
    { key: "orderNumber", label: "N° Pedido", width: 62 },
    { key: "description", label: "Descripción", width: 130 },
    { key: "status", label: "Estado", width: 62 },
    { key: "amount", label: "Monto Pedido", width: 70, align: "right" },
    { key: "payments", label: "Pagos Aplicados", width: 70, align: "right" },
    { key: "balance", label: "Saldo Pendiente", width: 78, align: "right" },
  ];

  const tableWidth = columns.reduce((acc, col) => acc + col.width, 0);
  let y = startY;

  const renderHeader = () => {
    doc.rect(PAGE_MARGIN, y, tableWidth, 24).fill(PRIMARY);
    let x = PAGE_MARGIN + 6;
    columns.forEach((col) => {
      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(col.label, x, y + 6, { width: col.width - 12, align: col.align ?? "left" });
      x += col.width;
    });
    y += 34;
  };

  const ensureSpace = () => {
    if (y > doc.page.height - PAGE_MARGIN - 40) {
      doc.addPage();
      y = PAGE_MARGIN;
      renderHeader();
    }
  };

  renderHeader();

  transactions.forEach((trx, index) => {
    ensureSpace();
    const rowHeight = 24;
    const isEven = index % 2 === 0;
    doc
      .rect(PAGE_MARGIN, y, tableWidth, rowHeight)
      .fillColor(isEven ? "#F9FAFB" : "#FFFFFF")
      .fill();

    let x = PAGE_MARGIN + 6;
    columns.forEach((col) => {
      const value = trx[col.key];
      const text =
        typeof value === "number"
          ? formatCurrency(value)
          : col.key === "date"
            ? formatDate(value)
            : value;

      doc
        .fillColor(TEXT)
        .font("Helvetica")
        .fontSize(9.5)
        .text(text ?? "", x, y + 6, { width: col.width - 12, align: col.align ?? "left" });
      x += col.width;
    });

    doc
      .strokeColor("#E5E5E5")
      .lineWidth(0.6)
      .moveTo(PAGE_MARGIN, y + rowHeight)
      .lineTo(PAGE_MARGIN + tableWidth, y + rowHeight)
      .stroke();

    y += rowHeight;
  });

  return y;
}

function drawTotals(doc: PDFKit.PDFDocument, summary: SummaryTotals, y: number) {
  const labelWidth = 220;
  const valueWidth = 160;
  const blockX = doc.page.width - PAGE_MARGIN - (labelWidth + valueWidth);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(TEXT)
    .text("TOTAL DE PEDIDOS", blockX, y, { align: "right", width: labelWidth });
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(TEXT)
    .text(formatCurrency(summary.totalOrders), blockX + labelWidth, y, { align: "right", width: valueWidth });
  y += 18;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(TEXT)
    .text("PAGOS REGISTRADOS", blockX, y, { align: "right", width: labelWidth });
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(TEXT)
    .text(formatCurrency(summary.totalPaid), blockX + labelWidth, y, { align: "right", width: valueWidth });
  y += 22;

  const boxWidth = labelWidth + valueWidth;
  const boxHeight = 36;
  const boxX = doc.page.width - PAGE_MARGIN - boxWidth;
  doc.rect(boxX, y, boxWidth, boxHeight).fill(PRIMARY);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#FFFFFF")
    .text(`SALDO TOTAL ADEUDADO: ${formatCurrency(summary.totalDue)}`, boxX + 10, y + 10, {
      width: boxWidth - 20,
      align: "left",
    });
}

function drawFooter(doc: PDFKit.PDFDocument) {
  const y = doc.page.height - PAGE_MARGIN - 70;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(TEXT)
    .text("Este resumen refleja el estado actualizado de su cuenta corriente.", PAGE_MARGIN, y);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(MUTED)
    .text("acceda a su link único de pedido para mas iformacion", PAGE_MARGIN, y + 14, { width: 520 });
  doc.font("Helvetica").fontSize(8).fillColor(MUTED).text("Consulte los plazos sugeridos con su proveedor", PAGE_MARGIN, y + 26, { width: 520 });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(MUTED)
    .text("Por favor notifíquenos cualquier discrepancia dentro de las 48 hs.", PAGE_MARGIN, y + 52);
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(MUTED)
    .text("Creado con miproveedor.app", PAGE_MARGIN, doc.page.height - PAGE_MARGIN - 12, {
      width: doc.page.width - PAGE_MARGIN * 2,
      align: "right",
    });
}

async function createPdfBuffer({
  provider,
  account,
  transactions,
  summary,
}: {
  provider: ProviderRow;
  account: ClientAccount;
  transactions: TransactionRow[];
  summary: SummaryTotals;
}): Promise<Buffer> {
  // Use standalone bundle to avoid filesystem lookups for fonts in serverless.
  const pdfModule = await import("pdfkit/js/pdfkit.standalone.js");
  const PDFDocument = (pdfModule as any).default ?? (pdfModule as any);
  if (!PDFDocument) {
    throw new Error("pdfkit no disponible en el runtime.");
  }

  const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk as Buffer));
  const bufferPromise = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  drawHeader(doc, provider, account);
  const statsY = PAGE_MARGIN + 160;
  drawStatBlocks(doc, summary, statsY);

  let tableY = statsY + 70;
  tableY = drawTable(doc, transactions, tableY + 6);
  tableY += 24;

  if (tableY > doc.page.height - PAGE_MARGIN - 120) {
    doc.addPage();
    tableY = PAGE_MARGIN;
  }
  drawTotals(doc, summary, tableY);
  drawFooter(doc);

  doc.end();
  return bufferPromise;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const providerSlug = url.searchParams.get("provider");
    const clientId = url.searchParams.get("clientId");

    if (!providerSlug || !clientId) {
      return NextResponse.json({ error: "Faltan parámetros provider o clientId." }, { status: 400 });
    }

    const result = await getClientAccounts(providerSlug);
    if (!result.success) {
      return NextResponse.json({ error: result.errors.join(" · ") }, { status: 404 });
    }

    const account = result.accounts.find((item) => item.client.id === clientId);
    if (!account) {
      return NextResponse.json({ error: "Cliente no encontrado en este proveedor." }, { status: 404 });
    }

    const { transactions, summary } = buildTransactions(account);
    const pdf = await createPdfBuffer({
      provider: result.provider,
      account,
      transactions,
      summary,
    });

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resumen-${account.client.slug ?? "cliente"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF summary error", error);
    return NextResponse.json({ error: (error as Error)?.message ?? "No se pudo generar el PDF." }, { status: 500 });
  }
}
