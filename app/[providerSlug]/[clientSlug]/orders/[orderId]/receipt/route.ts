import { NextResponse, type NextRequest } from "next/server";
import { formatCurrency } from "@/lib/whatsapp";
import { getDemoData } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function shortOrderId(id: string) {
  return id?.length > 8 ? id.slice(0, 8) : id;
}

type OrderForPdf = {
  id: string;
  status: string;
  contactName: string | null;
  contactPhone: string | null;
  deliveryMethod: string | null;
  note: string | null;
  createdAt: string | null;
  receiptGeneratedAt?: string | null;
  total: number;
  provider: {
    name: string;
    contact_email?: string | null;
    contact_phone?: string | null;
  };
  client: {
    name: string;
    address?: string | null;
    contact_phone?: string | null;
  };
  items: {
    productName: string;
    unit?: string | null;
    quantity: number;
    deliveredQuantity?: number | null;
    unitPrice: number;
    subtotal: number;
  }[];
};

function buildPdf(order: OrderForPdf) {
  const truncate = (value: string, max = 54) => {
    if (value.length <= max) return value;
    return `${value.slice(0, max - 3)}...`;
  };

  const lines: string[] = [];
  lines.push("BT");
  lines.push("/F1 18 Tf");
  // Header
  lines.push("1 0 0 1 50 780 Tm");
  lines.push(`(${escapePdfText("Remito de entrega")}) Tj`);
  lines.push("/F1 12 Tf");
  lines.push("1 0 0 1 430 782 Tm");
  lines.push(`(${escapePdfText(`Pedido #${shortOrderId(order.id)}`)}) Tj`);

  // Provider / client info
  lines.push("1 0 0 1 50 754 Tm");
  lines.push(`(${escapePdfText(`Proveedor: ${order.provider.name}`)}) Tj`);
  const providerContact = [order.provider.contact_email, order.provider.contact_phone].filter(Boolean).join(" · ");
  if (providerContact) {
    lines.push("0 -14 Td");
    lines.push(`(${escapePdfText(providerContact)}) Tj`);
  }
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
  lines.push("0 -18 Td");
  lines.push(`(${escapePdfText(`Estado: ${order.status}`)}) Tj`);
  lines.push("0 -14 Td");
  lines.push(
    `(${escapePdfText(`Entrega: ${order.deliveryMethod ? order.deliveryMethod : "No especificada"}`)}) Tj`,
  );
  if (order.note) {
    lines.push("0 -18 Td");
    lines.push(`(${escapePdfText(`Nota: ${truncate(order.note, 80)}`)}) Tj`);
  }

  // Table headers (Fecha y Pedido removidos para dar espacio al subtotal)
  const columns = {
    product: 50,
    quantity: 320,
    unit: 380,
    subtotal: 470,
  };
  let currentY = 640;

  lines.push("/F1 12 Tf");
  lines.push(`1 0 0 1 ${columns.product} ${currentY} Tm`);
  lines.push(`(${escapePdfText("Detalle")}) Tj`);

  currentY -= 18;
  lines.push("/F1 11 Tf");
  lines.push(`1 0 0 1 ${columns.product} ${currentY} Tm`);
  lines.push(`(${escapePdfText("Producto")}) Tj`);
  lines.push(`1 0 0 1 ${columns.quantity} ${currentY} Tm`);
  lines.push(`(${escapePdfText("Cant.")}) Tj`);
  lines.push(`1 0 0 1 ${columns.unit} ${currentY} Tm`);
  lines.push(`(${escapePdfText("Unitario")}) Tj`);
  lines.push(`1 0 0 1 ${columns.subtotal} ${currentY} Tm`);
  lines.push(`(${escapePdfText("Subtotal")}) Tj`);

  currentY -= 14;
  lines.push("/F1 10 Tf");
  order.items.forEach((item) => {
    const qty = typeof item.deliveredQuantity === "number" ? item.deliveredQuantity : item.quantity;
    lines.push(`1 0 0 1 ${columns.product} ${currentY} Tm`);
    const name = truncate(`${item.productName}${item.unit ? ` (${item.unit})` : ""}`, 60);
    lines.push(`(${escapePdfText(name)}) Tj`);

    lines.push(`1 0 0 1 ${columns.quantity} ${currentY} Tm`);
    lines.push(`(${escapePdfText(String(qty))}) Tj`);

    lines.push(`1 0 0 1 ${columns.unit} ${currentY} Tm`);
    lines.push(`(${escapePdfText(formatCurrency(item.unitPrice))}) Tj`);

    lines.push(`1 0 0 1 ${columns.subtotal} ${currentY} Tm`);
    const subtotal = item.subtotal ?? item.unitPrice * qty;
    lines.push(`(${escapePdfText(formatCurrency(subtotal))}) Tj`);

    currentY -= 14;
  });

  // Totals
  currentY -= 10;
  lines.push("/F1 12 Tf");
  lines.push(`1 0 0 1 ${columns.subtotal} ${currentY} Tm`);
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

async function fetchOrder({
  providerSlug,
  clientSlug,
  orderId,
}: {
  providerSlug: string;
  clientSlug: string;
  orderId: string;
}): Promise<OrderForPdf | null> {
  if (providerSlug === "demo") {
    const demo = getDemoData();
    const order = demo.orders.find((item) => item.id === orderId && item.clientSlug === clientSlug);
    const client = demo.clients.find((c) => c.slug === clientSlug);
    if (!order || !client) return null;

    const items =
      order.displayItems ??
      order.items.map((item) => {
        const product = demo.products.find((p) => p.id === item.productId);
        const unitPrice = (item as { unitPrice?: number }).unitPrice ?? Number(product?.price ?? 0);
        const unit = (item as { unit?: string | null }).unit ?? product?.unit ?? null;
        const name = (item as { name?: string }).name ?? product?.name ?? "Producto";
        return {
          productName: name,
          unit,
          quantity: item.quantity,
          deliveredQuantity: item.quantity,
          unitPrice,
          subtotal: unitPrice * item.quantity,
        };
      });

    return {
      id: order.id,
      status: order.status,
      contactName: order.contactName ?? null,
      contactPhone: order.contactPhone ?? null,
      deliveryMethod: order.deliveryMethod ?? null,
      note: order.note ?? null,
      createdAt: order.createdAt ?? null,
      receiptGeneratedAt: order.createdAt ?? new Date().toISOString(),
      total: order.total,
      provider: {
        name: demo.provider.name,
        contact_email: demo.provider.contact_email,
        contact_phone: demo.provider.contact_phone,
      },
      client: {
        name: client.name,
        address: client.address ?? null,
        contact_phone: client.contact_phone ?? null,
      },
      items,
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data: provider } = await supabase
    .from("providers")
    .select("id, name, contact_email, contact_phone")
    .eq("slug", providerSlug)
    .maybeSingle();
  if (!provider) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, address, contact_phone")
    .eq("provider_id", provider.id)
    .eq("slug", clientSlug)
    .maybeSingle();
  if (!client) return null;

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        status,
        contact_name,
        contact_phone,
        delivery_method,
        note,
        created_at,
        receipt_generated_at,
        order_items(
          delivered_quantity,
          quantity,
          unit_price,
          product:products(name, unit)
        )
      `,
    )
    .eq("id", orderId)
    .eq("provider_id", provider.id)
    .eq("client_id", client.id)
    .maybeSingle();

  if (error || !order) return null;

  const items =
    order.order_items?.map((item) => {
      const productEntry = Array.isArray(item.product) && item.product.length > 0 ? item.product[0] : (item as any).product;
      const unitPrice = Number(item.unit_price ?? 0);
      const deliveredQuantity =
        typeof (item as { delivered_quantity?: number | null }).delivered_quantity === "number"
          ? (item as { delivered_quantity?: number | null }).delivered_quantity
          : null;
      const effectiveQuantity = deliveredQuantity ?? item.quantity;
      return {
        productName: productEntry?.name ?? "Producto",
        unit: productEntry?.unit ?? null,
        quantity: item.quantity,
        deliveredQuantity,
        unitPrice,
        subtotal: unitPrice * effectiveQuantity,
      };
    }) ?? [];

  const total = items.reduce(
    (acc, item) => acc + (item.subtotal ?? item.unitPrice * (item.deliveredQuantity ?? item.quantity ?? 0)),
    0,
  );

  return {
    id: order.id,
    status: order.status,
    contactName: (order as { contact_name?: string | null }).contact_name ?? null,
    contactPhone: (order as { contact_phone?: string | null }).contact_phone ?? null,
    deliveryMethod: (order as { delivery_method?: string | null }).delivery_method ?? null,
    note: (order as { note?: string | null }).note ?? null,
    createdAt: order.created_at ?? null,
    receiptGeneratedAt: (order as { receipt_generated_at?: string | null }).receipt_generated_at ?? null,
    total,
    provider: {
      name: provider.name,
      contact_email: provider.contact_email,
      contact_phone: provider.contact_phone,
    },
    client: {
      name: client.name,
      address: client.address ?? null,
      contact_phone: client.contact_phone ?? null,
    },
    items,
  };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ providerSlug: string; clientSlug: string; orderId: string }> }) {
  const params = await context.params;
  const order = await fetchOrder({
    providerSlug: params.providerSlug,
    clientSlug: params.clientSlug,
    orderId: params.orderId,
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  if (!order.receiptGeneratedAt) {
    return NextResponse.json({ error: "El remito aún no está disponible." }, { status: 404 });
  }

  const pdf = buildPdf(order);
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="remito-${order.id}.pdf"`,
    },
  });
}
