import type PDFKit from "pdfkit";
import { NextResponse, type NextRequest } from "next/server";
import { formatCurrency } from "@/lib/whatsapp";
import { getDemoData } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  deliveryZoneName?: string | null;
  deliveryDate?: string | null;
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
    slug?: string | null;
    contact_phone?: string | null;
  };
  items: {
    productName: string;
    unit?: string | null;
    quantity: number;
    deliveredQuantity?: number | null;
    unitPrice: number;
    subtotal: number;
    deliveredSubtotal?: number | null;
  }[];
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

function drawHeader(doc: PDFKit.PDFDocument, issuedAt: Date, orderNumber: string) {
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
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(TEXT)
    .text(`Pedido #${orderNumber}`, PAGE_MARGIN, y + 14, { width, align: "right" });

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

function drawProviderBlock(doc: PDFKit.PDFDocument, provider: { name: string; phone?: string | null; email?: string | null }, startY: number) {
  const width = doc.page.width - PAGE_MARGIN * 2;
  const line = [provider.phone ? `Tel: ${provider.phone}` : null, provider.email].filter(Boolean).join(" · ");
  doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT).text(provider.name || "Proveedor", PAGE_MARGIN, startY, {
    width,
    align: "left",
  });
  if (line) {
    doc.font("Helvetica").fontSize(10.5).fillColor(MUTED).text(line, PAGE_MARGIN, startY + 16, { width, align: "left" });
  }
  return startY + 34;
}

function drawClientCard(doc: PDFKit.PDFDocument, client: { name: string; user?: string | null; phone?: string | null; id?: string | null }, startY: number) {
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

function drawDeliveryInfo(
  doc: PDFKit.PDFDocument,
  delivery: { method?: string | null; zone?: string | null; date?: string | null },
  startY: number,
) {
  const width = doc.page.width - PAGE_MARGIN * 2;
  doc
    .roundedRect(PAGE_MARGIN, startY, width, 66, 6)
    .strokeColor(LINE)
    .lineWidth(1)
    .fillAndStroke("#FFFFFF", LINE);

  const x = PAGE_MARGIN + 12;
  let y = startY + 12;

  doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT).text("Entrega", x, y, { width: width - 24 });
  y += 16;

  const parts = [
    delivery.method ? `Método: ${delivery.method === "envio" ? "Envío" : "Retiro"}` : null,
    delivery.zone ? `Zona: ${delivery.zone}` : null,
    delivery.date ? `Fecha: ${formatDate(delivery.date)}` : null,
  ].filter(Boolean);

  doc.font("Helvetica").fontSize(10.5).fillColor(MUTED).text(parts.join(" · ") || "Sin datos de entrega", x, y, {
    width: width - 24,
  });

  return startY + 78;
}

function drawTable(doc: PDFKit.PDFDocument, rows: { description: string; quantity: number; unitPrice: number; subtotal: number; balance: number }[], startY: number) {
  const availableWidth = doc.page.width - PAGE_MARGIN * 2;
  const weights = [0.42, 0.12, 0.14, 0.2, 0.12];
  const base = availableWidth / weights.reduce((acc, w) => acc + w, 0);

  const columns: { key: keyof (typeof rows)[number]; label: string; width: number; align?: "left" | "right"; format?: "money" | "text" | "number"; noWrap?: boolean }[] =
    [
      { key: "description", label: "Descripción", width: base * weights[0], format: "text" },
      { key: "quantity", label: "Cant.", width: base * weights[1], align: "right", format: "number", noWrap: true },
      { key: "unitPrice", label: "Unitario", width: base * weights[2], align: "right", format: "money", noWrap: true },
      { key: "subtotal", label: "Subtotal", width: base * weights[3], align: "right", format: "money", noWrap: true },
      { key: "balance", label: "Saldo", width: base * weights[4], align: "right", format: "money", noWrap: true },
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

  const renderRow = (row: (typeof rows)[number], index: number) => {
    if (index % 2 === 1) {
      doc.rect(PAGE_MARGIN, y, availableWidth, rowHeight).fill(ROW_ALT);
    }
    let x = PAGE_MARGIN + 10;
    columns.forEach((col) => {
      const value = row[col.key];
      let text = "";
      if (col.format === "money") text = `$ ${formatMoney(Number(value) ?? 0)}`;
      else if (col.format === "number") text = `${value}`;
      else text = String(value ?? "");
      doc
        .fillColor(TEXT)
        .font("Helvetica")
        .fontSize(10.5)
        .text(text, x, y + 7, { width: col.width - 14, align: col.align ?? "left", lineBreak: col.noWrap ? false : true });
      x += col.width;
    });
    y += rowHeight;
    doc
      .strokeColor(LINE)
      .lineWidth(0.6)
      .moveTo(PAGE_MARGIN, y)
      .lineTo(PAGE_MARGIN + availableWidth, y)
      .stroke();
  };

  renderHeader();
  rows.forEach(renderRow);

  return y;
}

async function buildPdf(order: OrderForPdf): Promise<Buffer> {
  const pdfModule = await import("pdfkit/js/pdfkit.standalone.js");
  const PDFDocument = (pdfModule as any).default ?? (pdfModule as any);
  if (!PDFDocument) {
    throw new Error("pdfkit no disponible en el runtime.");
  }

  const doc: PDFKit.PDFDocument = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
  const buffers: Buffer[] = [];
  doc.on("data", (chunk) => buffers.push(chunk as Buffer));
  const endPromise = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(buffers))));

  const provider = {
    name: order.provider.name,
    phone: order.provider.contact_phone ?? undefined,
    email: order.provider.contact_email ?? undefined,
  };

  const client = {
    name: order.client.name,
    user: order.contactName ?? undefined,
    phone: order.client.contact_phone ?? undefined,
    id: order.client.slug ?? undefined,
  };

  const rows = order.items.map((item) => {
    const deliveredQty =
      typeof item.deliveredQuantity === "number" && Number.isFinite(item.deliveredQuantity)
        ? item.deliveredQuantity
        : item.quantity;
    const subtotal = (item as { deliveredSubtotal?: number | null }).deliveredSubtotal ?? item.unitPrice * deliveredQty;
    return {
      description: `${item.productName}${item.unit ? ` (${item.unit})` : ""}${deliveredQty === 0 ? " · SIN STOCK" : ""}`,
      quantity: deliveredQty,
      unitPrice: item.unitPrice,
      subtotal,
      balance: subtotal,
    };
  });

  const totalDue = rows.reduce((acc, row) => acc + row.balance, 0);

  const issuedAt = new Date(order.receiptGeneratedAt ?? order.createdAt ?? Date.now());
  const afterHeader = drawHeader(doc, issuedAt, order.id.slice(0, 8));
  const afterProvider = drawProviderBlock(doc, provider, afterHeader + 4);
  const afterClient = drawClientCard(doc, client, afterProvider + 12);
  const tableStart = drawDeliveryInfo(
    doc,
    { method: order.deliveryMethod, zone: order.deliveryZoneName, date: order.deliveryDate },
    afterClient + 6,
  );
  const afterTable = drawTable(doc, rows, tableStart + 10);

  let totalsY = afterTable;
  if (totalsY > doc.page.height - PAGE_MARGIN - 180) {
    doc.addPage();
    totalsY = PAGE_MARGIN;
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(TEXT)
    .text("Total", PAGE_MARGIN, totalsY + 18, { width: doc.page.width - PAGE_MARGIN * 2, align: "right" });

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(PRIMARY)
    .text(`$ ${formatMoney(totalDue)}`, PAGE_MARGIN, totalsY + 36, { width: doc.page.width - PAGE_MARGIN * 2, align: "right" });

  doc.end();

  return endPromise;
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
      slug: client.slug,
      address: client.address ?? null,
      contact_phone: client.contact_phone ?? null,
    },
    items,
  };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Faltan credenciales de Supabase (SERVICE_ROLE / URL).");
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        status,
        contact_name,
        contact_phone,
        delivery_method,
        delivery_date,
        delivery_zone:delivery_zones(name),
        note,
        created_at,
        receipt_generated_at,
        provider_id,
        client_id,
        provider_id,
        client_id,
        order_items(
          delivered_quantity,
          quantity,
          unit_price,
          product:products(name, unit)
        )
      `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) return null;

  const providerId = (order as { provider_id?: string | null }).provider_id ?? null;
  const clientId = (order as { client_id?: string | null }).client_id ?? null;

  const [{ data: provider }, { data: client }] = await Promise.all([
    providerId
      ? supabase.from("providers").select("id, slug, name, contact_email, contact_phone").eq("id", providerId).maybeSingle()
      : Promise.resolve({ data: null }),
    clientId
      ? supabase.from("clients").select("id, slug, name, address, contact_phone").eq("id", clientId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

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
        deliveredSubtotal: unitPrice * effectiveQuantity,
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
    deliveryZoneName:
      Array.isArray((order as any).delivery_zone) && (order as any).delivery_zone.length > 0
        ? (order as any).delivery_zone[0]?.name ?? null
        : ((order as any).delivery_zone as { name?: string } | null | undefined)?.name ?? null,
    deliveryDate: (order as { delivery_date?: string | null }).delivery_date ?? null,
    note: (order as { note?: string | null }).note ?? null,
    createdAt: order.created_at ?? null,
    receiptGeneratedAt: (order as { receipt_generated_at?: string | null }).receipt_generated_at ?? null,
    total,
    provider: {
      name: provider?.name ?? "Proveedor",
      contact_email: provider?.contact_email ?? null,
      contact_phone: provider?.contact_phone ?? null,
    },
    client: {
      name: client?.name ?? "Cliente",
      slug: client?.slug ?? clientSlug,
      address: client?.address ?? null,
      contact_phone: client?.contact_phone ?? null,
    },
    items,
  };
}

async function fetchDemoOrder(orderId: string): Promise<OrderForPdf | null> {
  const demo = getDemoData();
  const order = demo.orders.find((item) => item.id === orderId);
  if (!order) return null;
  const client = demo.clients.find((c) => c.slug === order.clientSlug);
  if (!client) return null;
  const items =
    order.items.map((item) => {
      const product = demo.products.find((p) => p.id === item.productId);
      const unitPrice = (item as { unitPrice?: number }).unitPrice ?? Number(product?.price ?? 0);
      const unit = (item as { unit?: string | null }).unit ?? product?.unit ?? null;
      const deliveredQuantity = (order as { delivered_items?: { productId: string; quantity?: number | null }[] }).delivered_items?.find(
        (row) => row.productId === item.productId,
      )?.quantity ?? null;
      const effectiveQty = deliveredQuantity ?? item.quantity;
      const subtotal = unitPrice * effectiveQty;
      return {
        productName: (item as { name?: string }).name ?? product?.name ?? "Producto",
        unit,
        quantity: item.quantity,
        deliveredQuantity,
        unitPrice,
        subtotal,
        deliveredSubtotal: subtotal,
      };
    }) ?? [];

  const total = items.reduce((acc, item) => acc + (item.deliveredSubtotal ?? item.subtotal ?? item.unitPrice * item.quantity), 0);

  return {
    id: order.id,
    status: order.status,
    contactName: order.contactName ?? null,
    contactPhone: order.contactPhone ?? null,
    deliveryMethod: order.deliveryMethod ?? null,
    deliveryZoneName: order.deliveryZoneName ?? null,
    deliveryDate: order.deliveryDate ?? null,
    note: order.note ?? null,
    createdAt: order.createdAt ?? null,
    receiptGeneratedAt: order.receiptGeneratedAt ?? order.createdAt ?? new Date().toISOString(),
    total,
    provider: {
      name: demo.provider.name,
      contact_email: demo.provider.contact_email,
      contact_phone: demo.provider.contact_phone,
    },
    client: {
      name: client.name,
      slug: client.slug,
      address: client.address ?? null,
      contact_phone: client.contact_phone ?? null,
    },
    items,
  };
}

async function fetchDemoOrderFromDb(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  orderId: string,
  clientSlug: string,
): Promise<OrderForPdf | null> {
  const { data: demoOrder } = await supabase
    .from("demo_orders")
    .select("id, provider_slug, client_slug, status, delivery_method, delivery_date, receipt_generated_at, contact_name, contact_phone, note, items, delivered_items, created_at")
    .eq("id", orderId)
    .maybeSingle();

  if (!demoOrder) return null;

  const demo = getDemoData();
  const provider = demo.provider;
  const client = demo.clients.find((c) => c.slug === clientSlug) ?? demo.clients.find((c) => c.slug === (demoOrder as any).client_slug);
  if (!client) return null;

  const deliveredMap = new Map<string, number | null>(
    Array.isArray((demoOrder as any).delivered_items)
      ? (demoOrder as any).delivered_items.map((item: any) => [item.productId, item.quantity ?? null])
      : [],
  );

  const items =
    ((demoOrder as any).items as any[])?.map((item, index) => {
      const product = demo.products.find((p) => p.id === item.productId);
      const unitPrice = Number(item.unitPrice ?? product?.price ?? 0);
      const deliveredQuantity = deliveredMap.get(item.productId) ?? item.quantity ?? 0;
      const subtotal = unitPrice * deliveredQuantity;
      return {
        productName: item.name ?? product?.name ?? `Producto ${index + 1}`,
        unit: item.unit ?? product?.unit ?? null,
        quantity: item.quantity ?? 0,
        deliveredQuantity,
        unitPrice,
        subtotal,
        deliveredSubtotal: subtotal,
      };
    }) ?? [];

  const total = items.reduce((acc, item) => acc + (item.deliveredSubtotal ?? item.subtotal ?? 0), 0);

  return {
    id: demoOrder.id,
    status: demoOrder.status ?? "entregado",
    contactName: (demoOrder as any).contact_name ?? null,
    contactPhone: (demoOrder as any).contact_phone ?? null,
    deliveryMethod: (demoOrder as any).delivery_method ?? null,
    deliveryZoneName: null,
    deliveryDate: (demoOrder as any).delivery_date ?? null,
    note: (demoOrder as any).note ?? null,
    createdAt: (demoOrder as any).created_at ?? null,
    receiptGeneratedAt: (demoOrder as any).receipt_generated_at ?? (demoOrder as any).created_at ?? new Date().toISOString(),
    total,
    provider: {
      name: provider.name,
      contact_email: provider.contact_email,
      contact_phone: provider.contact_phone,
    },
    client: {
      name: client.name,
      slug: client.slug,
      address: client.address ?? null,
      contact_phone: client.contact_phone ?? null,
    },
    items,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ providerSlug: string; clientSlug: string; orderId: string }> },
) {
  const resolved = await context.params;
  const { providerSlug, clientSlug, orderId } = resolved;
  const format = request.nextUrl.searchParams.get("format");
  const debug = request.nextUrl.searchParams.get("debug") === "1";
  try {
    const supabase = getSupabaseAdmin();
    const order =
      (await fetchOrder({
        providerSlug,
        clientSlug,
        orderId,
      })) ??
      (await fetchDemoOrder(orderId)) ??
      (supabase ? await fetchDemoOrderFromDb(supabase, orderId, clientSlug) : null);

    if (!order) {
      if (debug) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const [provider, client, rawOrder] = await Promise.all([
            supabase.from("providers").select("id, slug").eq("slug", providerSlug).maybeSingle(),
            supabase.from("clients").select("id, slug, provider_id").eq("slug", clientSlug).maybeSingle(),
            supabase.from("orders").select("id, provider_id, client_id, receipt_generated_at, created_at, delivery_date").eq("id", orderId).maybeSingle(),
          ]);
          return NextResponse.json(
            {
              error: "Pedido no encontrado.",
              orderId,
              providerSlug,
              clientSlug,
              debug: {
                provider: provider.data ?? null,
                providerError: provider.error?.message ?? null,
                client: client.data ?? null,
                clientError: client.error?.message ?? null,
                order: rawOrder.data ?? null,
                orderError: rawOrder.error?.message ?? null,
              },
            },
            { status: 404 },
          );
        }
        return NextResponse.json(
          { error: "Pedido no encontrado.", orderId, providerSlug, clientSlug, debug: { supabaseAdmin: false } },
          { status: 404 },
        );
      }
      return NextResponse.json({ error: "Pedido no encontrado.", orderId, providerSlug, clientSlug }, { status: 404 });
    }

    if (!order.receiptGeneratedAt) {
      if (debug) {
        return NextResponse.json(
          {
            error: "El remito aún no está disponible.",
            orderId,
            providerSlug,
            clientSlug,
            debug: { receiptGeneratedAt: order.receiptGeneratedAt, createdAt: order.createdAt },
          },
          { status: 404 },
        );
      }
      return NextResponse.json({ error: "El remito aún no está disponible." }, { status: 404 });
    }

  // Soporte legado plano
  if (format === "txt") {
    const lines = [
      `Remito de pedido ${order.id}`,
      `Proveedor: ${order.provider.name}`,
      `Cliente: ${order.client.name}`,
      `Total: ${formatCurrency(order.total)}`,
      "",
      "Items:",
      ...order.items.map((item) => `- ${item.productName} x${item.deliveredQuantity ?? item.quantity}`),
    ];
    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const pdfBuffer = await buildPdf(order);
  const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
  return new NextResponse(pdfBlob, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="remito-${order.id}.pdf"`,
    },
  });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo generar el remito.", details: (error as Error).message, orderId, providerSlug, clientSlug },
      { status: 500 },
    );
  }
}
