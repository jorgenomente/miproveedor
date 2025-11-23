"use server";

import { z } from "zod";
import { ORDER_STATUS, type OrderStatus } from "@/lib/order-status";
import { getDemoData } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getProviderScope } from "@/lib/provider-scope";

const updateSchema = z.object({
  providerSlug: z.string().min(2),
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUS),
});

const updateOrderSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUS).optional(),
  contactName: z.string().trim().max(120).optional(),
  contactPhone: z.string().trim().max(60).optional(),
  deliveryMethod: z.enum(["retiro", "envio"]).nullable().optional(),
  note: z.string().trim().max(500).optional(),
});

export type ProviderRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean | null;
};

export type OrderListItem = {
  id: string;
  clientName: string;
  status: OrderStatus;
  total: number;
  createdAt: string | null;
};

export type OrderItemDetail = {
  productId: string;
  productName: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type OrderDetail = {
  id: string;
  status: OrderStatus;
  contactName: string | null;
  contactPhone: string | null;
  deliveryMethod: string | null;
  note: string | null;
  createdAt: string | null;
  total: number;
  provider: {
    id: string;
    name: string;
    slug: string;
    contact_email?: string | null;
    contact_phone?: string | null;
  };
  client: {
    id: string;
    name: string;
    slug: string;
    contact_name?: string | null;
    contact_phone?: string | null;
    address?: string | null;
  };
  items: OrderItemDetail[];
};

export type ListOrdersResult =
  | { success: true; orders: OrderListItem[]; provider: ProviderRow }
  | { success: false; errors: string[] };

export type UpdateOrderResult =
  | { success: true; message: string }
  | { success: false; errors: string[] };

export type OrderDetailResult =
  | { success: true; order: OrderDetail }
  | { success: false; errors: string[] };

export type PendingProductRow = {
  productId: string;
  name: string;
  unit: string | null;
  quantity: number;
};

export type ProductSummaryByStatus = Record<OrderStatus, PendingProductRow[]>;

export type PendingProductsResult =
  | { success: true; items: ProductSummaryByStatus }
  | { success: false; errors: string[] };

function normalizeStatus(status?: string | null): OrderStatus {
  if (status === "preparando") return "preparando";
  if (status === "entregado") return "entregado";
  if (status === "enviado") return "entregado";
  return "nuevo";
}

export async function listPendingProducts(providerSlug: string): Promise<PendingProductsResult> {
  const buckets: ProductSummaryByStatus = {
    nuevo: [],
    preparando: [],
    entregado: [],
  };

  const addToBucket = (status: OrderStatus, productId: string, name: string, unit: string | null, quantity: number) => {
    const bucket = buckets[status];
    const existingIndex = bucket.findIndex((item) => item.productId === productId);
    if (existingIndex >= 0) {
      bucket[existingIndex] = {
        ...bucket[existingIndex],
        quantity: bucket[existingIndex].quantity + quantity,
      };
    } else {
      bucket.push({ productId, name, unit, quantity });
    }
  };

  if (providerSlug === "demo") {
    const demo = getDemoData();

    demo.orders.forEach((order) => {
      const normalized = normalizeStatus(order.status);
      order.items.forEach((item) => {
        const itemName = (item as { name?: string }).name ?? "Producto";
        const itemUnit = (item as { unit?: string | null }).unit ?? null;
        addToBucket(normalized, item.productId, itemName, itemUnit, item.quantity);
      });
    });

    return { success: true, items: buckets };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return {
      success: false,
      errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`],
    };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        status,
        order_items(
          quantity,
          product:products(id, name, unit)
        )
      `,
    )
    .eq("provider_id", provider.id);

  if (error) {
    return { success: false, errors: [`No se pudieron cargar artículos: ${error.message}`] };
  }

  (data ?? []).forEach((order) => {
    const normalized = normalizeStatus(order.status as string);
    order.order_items?.forEach((item) => {
      const productEntry = Array.isArray(item.product) && item.product.length > 0 ? item.product[0] : (item as any).product;
      const productId = productEntry?.id;
      if (!productId) return;
      addToBucket(normalized, productId, productEntry?.name ?? "Producto", productEntry?.unit ?? null, item.quantity);
    });
  });

  return { success: true, items: buckets };
}

export async function listProviders(): Promise<
  | { success: true; providers: ProviderRow[] }
  | { success: false; errors: string[] }
> {
  const demo = getDemoData();
  const demoProvider: ProviderRow = {
    id: demo.provider.id,
    name: demo.provider.name,
    slug: demo.provider.slug,
    is_active: true,
  };

  const scopeResult = await getProviderScope();
  const scope = scopeResult.scope;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: true, providers: [demoProvider] };
  }

  if (scopeResult.error && !scope) {
    return { success: true, providers: [demoProvider] };
  }

  if (scope && scope.role === "provider") {
    const { data, error } = await supabase
      .from("providers")
      .select("id, name, slug, is_active")
      .eq("id", scope.provider.id)
      .maybeSingle();

    if (error || !data) {
      return {
        success: false,
        errors: [
          error?.message ? `No se pudo cargar tu proveedor: ${error.message}` : "Proveedor no encontrado.",
        ],
      };
    }

    return { success: true, providers: [demoProvider, data] };
  }

  const { data, error } = await supabase
    .from("providers")
    .select("id, name, slug, is_active")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, errors: [`No se pudieron cargar proveedores: ${error.message}`] };
  }

  const providers = data ?? [];
  const merged =
    providers.some((provider) => provider.slug === demoProvider.slug)
      ? providers
      : [demoProvider, ...providers];

  return { success: true, providers: merged };
}

export async function listOrders(providerSlug: string): Promise<ListOrdersResult> {
  if (providerSlug === "demo") {
    const demo = getDemoData();
    const orders: OrderListItem[] = demo.orders.map((order) => ({
      id: order.id,
      clientName:
        demo.clients.find((client) => client.slug === order.clientSlug)?.name ?? "Cliente demo",
      status: normalizeStatus(order.status),
      total: order.total,
      createdAt: order.createdAt,
    }));

    return {
      success: true,
      orders,
      provider: {
        id: demo.provider.id,
        name: demo.provider.name,
        slug: demo.provider.slug,
        is_active: true,
      },
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return {
      success: false,
      errors: [scopeResult.error],
    };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
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
    .select("id, name, slug, is_active")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return {
      success: false,
      errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`],
    };
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, created_at, client:clients(name), order_items(quantity, unit_price)",
    )
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, errors: [`No se pudieron cargar pedidos: ${error.message}`] };
  }

  const orders: OrderListItem[] =
    data?.map((order) => {
      const total =
        order.order_items?.reduce(
          (acc, item) => acc + Number(item.unit_price ?? 0) * item.quantity,
          0,
        ) ?? 0;
      const clientName =
        Array.isArray(order.client) && order.client.length > 0
          ? order.client[0]?.name ?? "Cliente"
          : (order as { client?: { name?: string } }).client?.name ?? "Cliente";

      return {
        id: order.id,
        clientName,
        status: normalizeStatus(order.status as string),
        total,
        createdAt: order.created_at,
      };
    }) ?? [];

  return { success: true, orders, provider };
}

export async function getOrderDetail(orderId: string): Promise<OrderDetailResult> {
  if (orderId === "demo" || orderId.startsWith("00000000-0000-4000-8000-00000000o")) {
    const demo = getDemoData();
    const order = demo.orders.find((item) => item.id === orderId) ?? demo.orders[0];
    if (!order) return { success: false, errors: ["Pedido demo no encontrado."] };
    const client = demo.clients.find((client) => client.slug === order.clientSlug);
    if (!client) return { success: false, errors: ["Cliente demo no encontrado."] };

    return {
      success: true,
      order: {
        id: order.id,
        status: normalizeStatus(order.status),
        contactName: order.contactName ?? null,
        contactPhone: order.contactPhone ?? null,
        deliveryMethod:
          order.deliveryMethod?.toLowerCase().includes("env") || order.deliveryMethod?.toLowerCase().includes("enví")
            ? "envio"
            : order.deliveryMethod?.toLowerCase().includes("ret")
              ? "retiro"
              : order.deliveryMethod ?? null,
        note: order.note ?? null,
        createdAt: order.createdAt,
        total: order.total,
        provider: {
          id: demo.provider.id,
          name: demo.provider.name,
          slug: demo.provider.slug,
          contact_email: demo.provider.contact_email,
          contact_phone: demo.provider.contact_phone,
        },
        client: {
          id: client.id,
          name: client.name,
          slug: client.slug,
          contact_name: client.contact_name ?? null,
          contact_phone: client.contact_phone ?? null,
          address: client.address ?? null,
        },
        items: order.items.map((item) => {
          const unitPrice = "unitPrice" in item ? Number((item as { unitPrice?: number }).unitPrice ?? 0) : 0;
          return {
            productId: (item as { productId?: string }).productId ?? "",
            productName: (item as { name?: string }).name ?? "Producto demo",
            unit: (item as { unit?: string | null }).unit ?? null,
            quantity: item.quantity,
            unitPrice,
            subtotal: unitPrice * item.quantity,
          };
        }),
      },
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase."] };

  const { data, error } = await supabase
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
        provider:providers(id, name, slug, contact_email, contact_phone),
        client:clients(id, name, slug, contact_name, contact_phone, address),
        order_items(
          quantity,
          unit_price,
          product:products(id, name, unit)
        )
      `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    return { success: false, errors: [`Pedido no encontrado: ${error?.message ?? "sin detalle"}`] };
  }

  const providerRecord: {
    id?: string;
    name?: string;
    slug?: string;
    contact_email?: string | null;
    contact_phone?: string | null;
  } | null =
    Array.isArray(data.provider) && data.provider.length > 0 ? data.provider[0] : (data.provider as any) ?? null;

  const clientRecord: {
    id?: string;
    name?: string;
    slug?: string;
    contact_name?: string | null;
    contact_phone?: string | null;
    address?: string | null;
  } | null = Array.isArray(data.client) && data.client.length > 0 ? data.client[0] : (data.client as any) ?? null;

  if (!providerRecord?.id) return { success: false, errors: ["El pedido no tiene proveedor asociado."] };

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== providerRecord.id) {
    return { success: false, errors: ["No tienes acceso a este pedido."] };
  }

  const items: OrderItemDetail[] =
    data.order_items?.map((item) => {
      const productEntry = Array.isArray(item.product) && item.product.length > 0 ? item.product[0] : (item as any).product;
      const unitPrice = Number(item.unit_price ?? 0);
      return {
        productId: productEntry?.id ?? "",
        productName: productEntry?.name ?? "Producto",
        unit: productEntry?.unit ?? null,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      };
    }) ?? [];

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);

  return {
    success: true,
    order: {
      id: data.id,
      status: normalizeStatus(data.status as string),
        contactName: data.contact_name ?? null,
        contactPhone: data.contact_phone ?? null,
      deliveryMethod:
        typeof data.delivery_method === "string"
          ? data.delivery_method.toLowerCase() === "envio"
            ? "envio"
            : data.delivery_method.toLowerCase() === "retiro"
              ? "retiro"
              : data.delivery_method
          : null,
      note: data.note ?? null,
      createdAt: data.created_at ?? null,
      total,
      provider: {
        id: providerRecord.id ?? "",
        name: providerRecord.name ?? "Proveedor",
        slug: providerRecord.slug ?? "",
        contact_email: providerRecord.contact_email ?? null,
        contact_phone: providerRecord.contact_phone ?? null,
      },
      client: {
        id: clientRecord?.id ?? "",
        name: clientRecord?.name ?? "Cliente",
        slug: clientRecord?.slug ?? "",
        contact_name: clientRecord?.contact_name ?? null,
        contact_phone: clientRecord?.contact_phone ?? null,
        address: clientRecord?.address ?? null,
      },
      items,
    },
  };
}

export async function updateOrderStatus(
  payload: z.infer<typeof updateSchema>,
): Promise<UpdateOrderResult> {
  if (payload.providerSlug === "demo") {
    return {
      success: true,
      message: "Estado actualizado en modo demo (no se guardan cambios).",
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== parsed.data.providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
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
    .select("id, slug")
    .eq("slug", parsed.data.providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return {
      success: false,
      errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`],
    };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", parsed.data.orderId)
    .eq("provider_id", provider.id)
    .maybeSingle();

  if (orderError || !order) {
    return {
      success: false,
      errors: [`Pedido no encontrado: ${orderError?.message ?? "sin detalle"}`],
    };
  }

  const nextStatus = parsed.data.status;
  if (nextStatus === order.status) {
    return { success: true, message: "Estado sin cambios." };
  }

  const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", order.id);

  if (error) {
    return { success: false, errors: [`No se pudo actualizar el pedido: ${error.message}`] };
  }

  return { success: true, message: "Estado actualizado." };
}

export async function updateOrder(
  payload: z.infer<typeof updateOrderSchema>,
): Promise<UpdateOrderResult> {
  if (payload.orderId.startsWith("00000000-0000-4000-8000-00000000o")) {
    return { success: true, message: "Pedido demo actualizado (no se guardan cambios)." };
  }

  const parsed = updateOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase."] };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, provider_id, status")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (orderError || !order) {
    return { success: false, errors: [`Pedido no encontrado: ${orderError?.message ?? "sin detalle"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== order.provider_id) {
    return { success: false, errors: ["No tienes acceso a este pedido."] };
  }

  const updates: Record<string, unknown> = {};

  if (parsed.data.status && parsed.data.status !== order.status) {
    updates.status = parsed.data.status;
  }

  if (typeof parsed.data.contactName === "string") updates.contact_name = parsed.data.contactName || null;
  if (typeof parsed.data.contactPhone === "string") updates.contact_phone = parsed.data.contactPhone || null;
  if ("deliveryMethod" in parsed.data) updates.delivery_method = parsed.data.deliveryMethod || null;
  if (typeof parsed.data.note === "string") updates.note = parsed.data.note || null;

  if (Object.keys(updates).length === 0) return { success: true, message: "Sin cambios para guardar." };

  const { error } = await supabase.from("orders").update(updates).eq("id", order.id);

  if (error) return { success: false, errors: [`No se pudo actualizar el pedido: ${error.message}`] };

  return { success: true, message: "Pedido actualizado." };
}
