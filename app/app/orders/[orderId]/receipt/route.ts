import { NextResponse, type NextRequest } from "next/server";
import { formatCurrency } from "@/lib/whatsapp";
import { getOrderDetail, type OrderDetail } from "../../actions";

export const dynamic = "force-dynamic";

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdf(order: OrderDetail) {
  if (!order) throw new Error("Pedido no disponible para PDF.");

  const lines: string[] = [];
  lines.push("BT");
  lines.push("/F1 18 Tf");
  lines.push("50 780 Td");
  lines.push(`(${escapePdfText("Remito de entrega")}) Tj`);
  lines.push("/F1 12 Tf");
  lines.push("0 -24 Td");
  lines.push(`(${escapePdfText(`Proveedor: ${order.provider.name}`)}) Tj`);
  lines.push("0 -14 Td");
  const providerContact = [order.provider.contact_email, order.provider.contact_phone].filter(Boolean).join(" · ");
  if (providerContact) lines.push(`(${escapePdfText(providerContact)}) Tj`);
  lines.push("0 -18 Td");
  lines.push(`(${escapePdfText(`Cliente: ${order.client.name}`)}) Tj`);
  if (order.client.address) {
    lines.push("0 -14 Td");
    lines.push(`(${escapePdfText(`Dirección: ${order.client.address}`)}) Tj`);
  }
  if (order.client.contact_phone) {
    lines.push("0 -14 Td");
    lines.push(`(${escapePdfText(`Tel: ${order.client.contact_phone}`)}) Tj`);
  }
  lines.push("0 -20 Td");
  lines.push(`(${escapePdfText(`Estado: ${order.status}`)}) Tj`);
  lines.push("0 -14 Td");
  lines.push(
    `(${escapePdfText(
      `Entrega: ${order.deliveryMethod ? order.deliveryMethod : "No especificada"}`,
    )}) Tj`,
  );
  if (order.note) {
    lines.push("0 -18 Td");
    lines.push(`(${escapePdfText(`Nota: ${order.note}`)}) Tj`);
  }
  lines.push("0 -24 Td");
  lines.push(`(${escapePdfText("Detalle")}) Tj`);
  lines.push("/F1 11 Tf");
  order.items.forEach((item) => {
    lines.push("0 -14 Td");
    lines.push(
      `(${escapePdfText(
        `${item.quantity} x ${item.productName}${item.unit ? ` (${item.unit})` : ""} - ${formatCurrency(item.subtotal)}`,
      )}) Tj`,
    );
  });
  lines.push("0 -20 Td");
  lines.push("/F1 12 Tf");
  lines.push(`(${escapePdfText(`Total: ${formatCurrency(order.total)}`)}) Tj`);
  lines.push("ET");

  const contentStream = `${lines.join("\n")}\n`;
  const contentLength = Buffer.byteLength(contentStream, "utf8");

  const objects: string[] = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n",
  );
  objects.push(`4 0 obj\n<< /Length ${contentLength} >>\nstream\n${contentStream}endstream\nendobj\n`);
  objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  let position = Buffer.byteLength(pdf, "utf8");

  for (const obj of objects) {
    offsets.push(position);
    pdf += obj;
    position += Buffer.byteLength(obj, "utf8");
  }

  const xrefStart = position;
  let xref = "xref\n0 6\n";
  xref += "0000000000 65535 f \n";
  offsets.forEach((offset) => {
    xref += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += xref;
  pdf += `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
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
