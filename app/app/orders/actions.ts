"use server";

import { z } from "zod";
import { ORDER_STATUS, type OrderStatus } from "@/lib/order-status";
import { getDemoData } from "@/lib/demo-data";
import { fetchDemoOrderById, fetchRecentDemoOrders } from "@/lib/demo-orders";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getProviderScope } from "@/lib/provider-scope";

const updateSchema = z.object({
  providerSlug: z.string().min(2),
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUS),
});

const updateDeliveryDateSchema = z.object({
  providerSlug: z.string().min(2),
  orderId: z.string().uuid(),
  deliveryDate: z.string().nullable(),
});

const updateOrderSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUS).optional(),
  contactName: z.string().trim().max(120).optional(),
  contactPhone: z.string().trim().max(60).optional(),
  deliveryMethod: z.enum(["retiro", "envio"]).nullable().optional(),
  paymentMethod: z.enum(["efectivo", "transferencia"]).optional(),
  paymentProofStatus: z.enum(["no_aplica", "pendiente", "subido"]).optional(),
  note: z.string().trim().max(500).optional(),
});

const generateReceiptSchema = z.object({
  orderId: z.string().min(3),
  items: z
    .array(
      z.object({
        orderItemId: z.string().min(1),
        productId: z.string().min(1),
        quantity: z.number().int().min(0),
      }),
    )
    .nonempty("Debes confirmar al menos un producto."),
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
  deliveryDate?: string | null;
  deliveryZoneName?: string | null;
  paymentMethod?: "efectivo" | "transferencia" | null;
  paymentProofStatus?: "no_aplica" | "pendiente" | "subido" | null;
  paymentProofUrl?: string | null;
};

export type OrderItemDetail = {
  orderItemId: string;
  productId: string;
  productName: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  deliveredQuantity?: number | null;
  deliveredSubtotal?: number;
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
  receiptGeneratedAt?: string | null;
  paymentMethod?: "efectivo" | "transferencia" | null;
  paymentProofStatus?: "no_aplica" | "pendiente" | "subido" | null;
  paymentProofUrl?: string | null;
  deliveryDate?: string | null;
  deliveryRuleId?: string | null;
  deliveryZoneName?: string | null;
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

export type UpdateDeliveryDateResult =
  | { success: true; message: string; deliveryDate: string | null }
  | { success: false; errors: string[] };

export type OrderDetailResult =
  | { success: true; order: OrderDetail }
  | { success: false; errors: string[] };

export type GenerateReceiptResult =
  | { success: true; message: string; receiptGeneratedAt: string }
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
    const stored = await fetchRecentDemoOrders({ providerSlug: "demo" });

    [...stored, ...demo.orders].forEach((order) => {
      const normalized = normalizeStatus(order.status);
      order.items.forEach((item) => {
        const itemName = (item as { name?: string }).name ?? "Producto";
        const itemUnit = (item as { unit?: string | null }).unit ?? null;
        const productId = (item as { productId?: string }).productId ?? "";
        addToBucket(normalized, productId, itemName, itemUnit, item.quantity);
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
    .eq("provider_id", provider.id)
    .eq("is_archived", false);

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
    const stored = await fetchRecentDemoOrders({ providerSlug: "demo" });
    const orders: OrderListItem[] = [
      ...stored.map((order) => ({
        id: order.id,
        clientName:
          demo.clients.find((client) => client.slug === order.client_slug)?.name ?? "Cliente demo",
        status: normalizeStatus(order.status),
        total: order.total,
        createdAt: order.created_at,
        deliveryDate: order.delivery_date ?? null,
        paymentMethod: order.payment_method ?? null,
        paymentProofStatus: order.payment_proof_status ?? null,
        paymentProofUrl: order.payment_proof_url ?? null,
      })),
      ...demo.orders.map((order) => ({
        id: order.id,
        clientName:
          demo.clients.find((client) => client.slug === order.clientSlug)?.name ?? "Cliente demo",
        status: normalizeStatus(order.status),
        total: order.total,
        createdAt: order.createdAt,
        deliveryDate: (order as { deliveryDate?: string | null }).deliveryDate ?? null,
        paymentMethod: (order as { paymentMethod?: "efectivo" | "transferencia" }).paymentMethod ?? null,
        paymentProofStatus: (order as { paymentProofStatus?: "no_aplica" | "pendiente" | "subido" }).paymentProofStatus ?? null,
        paymentProofUrl: (order as { paymentProofUrl?: string | null }).paymentProofUrl ?? null,
      })),
    ].sort((a, b) => {
      const aDate = new Date(a.createdAt ?? "").getTime();
      const bDate = new Date(b.createdAt ?? "").getTime();
      return Number.isNaN(bDate) ? -1 : bDate - aDate;
    });

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
      "id, status, created_at, delivery_date, delivery_rule_id, delivery_zone:delivery_zones(name), payment_method, payment_proof_status, payment_proof_url, client:clients(name), order_items(quantity, unit_price)",
    )
    .eq("provider_id", provider.id)
    .eq("is_archived", false)
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
        deliveryDate: (order as { delivery_date?: string | null }).delivery_date ?? null,
        deliveryZoneName:
          Array.isArray((order as any).delivery_zone) && (order as any).delivery_zone.length > 0
            ? (order as any).delivery_zone[0]?.name ?? null
            : ((order as any).delivery_zone as { name?: string } | null | undefined)?.name ?? null,
        paymentMethod: (order as { payment_method?: "efectivo" | "transferencia" }).payment_method ?? null,
        paymentProofStatus: (order as { payment_proof_status?: "no_aplica" | "pendiente" | "subido" }).payment_proof_status ?? null,
        paymentProofUrl: (order as { payment_proof_url?: string | null }).payment_proof_url ?? null,
      };
    }) ?? [];

  return { success: true, orders, provider };
}

export async function getOrderDetail(orderId: string): Promise<OrderDetailResult> {
  const storedDemo = await fetchDemoOrderById(orderId);
  if (storedDemo?.provider_slug === "demo") {
    const demo = getDemoData();
    const client = demo.clients.find((c) => c.slug === storedDemo.client_slug);
    const deliveredMap = new Map(
      (storedDemo.delivered_items ?? []).map((item) => [item.productId, item.quantity ?? null]),
    );

    return {
      success: true,
      order: {
        id: storedDemo.id,
        status: normalizeStatus(storedDemo.status),
        contactName: storedDemo.contact_name ?? null,
        contactPhone: storedDemo.contact_phone ?? null,
        deliveryMethod: storedDemo.delivery_method ?? null,
        deliveryZoneName: null,
        note: storedDemo.note ?? null,
        createdAt: storedDemo.created_at ?? null,
        total: storedDemo.total,
        receiptGeneratedAt: storedDemo.receipt_generated_at ?? storedDemo.created_at ?? null,
        deliveryDate: storedDemo.delivery_date ?? null,
        deliveryRuleId: storedDemo.delivery_rule_id ?? null,
        paymentMethod: storedDemo.payment_method ?? null,
        paymentProofStatus: storedDemo.payment_proof_status ?? null,
        paymentProofUrl: storedDemo.payment_proof_url ?? null,
        provider: {
          id: demo.provider.id,
          name: demo.provider.name,
          slug: demo.provider.slug,
          contact_email: demo.provider.contact_email,
          contact_phone: demo.provider.contact_phone,
        },
        client: {
          id: client?.id ?? "",
          name: client?.name ?? "Cliente demo",
          slug: client?.slug ?? storedDemo.client_slug,
          contact_name: client?.contact_name ?? null,
          contact_phone: client?.contact_phone ?? null,
          address: client?.address ?? null,
        },
        items: storedDemo.items.map((item, index) => {
          const deliveredQuantity = deliveredMap.get(item.productId) ?? null;
          const unitPrice = item.unitPrice;
          const effectiveQuantity = deliveredQuantity ?? item.quantity;
          return {
            orderItemId: item.productId ?? `demo-item-${index}`,
            productId: item.productId,
            productName: item.name,
            unit: item.unit ?? null,
            quantity: item.quantity,
            unitPrice,
            subtotal: item.subtotal ?? unitPrice * effectiveQuantity,
            deliveredQuantity,
            deliveredSubtotal: unitPrice * effectiveQuantity,
          };
        }),
      },
    };
  }

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
        deliveryZoneName: null,
        note: order.note ?? null,
        createdAt: order.createdAt,
        receiptGeneratedAt: order.createdAt ?? new Date().toISOString(),
        deliveryDate: (order as { deliveryDate?: string | null }).deliveryDate ?? null,
        deliveryRuleId: (order as { deliveryRuleId?: string | null }).deliveryRuleId ?? null,
        total: order.total,
        paymentMethod: order.paymentMethod ?? null,
        paymentProofStatus: order.paymentProofStatus ?? null,
        paymentProofUrl: (order as { paymentProofUrl?: string | null }).paymentProofUrl ?? null,
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
        items: order.items.map((item, index) => {
          const unitPrice = "unitPrice" in item ? Number((item as { unitPrice?: number }).unitPrice ?? 0) : 0;
          return {
            orderItemId: (item as { productId?: string }).productId ?? `demo-seed-${index}`,
            productId: (item as { productId?: string }).productId ?? "",
            productName: (item as { name?: string }).name ?? "Producto demo",
            unit: (item as { unit?: string | null }).unit ?? null,
            quantity: item.quantity,
            unitPrice,
            subtotal: unitPrice * item.quantity,
            deliveredQuantity: item.quantity,
            deliveredSubtotal: unitPrice * item.quantity,
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
        delivery_zone:delivery_zones(name),
        delivery_date,
        delivery_rule_id,
        payment_method,
        payment_proof_status,
        payment_proof_url,
        note,
        created_at,
        receipt_generated_at,
        provider:providers(id, name, slug, contact_email, contact_phone),
        client:clients(id, name, slug, contact_name, contact_phone, address),
        order_items(
          id,
          quantity,
          delivered_quantity,
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
      const deliveredQuantity =
        typeof (item as { delivered_quantity?: number | null }).delivered_quantity === "number"
          ? (item as { delivered_quantity?: number | null }).delivered_quantity
          : null;
      const effectiveQuantity = deliveredQuantity ?? item.quantity;
      return {
        orderItemId: (item as { id?: string }).id ?? productEntry?.id ?? "",
        productId: productEntry?.id ?? "",
        productName: productEntry?.name ?? "Producto",
        unit: productEntry?.unit ?? null,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * effectiveQuantity,
        deliveredQuantity,
        deliveredSubtotal: unitPrice * effectiveQuantity,
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
      deliveryZoneName:
        Array.isArray((data as any).delivery_zone) && (data as any).delivery_zone.length > 0
          ? (data as any).delivery_zone[0]?.name ?? null
          : ((data as any).delivery_zone as { name?: string } | null | undefined)?.name ?? null,
      deliveryDate: (data as { delivery_date?: string | null }).delivery_date ?? null,
      deliveryRuleId: (data as { delivery_rule_id?: string | null }).delivery_rule_id ?? null,
      note: data.note ?? null,
      createdAt: data.created_at ?? null,
      receiptGeneratedAt: (data as { receipt_generated_at?: string | null }).receipt_generated_at ?? null,
      total,
      paymentMethod: (data as { payment_method?: "efectivo" | "transferencia" }).payment_method ?? null,
      paymentProofStatus: (data as { payment_proof_status?: "no_aplica" | "pendiente" | "subido" }).payment_proof_status ?? null,
      paymentProofUrl: (data as { payment_proof_url?: string | null }).payment_proof_url ?? null,
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
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  if (parsed.data.providerSlug === "demo") {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase
        .from("demo_orders")
        .update({ status: parsed.data.status })
        .eq("id", parsed.data.orderId)
        .eq("provider_slug", "demo");
    }
    return {
      success: true,
      message: "Estado actualizado en modo demo (se reinicia cada 24h).",
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
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
  const parsed = updateOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  if (parsed.data.orderId.startsWith("00000000-0000-4000-8000-00000000o")) {
    return { success: true, message: "Pedido demo actualizado (no se guardan cambios)." };
  }

  const storedDemo = await fetchDemoOrderById(parsed.data.orderId);
  if (storedDemo?.provider_slug === "demo") {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const updates: Record<string, unknown> = {};
      if (parsed.data.status && parsed.data.status !== storedDemo.status) updates.status = parsed.data.status;
      if (typeof parsed.data.contactName === "string") updates.contact_name = parsed.data.contactName || null;
      if (typeof parsed.data.contactPhone === "string") updates.contact_phone = parsed.data.contactPhone || null;
      if ("deliveryMethod" in parsed.data) updates.delivery_method = parsed.data.deliveryMethod || null;
      if (parsed.data.paymentMethod) updates.payment_method = parsed.data.paymentMethod;
      if (parsed.data.paymentProofStatus) updates.payment_proof_status = parsed.data.paymentProofStatus;
      if (typeof parsed.data.note === "string") updates.note = parsed.data.note || null;
      if (Object.keys(updates).length > 0) {
        await supabase.from("demo_orders").update(updates).eq("id", storedDemo.id);
      }
    }
    return { success: true, message: "Pedido demo actualizado (se reinicia cada 24h)." };
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
  if (parsed.data.paymentMethod) updates.payment_method = parsed.data.paymentMethod;
  if (parsed.data.paymentProofStatus) updates.payment_proof_status = parsed.data.paymentProofStatus;
  if (typeof parsed.data.note === "string") updates.note = parsed.data.note || null;

  if (Object.keys(updates).length === 0) return { success: true, message: "Sin cambios para guardar." };

  const { error } = await supabase.from("orders").update(updates).eq("id", order.id);

  if (error) return { success: false, errors: [`No se pudo actualizar el pedido: ${error.message}`] };

  return { success: true, message: "Pedido actualizado." };
}

export async function generateReceipt(payload: z.infer<typeof generateReceiptSchema>): Promise<GenerateReceiptResult> {
  const parsed = generateReceiptSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  // Modo demo persistido (tabla demo_orders)
  const storedDemo = await fetchDemoOrderById(parsed.data.orderId);
  if (storedDemo?.provider_slug === "demo") {
    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase
        .from("demo_orders")
        .update({
          delivered_items: parsed.data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          receipt_generated_at: now,
        })
        .eq("id", storedDemo.id);
    }

    return { success: true, message: "Remito generado en modo demo.", receiptGeneratedAt: now };
  }

  // Modo demo estático (ids no UUID) — no toca base real pero deja feedback.
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(parsed.data.orderId)) {
    const now = new Date().toISOString();
    return { success: true, message: "Remito generado en modo demo.", receiptGeneratedAt: now };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase."] };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, provider_id, receipt_generated_at, order_items(id, product_id, quantity)")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (orderError || !order) {
    return { success: false, errors: [`Pedido no encontrado: ${orderError?.message ?? "sin detalle"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== (order as { provider_id?: string }).provider_id) {
    return { success: false, errors: ["No tienes acceso a este pedido."] };
  }

  const orderItems = (order.order_items ?? []) as { id: string; product_id?: string | null; quantity: number }[];

  const missing = parsed.data.items.filter((entry) => !orderItems.some((row) => row.id === entry.orderItemId));
  if (missing.length > 0) {
    return { success: false, errors: ["Algún producto no pertenece al pedido."] };
  }

  const exceeding = parsed.data.items.find((entry) => {
    const row = orderItems.find((item) => item.id === entry.orderItemId);
    return row ? entry.quantity > row.quantity : false;
  });
  if (exceeding) {
    return { success: false, errors: ["No puedes enviar más cantidad de la que se pidió. Ajusta los valores."] };
  }

  for (const item of parsed.data.items) {
    const { error } = await supabase
      .from("order_items")
      .update({ delivered_quantity: item.quantity })
      .eq("id", item.orderItemId);

    if (error) {
      return { success: false, errors: [`No se pudo guardar la cantidad de ${item.productId}: ${error.message}`] };
    }
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({ receipt_generated_at: now })
    .eq("id", parsed.data.orderId);

  if (updateError) {
    return { success: false, errors: [`No se pudo marcar el remito como generado: ${updateError.message}`] };
  }

  return { success: true, message: "Remito generado.", receiptGeneratedAt: now };
}

export async function updateDeliveryDate(
  payload: z.infer<typeof updateDeliveryDateSchema>,
): Promise<UpdateDeliveryDateResult> {
  const parsed = updateDeliveryDateSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  if (parsed.data.orderId.startsWith("00000000-0000-4000-8000-00000000o") || parsed.data.orderId === "demo") {
    return { success: true, message: "Pedido demo actualizado (no se guardan cambios).", deliveryDate: parsed.data.deliveryDate };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase."] };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, provider_id")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (orderError || !order) {
    return { success: false, errors: [`Pedido no encontrado: ${orderError?.message ?? "sin detalle"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== order.provider_id) {
    return { success: false, errors: ["No tienes acceso a este pedido."] };
  }

  const { error } = await supabase
    .from("orders")
    .update({ delivery_date: parsed.data.deliveryDate })
    .eq("id", parsed.data.orderId);

  if (error) {
    return { success: false, errors: [`No se pudo actualizar la entrega: ${error.message}`] };
  }

  return { success: true, message: "Fecha de entrega reprogramada.", deliveryDate: parsed.data.deliveryDate };
}
