import { NextResponse, type NextRequest } from "next/server";
import { formatCurrency } from "@/lib/whatsapp";
import { getOrderDetail, type OrderDetail } from "../../actions";

export const dynamic = "force-dynamic";

function escapePdfText(text: string) {
  const encoded = Buffer.from(text ?? "", "latin1").toString("latin1");
  return encoded.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function textLine(x: number, y: number, fontSize: number, text: string) {
  return [
    "BT",
    `/F1 ${fontSize} Tf`,
    "0 g",
    `1 0 0 1 ${x} ${y} Tm`,
    `(${escapePdfText(text)}) Tj`,
    "ET",
  ].join("\n");
}

function buildPdf(order: OrderDetail) {
  if (!order) throw new Error("Pedido no disponible para PDF.");

  const lines: string[] = [];
  const headerY = 740; // start lower for more top margin

  // Background cards
  lines.push("q");
  lines.push("0.96 0.98 1 rg");
  lines.push("50 670 512 90 re f");
  lines.push("Q");

  // Header
  lines.push(textLine(60, headerY, 18, "Remito de entrega"));
  lines.push(
    textLine(
      60,
      headerY - 22,
      11,
      `Pedido ${order.id.slice(0, 8)} · ${new Date(order.createdAt ?? Date.now()).toLocaleString("es-AR")}`,
    ),
  );

  // Provider + client blocks
  const providerContact = [order.provider.contact_email, order.provider.contact_phone].filter(Boolean).join(" · ");
  lines.push("q");
  lines.push("0.9 0.93 0.99 rg");
  lines.push("50 610 250 90 re f");
  lines.push("0.85 0.89 0.96 RG 1 w 50 610 250 90 re S");
  lines.push("Q");
  lines.push(textLine(60, 688, 12, "Proveedor"));
  lines.push(textLine(60, 670, 11, order.provider.name));
  if (providerContact) lines.push(textLine(60, 654, 10, providerContact));

  lines.push("q");
  lines.push("0.95 0.92 1 rg");
  lines.push("312 610 250 90 re f");
  lines.push("0.86 0.8 0.97 RG 1 w 312 610 250 90 re S");
  lines.push("Q");
  lines.push(textLine(322, 688, 12, "Cliente"));
  lines.push(textLine(322, 670, 11, order.client.name));
  if (order.client.address) lines.push(textLine(322, 654, 10, order.client.address));
  if (order.client.contact_phone) lines.push(textLine(322, 638, 10, `Tel: ${order.client.contact_phone}`));

  // Status and delivery
  lines.push(textLine(60, 602, 11, `Estado: ${order.status}`));
  lines.push(textLine(60, 586, 11, `Entrega: ${order.deliveryMethod ? order.deliveryMethod : "No especificada"}`));
  if (order.note) {
    lines.push(textLine(60, 566, 10, `Nota: ${order.note}`));
  }

  // Table header
  lines.push("q");
  lines.push("0.9 0.92 0.95 rg");
  lines.push("50 520 512 30 re f");
  lines.push("0.78 0.82 0.88 RG 1 w 50 520 512 30 re S");
  lines.push("Q");
  lines.push(textLine(60, 540, 11, "Producto"));
  lines.push(textLine(310, 540, 11, "Cant."));
  lines.push(textLine(370, 540, 11, "P. unit"));
  lines.push(textLine(450, 540, 11, "Subtotal"));

  // Items
  let currentY = 518;
  order.items.forEach((item, index) => {
    const bg = index % 2 === 0 ? "0.98 0.99 1" : "1 1 1";
    lines.push("q");
    lines.push(`${bg} rg`);
    lines.push(`50 ${currentY - 6} 512 26 re f`);
    lines.push("Q");
    lines.push(textLine(60, currentY + 10, 11, `${item.productName}${item.unit ? ` (${item.unit})` : ""}`));
    lines.push(textLine(310, currentY + 10, 11, `${item.quantity}`));
    lines.push(textLine(370, currentY + 10, 11, `${formatCurrency(item.unitPrice)}`));
    lines.push(textLine(450, currentY + 10, 11, `${formatCurrency(item.subtotal)}`));
    currentY -= 26;
  });

  // Total box
  lines.push("q");
  lines.push("0.93 1 0.95 rg");
  lines.push(`350 ${currentY - 16} 212 40 re f`);
  lines.push("0.7 0.9 0.78 RG 1 w");
  lines.push(`350 ${currentY - 16} 212 40 re S`);
  lines.push("Q");
  lines.push(textLine(360, currentY + 10, 11, "Total"));
  lines.push(textLine(430, currentY + 10, 14, formatCurrency(order.total)));

  const contentStream = `${lines.join("\n")}\n`;
  const contentLength = Buffer.byteLength(contentStream, "binary");

  const objects: string[] = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n",
  );
  objects.push(`4 0 obj\n<< /Length ${contentLength} >>\nstream\n${contentStream}endstream\nendobj\n`);
  objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  let position = Buffer.byteLength(pdf, "binary");

  for (const obj of objects) {
    offsets.push(position);
    pdf += obj;
    position += Buffer.byteLength(obj, "binary");
  }

  const xrefStart = position;
  let xref = "xref\n0 6\n";
  xref += "0000000000 65535 f \n";
  offsets.forEach((offset) => {
    xref += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += xref;
  pdf += `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "binary");
}

export async function GET(_request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const params = await context.params;
  const detail = await getOrderDetail(params.orderId);
  if (!detail.success) {
    return NextResponse.json({ error: detail.errors.join(" · ") }, { status: 404 });
  }

  const pdf = buildPdf(detail.order);
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="remito-${detail.order.id}.pdf"`,
    },
  });
}
