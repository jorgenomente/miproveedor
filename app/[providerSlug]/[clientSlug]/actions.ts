"use server";

import { randomUUID } from "crypto";
import { Buffer } from "node:buffer";
import { z } from "zod";
import { getDemoData } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { pickNextDelivery, type DeliveryRule } from "@/lib/delivery-windows";

const FILE_MAX_BYTES = 5 * 1024 * 1024;
const ORDER_PAYMENT_PROOFS_BUCKET = process.env.ORDER_PAYMENT_PROOFS_BUCKET ?? "order-payment-proofs";

const createOrderSchema = z.object({
  providerSlug: z.string().min(2),
  clientSlug: z.string().min(2),
  contactName: z.string().min(2),
  contactPhone: z.string().min(4),
  deliveryMethod: z.enum(["retiro", "envio"]).optional(),
  paymentMethod: z.enum(["efectivo", "transferencia"]),
  paymentProof: z
    .object({
      filename: z.string().min(1).max(160),
      contentType: z.string().min(3),
      base64: z.string().min(10),
      size: z.number().int().positive().max(FILE_MAX_BYTES),
    })
    .optional(),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1, "Debes agregar al menos un producto."),
});

const DEMO_DELIVERY_RULES: DeliveryRule[] = [
  { id: "demo-rule-1", cutoffWeekday: 2, cutoffTimeMinutes: 20 * 60, deliveryWeekday: 5, deliveryTimeMinutes: 10 * 60 },
  { id: "demo-rule-2", cutoffWeekday: 6, cutoffTimeMinutes: 20 * 60, deliveryWeekday: 2, deliveryTimeMinutes: 10 * 60 },
];

const PROVIDER_TIME_ZONE = "America/Argentina/Buenos_Aires";

function resolveNextDelivery(rules: DeliveryRule[]) {
  const result = pickNextDelivery(rules, new Date(), PROVIDER_TIME_ZONE);
  if (!result) return null;

  return {
    ruleId: result.rule.id ?? null,
    deliveryDate: result.deliveryDate.toISOString(),
    cutoffDate: result.cutoffDate.toISOString(),
  };
}

export type OrderSummaryItem = {
  productId: string;
  name: string;
  unit?: string | null;
  quantity: number;
  unitPrice: number;
};

export type CreateOrderResult =
  | {
      success: true;
      orderId: string;
      total: number;
      items: OrderSummaryItem[];
      paymentMethod: "efectivo" | "transferencia";
      paymentProofStatus: "no_aplica" | "pendiente" | "subido";
      paymentProofUrl?: string | null;
      deliveryDate?: string | null;
      deliveryRuleId?: string | null;
      cutoffDate?: string | null;
    }
  | { success: false; errors: string[] };

const updateProofSchema = z.object({
  providerSlug: z.string().min(2),
  clientSlug: z.string().min(2),
  orderId: z.string().uuid(),
  paymentProof: z.object({
    filename: z.string().min(1).max(160),
    contentType: z.string().min(3),
    base64: z.string().min(10),
    size: z.number().int().positive().max(FILE_MAX_BYTES),
  }),
});

export type UpdatePaymentProofResult =
  | { success: true; paymentProofUrl?: string | null; paymentProofStatus: "subido" }
  | { success: false; errors: string[] };

export async function createOrder(
  payload: z.infer<typeof createOrderSchema>,
): Promise<CreateOrderResult> {
  const parsed = createOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  if (parsed.data.providerSlug === "demo") {
    const demo = getDemoData();
    const client = demo.clients.find((item) => item.slug === parsed.data.clientSlug);
    if (!client) {
      return { success: false, errors: ["Tienda demo no encontrada."] };
    }

    const productMap = new Map(
      demo.products.map((product) => [product.id, { ...product, price: Number(product.price ?? 0) }]),
    );

    if (!parsed.data.items.every((item) => productMap.has(item.productId))) {
      return { success: false, errors: ["Algún producto demo no existe."] };
    }

    const orderItems: OrderSummaryItem[] = parsed.data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });

    const total = orderItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

    const slot = resolveNextDelivery(DEMO_DELIVERY_RULES);

    const paymentProofStatus =
      parsed.data.paymentMethod === "transferencia"
        ? parsed.data.paymentProof
          ? "subido"
          : "pendiente"
        : "no_aplica";

    const paymentProofUrl =
      parsed.data.paymentProof && parsed.data.paymentMethod === "transferencia"
        ? `demo-proof://${parsed.data.paymentProof.filename}`
        : null;

    return {
      success: true,
      orderId: `demo-order-${Date.now()}`,
      total,
      items: orderItems,
      paymentMethod: parsed.data.paymentMethod,
      paymentProofStatus,
      paymentProofUrl,
      deliveryDate: slot?.deliveryDate ?? null,
      deliveryRuleId: slot?.ruleId ?? null,
      cutoffDate: slot?.cutoffDate ?? null,
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."],
    };
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug, is_active, subscription_status")
    .eq("slug", parsed.data.providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return {
      success: false,
      errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`],
    };
  }

  if (provider.is_active === false) {
    return { success: false, errors: ["El proveedor está inactivo."] };
  }

  if (provider.subscription_status && provider.subscription_status !== "active") {
    return { success: false, errors: ["La suscripción del proveedor está pausada o inactiva."] };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, is_active")
    .eq("provider_id", provider.id)
    .eq("slug", parsed.data.clientSlug)
    .maybeSingle();

  if (clientError || !client) {
    return {
      success: false,
      errors: [`Tienda no disponible: ${clientError?.message ?? "no encontrada"}`],
    };
  }

  if (client.is_active === false) {
    return { success: false, errors: ["La tienda está inactiva."] };
  }

  const productIds = parsed.data.items.map((item) => item.productId);

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, unit, price, discount_percent, is_out_of_stock")
    .eq("provider_id", provider.id)
    .in("id", productIds);

  if (productsError) {
    return {
      success: false,
      errors: [`No se pudieron validar los productos: ${productsError.message}`],
    };
  }

  const productMap = new Map(
    (products ?? []).map((product) => {
      const basePrice = Number(product.price ?? 0);
      const discount = Number(product.discount_percent ?? 0);
      const finalPrice = Number((basePrice * (1 - Math.max(0, Math.min(100, discount)) / 100)).toFixed(2));
      return [product.id, { ...product, price: finalPrice }];
    }),
  );

  if (productMap.size !== productIds.length) {
    return { success: false, errors: ["Algunos productos ya no están disponibles."] };
  }

  if ([...productMap.values()].some((product) => product.is_out_of_stock)) {
    return { success: false, errors: ["Uno de los productos seleccionados está sin stock."] };
  }

  const orderItems: OrderSummaryItem[] = parsed.data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      productId: product.id,
      name: product.name,
      unit: product.unit,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });

  const total = orderItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const { data: paymentSettingsRow } = await supabase
    .from("provider_payment_settings")
    .select("cash_enabled, transfer_enabled")
    .eq("provider_id", provider.id)
    .maybeSingle();

  const cashEnabled = paymentSettingsRow?.cash_enabled ?? true;
  const transferEnabled = paymentSettingsRow?.transfer_enabled ?? true;

  if (!cashEnabled && !transferEnabled) {
    return { success: false, errors: ["El proveedor no tiene métodos de pago activos."] };
  }

  if (parsed.data.paymentMethod === "efectivo" && !cashEnabled) {
    return { success: false, errors: ["El proveedor desactivó pagos en efectivo."] };
  }

  if (parsed.data.paymentMethod === "transferencia" && !transferEnabled) {
    return { success: false, errors: ["El proveedor desactivó pagos por transferencia."] };
  }

  if (parsed.data.paymentMethod === "efectivo" && parsed.data.paymentProof) {
    return { success: false, errors: ["El comprobante solo aplica si eliges transferencia."] };
  }

  let paymentProofUrl: string | null = null;
  let paymentProofStatus: "no_aplica" | "pendiente" | "subido" =
    parsed.data.paymentMethod === "transferencia" ? "pendiente" : "no_aplica";

  if (parsed.data.paymentMethod === "transferencia" && parsed.data.paymentProof) {
    const contentType = parsed.data.paymentProof.contentType.toLowerCase();
    const isValidType =
      contentType.startsWith("image/") || contentType === "application/pdf" || contentType.includes("pdf");

    if (!isValidType) {
      return { success: false, errors: ["Formato de comprobante no soportado (usa imagen o PDF)."] };
    }

    const buffer = Buffer.from(parsed.data.paymentProof.base64, "base64");
    const safeName = parsed.data.paymentProof.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${provider.slug}/${client.id}/${Date.now()}-${randomUUID()}-${safeName}`;

    const upload = await supabase.storage
      .from(ORDER_PAYMENT_PROOFS_BUCKET)
      .upload(path, buffer, {
        contentType: contentType || "application/octet-stream",
        upsert: true,
      });

    if (upload.error) {
      return { success: false, errors: [`No se pudo subir el comprobante: ${upload.error.message}`] };
    }

    const publicUrlBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    paymentProofUrl = publicUrlBase
      ? `${publicUrlBase}/storage/v1/object/public/${ORDER_PAYMENT_PROOFS_BUCKET}/${path}`
      : upload.data?.path ?? path;
    paymentProofStatus = "subido";
  }

  const { data: ruleRows, error: rulesError } = await supabase
    .from("delivery_windows")
    .select("id, cutoff_weekday, cutoff_time_minutes, delivery_weekday, delivery_time_minutes")
    .eq("provider_id", provider.id);

  if (rulesError) {
    return { success: false, errors: [`No se pudieron cargar las reglas de entrega: ${rulesError.message}`] };
  }

  const deliveryRules: DeliveryRule[] =
    ruleRows?.map((row) => ({
      id: row.id,
      cutoffWeekday: row.cutoff_weekday ?? 0,
      cutoffTimeMinutes: row.cutoff_time_minutes ?? 0,
      deliveryWeekday: row.delivery_weekday ?? 0,
      deliveryTimeMinutes: row.delivery_time_minutes ?? 10 * 60,
    })) ?? [];

  const slot = resolveNextDelivery(deliveryRules);
  if (!slot) {
    return { success: false, errors: ["El proveedor no configuró las ventanas de entrega."] };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      provider_id: provider.id,
      client_id: client.id,
      contact_name: parsed.data.contactName,
      contact_phone: parsed.data.contactPhone,
      delivery_method: parsed.data.deliveryMethod ?? null,
      payment_method: parsed.data.paymentMethod,
      payment_proof_status: paymentProofStatus,
      payment_proof_url: paymentProofUrl,
      note: parsed.data.note ?? null,
      status: "nuevo",
      delivery_date: slot.deliveryDate,
      delivery_rule_id: slot.ruleId,
    })
    .select("id")
    .single();

  if (orderError || !order?.id) {
    return {
      success: false,
      errors: [`No se pudo crear el pedido: ${orderError?.message ?? "sin detalle"}`],
    };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
  );

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return {
      success: false,
      errors: [`Pedido creado pero los items fallaron: ${itemsError.message}`],
    };
  }

  return {
    success: true,
    orderId: order.id,
    total,
    items: orderItems,
    paymentMethod: parsed.data.paymentMethod,
    paymentProofStatus,
    paymentProofUrl,
    deliveryDate: slot.deliveryDate,
    deliveryRuleId: slot.ruleId,
    cutoffDate: slot.cutoffDate,
  };
}

export async function updatePaymentProof(
  payload: z.infer<typeof updateProofSchema>,
): Promise<UpdatePaymentProofResult> {
  const parsed = updateProofSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  if (parsed.data.providerSlug === "demo") {
    return {
      success: true,
      paymentProofStatus: "subido",
      paymentProofUrl: `demo-proof://${parsed.data.paymentProof.filename}`,
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase."] };

  const { data: provider } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", parsed.data.providerSlug)
    .maybeSingle();
  if (!provider) return { success: false, errors: ["Proveedor no encontrado."] };

  const { data: client } = await supabase
    .from("clients")
    .select("id, slug")
    .eq("provider_id", provider.id)
    .eq("slug", parsed.data.clientSlug)
    .maybeSingle();
  if (!client) return { success: false, errors: ["Tienda no encontrada."] };

  const { data: order } = await supabase
    .from("orders")
    .select("id, payment_method")
    .eq("id", parsed.data.orderId)
    .eq("provider_id", provider.id)
    .eq("client_id", client.id)
    .maybeSingle();

  if (!order) return { success: false, errors: ["Pedido no encontrado."] };
  if ((order as { payment_method?: string }).payment_method !== "transferencia") {
    return { success: false, errors: ["Este pedido no requiere comprobante."] };
  }

  const contentType = parsed.data.paymentProof.contentType.toLowerCase();
  const isValidType =
    contentType.startsWith("image/") || contentType === "application/pdf" || contentType.includes("pdf");
  if (!isValidType) {
    return { success: false, errors: ["Formato no soportado, sube imagen o PDF."] };
  }

  const buffer = Buffer.from(parsed.data.paymentProof.base64, "base64");
  const safeName = parsed.data.paymentProof.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${provider.slug}/${client.id}/${Date.now()}-${randomUUID()}-${safeName}`;

  const upload = await supabase.storage.from(ORDER_PAYMENT_PROOFS_BUCKET).upload(path, buffer, {
    contentType: contentType || "application/octet-stream",
    upsert: true,
  });

  if (upload.error) {
    return { success: false, errors: [`No se pudo subir el comprobante: ${upload.error.message}`] };
  }

  const publicUrlBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const paymentProofUrl = publicUrlBase
    ? `${publicUrlBase}/storage/v1/object/public/${ORDER_PAYMENT_PROOFS_BUCKET}/${path}`
    : upload.data?.path ?? path;

  const { error: updateError } = await supabase
    .from("orders")
    .update({ payment_proof_status: "subido", payment_proof_url: paymentProofUrl })
    .eq("id", parsed.data.orderId);

  if (updateError) {
    return { success: false, errors: [`No se pudo actualizar el pedido: ${updateError.message}`] };
  }

  return { success: true, paymentProofStatus: "subido", paymentProofUrl };
}
