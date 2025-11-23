"use server";

import { z } from "zod";
import { getDemoData } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const createOrderSchema = z.object({
  providerSlug: z.string().min(2),
  clientSlug: z.string().min(2),
  contactName: z.string().min(2),
  contactPhone: z.string().min(4),
  deliveryMethod: z.string().optional(),
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
    }
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

    return {
      success: true,
      orderId: `demo-order-${Date.now()}`,
      total,
      items: orderItems,
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
    .select("id, slug, is_active")
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

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      provider_id: provider.id,
      client_id: client.id,
      contact_name: parsed.data.contactName,
      contact_phone: parsed.data.contactPhone,
      delivery_method: parsed.data.deliveryMethod ?? null,
      note: parsed.data.note ?? null,
      status: "nuevo",
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
  };
}
