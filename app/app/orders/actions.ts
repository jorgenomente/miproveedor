"use server";

import { z } from "zod";
import { getDemoData } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getProviderScope } from "@/lib/provider-scope";

const statusOptions = ["nuevo", "preparando", "enviado", "entregado", "cancelado"] as const;

const updateSchema = z.object({
  providerSlug: z.string().min(2),
  orderId: z.string().uuid(),
  status: z.enum(statusOptions),
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
  status: (typeof statusOptions)[number];
  total: number;
  createdAt: string | null;
};

export type ListOrdersResult =
  | { success: true; orders: OrderListItem[]; provider: ProviderRow }
  | { success: false; errors: string[] };

export type UpdateOrderResult =
  | { success: true; message: string }
  | { success: false; errors: string[] };

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
      status: order.status,
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
        status: order.status,
        total,
        createdAt: order.created_at,
      };
    }) ?? [];

  return { success: true, orders, provider };
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

  const transitions: Record<(typeof statusOptions)[number], (typeof statusOptions)[number][]> = {
    nuevo: ["preparando", "cancelado"],
    preparando: ["enviado", "entregado", "cancelado"],
    enviado: [],
    entregado: [],
    cancelado: [],
  };

  const currentStatus = order.status as (typeof statusOptions)[number];

  if (!transitions[currentStatus]?.includes(parsed.data.status)) {
    return {
      success: false,
      errors: ["Transición de estado no permitida."],
    };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", order.id);

  if (error) {
    return { success: false, errors: [`No se pudo actualizar el pedido: ${error.message}`] };
  }

  return { success: true, message: "Estado actualizado." };
}
