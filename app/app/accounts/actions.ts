"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { getDemoData, type DemoOrder } from "@/lib/demo-data";
import { fetchRecentDemoOrders, type DemoOrderRecord } from "@/lib/demo-orders";
import { getProviderScope } from "@/lib/provider-scope";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type PaymentStatus = "pending" | "approved" | "rejected";
type PaymentMethod = "efectivo" | "transferencia";
type OrderStatus = "nuevo" | "preparando" | "enviado" | "entregado" | "cancelado";
type DemoClientPaymentRow = {
  id: string;
  provider_slug: string;
  client_slug: string;
  order_id?: string | null;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  reference?: string | null;
  note?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

export type ProviderRow = { id: string; name: string; slug: string; is_active?: boolean | null };

export type ClientSummary = {
  id: string;
  name: string;
  slug: string;
  contactName?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  isActive?: boolean | null;
};

export type AccountOrder = {
  id: string;
  total: number;
  status: OrderStatus;
  createdAt: string | null;
  paymentMethod?: PaymentMethod | null;
};

export type AccountPayment = {
  id: string;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  reference?: string | null;
  note?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  orderId?: string | null;
};

export type ClientAccount = {
  client: ClientSummary;
  totals: {
    ordersCount: number;
    totalOrdered: number;
    paid: number;
    pending: number;
    pendingPayments: number;
    lastOrderAt?: string | null;
  };
  orders: AccountOrder[];
  payments: AccountPayment[];
};

export type AccountsResult =
  | { success: true; provider: ProviderRow; accounts: ClientAccount[] }
  | { success: false; errors: string[] };

export type RecordPaymentResult =
  | { success: true; message: string }
  | { success: false; errors: string[] };

const paymentSchema = z.object({
  providerSlug: z.string().min(2),
  clientId: z.string().uuid(),
  orderId: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive(),
  status: z.enum(["pending", "approved", "rejected"]).default("approved"),
  method: z.enum(["efectivo", "transferencia"]).optional().nullable(),
  reference: z.string().trim().max(160).optional().nullable(),
  note: z.string().trim().max(400).optional().nullable(),
  paidAt: z
    .string()
    .datetime()
    .optional()
    .nullable(),
});

const demoPaymentsSeed: {
  id: string;
  client_slug: string;
  order_id?: string | null;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  reference?: string | null;
  note?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
}[] = [
  {
    id: "00000000-0000-4000-8000-00000000cp01",
    client_slug: "almacen-centro",
    amount: 28500,
    status: "approved",
    method: "transferencia",
    reference: "TRX-9821",
    note: "Recibido el lunes",
    paid_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-00000000cp02",
    client_slug: "dietetica-norte",
    amount: 15000,
    status: "pending",
    method: "efectivo",
    reference: "Efectivo contra entrega",
    paid_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-00000000cp03",
    client_slug: "mercado-sur",
    amount: 18000,
    status: "approved",
    method: "transferencia",
    reference: "CBU 123",
    note: "Falta comprobante",
    paid_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const normalizeStatus = (status?: string | null): OrderStatus => {
  if (status === "preparando") return "preparando";
  if (status === "entregado") return "entregado";
  if (status === "enviado") return "enviado";
  if (status === "cancelado") return "cancelado";
  return "nuevo";
};

const RETENTION_HOURS = 24 * 14;

async function fetchDemoClientPayments(providerSlug: string, clientSlug?: string): Promise<DemoClientPaymentRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const cutoffDate = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000).toISOString();
  let query = supabase.from("demo_client_payments").select("*").eq("provider_slug", providerSlug).gt("created_at", cutoffDate);
  if (clientSlug) query = query.eq("client_slug", clientSlug);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    provider_slug: row.provider_slug,
    client_slug: row.client_slug,
    order_id: row.order_id ?? null,
    amount: Number(row.amount ?? 0),
    status: (row.status as PaymentStatus) ?? "approved",
    method: (row.method as PaymentMethod | null) ?? null,
    reference: row.reference ?? null,
    note: row.note ?? null,
    paid_at: row.paid_at ?? null,
    created_at: row.created_at ?? null,
  }));
}

async function persistDemoClientPayment(payload: {
  providerSlug: string;
  clientSlug: string;
  orderId?: string | null;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  reference?: string | null;
  note?: string | null;
  paidAt?: string | null;
}): Promise<{ id: string; created_at: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { id: `demo-payment-${Date.now()}`, created_at: new Date().toISOString() };
  }

  const { data, error } = await supabase
    .from("demo_client_payments")
    .insert({
      provider_slug: payload.providerSlug,
      client_slug: payload.clientSlug,
      order_id: payload.orderId ?? null,
      amount: payload.amount,
      status: payload.status,
      method: payload.method ?? null,
      reference: payload.reference ?? null,
      note: payload.note ?? null,
      paid_at: payload.paidAt ?? null,
    })
    .select("id, created_at")
    .maybeSingle();

  if (error || !data?.id) {
    return { id: `demo-payment-${Date.now()}`, created_at: new Date().toISOString() };
  }

  return data;
}

const calculateOrderTotal = (items?: { quantity?: number; unit_price?: number | string | null }[]) =>
  (items ?? []).reduce((acc, item) => acc + Number(item.unit_price ?? 0) * Number(item.quantity ?? 0), 0);

export async function getClientAccounts(providerSlug: string): Promise<AccountsResult> {
  if (!providerSlug) return { success: false, errors: ["Falta el proveedor."] };

  if (providerSlug === "demo") {
    const demo = getDemoData();
    const storedOrders = await fetchRecentDemoOrders({ providerSlug: "demo" });
    const mergedOrders = [...storedOrders, ...demo.orders].map((order: DemoOrderRecord | DemoOrder) => {
      const clientSlug = "client_slug" in order ? order.client_slug : order.clientSlug;
      const status = "status" in order ? order.status : "nuevo";
      const total = "total" in order ? Number(order.total ?? 0) : 0;
      const createdAt = "created_at" in order ? order.created_at : (order as DemoOrder).createdAt ?? null;
      const paymentMethod =
        "payment_method" in order
          ? (order.payment_method as PaymentMethod | null)
          : (order as DemoOrder).paymentMethod ?? null;

      return {
        id: order.id,
        clientSlug,
        status: normalizeStatus(status),
        total,
        createdAt,
        paymentMethod,
      };
    });

    const demoPayments = await fetchDemoClientPayments("demo");
    const payments = [
      ...demoPaymentsSeed,
      ...demoPayments.map((payment) => ({
        ...payment,
        client_slug: payment.client_slug,
      })),
    ];

    const clientMap = new Map(demo.clients.map((client) => [client.slug, client]));
    const paymentBuckets = new Map<string, AccountPayment[]>();
    const orderBuckets = new Map<string, AccountOrder[]>();

    mergedOrders.forEach((order) => {
      const client = clientMap.get(order.clientSlug);
      if (!client) return;
      const entry: AccountOrder = {
        id: order.id,
        total: Number(order.total ?? 0),
        status: order.status,
        createdAt: order.createdAt ?? null,
        paymentMethod: order.paymentMethod ?? null,
      };
      const existing = orderBuckets.get(client.id) ?? [];
      orderBuckets.set(client.id, [...existing, entry]);
    });

    payments.forEach((payment) => {
      const client = clientMap.get(payment.client_slug);
      if (!client) return;
      const entry: AccountPayment = {
        id: payment.id,
        amount: Number(payment.amount ?? 0),
        status: payment.status,
      method: payment.method ?? null,
      reference: payment.reference ?? null,
      note: payment.note ?? null,
      paidAt: payment.paid_at ?? null,
      createdAt: payment.created_at ?? null,
      orderId: payment.order_id ?? null,
      };
      const existing = paymentBuckets.get(client.id) ?? [];
      paymentBuckets.set(client.id, [...existing, entry]);
    });

    const accounts: ClientAccount[] = demo.clients.map((client) => {
      const clientOrders = (orderBuckets.get(client.id) ?? []).sort((a, b) => {
        const aDate = new Date(a.createdAt ?? "").getTime();
        const bDate = new Date(b.createdAt ?? "").getTime();
        return bDate - aDate;
      });
      const clientPayments = (paymentBuckets.get(client.id) ?? []).sort((a, b) => {
        const aDate = new Date(a.paidAt ?? a.createdAt ?? "").getTime();
        const bDate = new Date(b.paidAt ?? b.createdAt ?? "").getTime();
        return bDate - aDate;
      });
      const validOrders = clientOrders.filter((order) => order.status !== "cancelado");
      const totalOrdered = validOrders.reduce((acc, order) => acc + order.total, 0);
      const paid = clientPayments.filter((payment) => payment.status === "approved").reduce((acc, payment) => acc + payment.amount, 0);
      const pendingPayments = clientPayments.filter((payment) => payment.status === "pending").reduce((acc, payment) => acc + payment.amount, 0);
      const pending = Math.max(totalOrdered - paid, 0);

      return {
        client: {
          id: client.id,
          name: client.name,
          slug: client.slug,
          contactName: client.contact_name ?? null,
          contactPhone: client.contact_phone ?? null,
          address: client.address ?? null,
          isActive: client.is_active ?? true,
        },
        totals: {
          ordersCount: clientOrders.length,
          totalOrdered,
          paid,
          pending,
          pendingPayments,
          lastOrderAt: clientOrders[0]?.createdAt ?? null,
        },
        orders: clientOrders,
        payments: clientPayments,
      };
    });

    return { success: true, provider: { id: demo.provider.id, name: demo.provider.name, slug: demo.provider.slug }, accounts };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, name, slug, is_active")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const [{ data: clients, error: clientsError }, { data: orders, error: ordersError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, slug, contact_name, contact_phone, address, is_active")
      .eq("provider_id", provider.id)
      .order("name", { ascending: true }),
    supabase
      .from("orders")
      .select("id, client_id, status, created_at, payment_method, order_items(quantity, unit_price)")
      .eq("provider_id", provider.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("client_payments")
      .select("id, client_id, order_id, amount, status, method, reference, note, paid_at, created_at")
      .eq("provider_id", provider.id)
      .order("paid_at", { ascending: false, nullsFirst: true })
      .order("created_at", { ascending: false }),
  ]);

  if (clientsError) return { success: false, errors: [`No se pudieron cargar clientes: ${clientsError.message}`] };
  if (ordersError) return { success: false, errors: [`No se pudieron cargar pedidos: ${ordersError.message}`] };
  if (paymentsError) return { success: false, errors: [`No se pudieron cargar pagos: ${paymentsError.message}`] };

  const orderBuckets = new Map<string, AccountOrder[]>();
  (orders ?? []).forEach((order) => {
    const entry: AccountOrder = {
      id: order.id,
      total: calculateOrderTotal(order.order_items),
      status: normalizeStatus(order.status as string),
      createdAt: (order as { created_at?: string | null }).created_at ?? null,
      paymentMethod: (order as { payment_method?: PaymentMethod | null }).payment_method ?? null,
    };
    const existing = orderBuckets.get(order.client_id) ?? [];
    orderBuckets.set(order.client_id, [...existing, entry]);
  });

  const paymentBuckets = new Map<string, AccountPayment[]>();
  (payments ?? []).forEach((payment) => {
    const entry: AccountPayment = {
      id: payment.id,
      amount: Number(payment.amount ?? 0),
      status: (payment.status as PaymentStatus) ?? "pending",
      method: (payment.method as PaymentMethod | null) ?? null,
      reference: payment.reference ?? null,
      note: payment.note ?? null,
      paidAt: (payment as { paid_at?: string | null }).paid_at ?? null,
      createdAt: (payment as { created_at?: string | null }).created_at ?? null,
      orderId: payment.order_id ?? null,
    };
    const existing = paymentBuckets.get(payment.client_id) ?? [];
    paymentBuckets.set(payment.client_id, [...existing, entry]);
  });

  const accounts: ClientAccount[] =
    clients?.map((client) => {
      const clientOrders = (orderBuckets.get(client.id) ?? []).sort((a, b) => {
        const aDate = new Date(a.createdAt ?? "").getTime();
        const bDate = new Date(b.createdAt ?? "").getTime();
        return bDate - aDate;
      });
      const clientPayments = (paymentBuckets.get(client.id) ?? []).sort((a, b) => {
        const aDate = new Date(a.paidAt ?? a.createdAt ?? "").getTime();
        const bDate = new Date(b.paidAt ?? b.createdAt ?? "").getTime();
        return bDate - aDate;
      });
      const validOrders = clientOrders.filter((order) => order.status !== "cancelado");
      const totalOrdered = validOrders.reduce((acc, order) => acc + order.total, 0);
      const paid = clientPayments.filter((payment) => payment.status === "approved").reduce((acc, payment) => acc + payment.amount, 0);
      const pendingPayments = clientPayments.filter((payment) => payment.status === "pending").reduce((acc, payment) => acc + payment.amount, 0);
      const pending = Math.max(totalOrdered - paid, 0);

      return {
        client: {
          id: client.id,
          name: client.name,
          slug: client.slug,
          contactName: client.contact_name ?? null,
          contactPhone: client.contact_phone ?? null,
          address: client.address ?? null,
          isActive: client.is_active ?? true,
        },
        totals: {
          ordersCount: clientOrders.length,
          totalOrdered,
          paid,
          pending,
          pendingPayments,
          lastOrderAt: clientOrders[0]?.createdAt ?? null,
        },
        orders: clientOrders,
        payments: clientPayments,
      };
    }) ?? [];

  return { success: true, provider: provider as ProviderRow, accounts };
}

export async function recordClientPayment(payload: z.infer<typeof paymentSchema>): Promise<RecordPaymentResult> {
  const parsed = paymentSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  const paidAt = parsed.data.paidAt ? new Date(parsed.data.paidAt).toISOString() : null;

  if (parsed.data.providerSlug === "demo") {
    const demo = getDemoData();
    const client = demo.clients.find((item) => item.id === parsed.data.clientId);
    if (!client) return { success: false, errors: ["Cliente demo no encontrado."] };

    await persistDemoClientPayment({
      providerSlug: "demo",
      clientSlug: client.slug,
      orderId: parsed.data.orderId ?? null,
      amount: parsed.data.amount,
      status: parsed.data.status,
      method: parsed.data.method ?? null,
      reference: parsed.data.reference ?? null,
      note: parsed.data.note ?? null,
      paidAt,
    });

    return { success: true, message: "Pago guardado en modo demo." };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", parsed.data.providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, provider_id")
    .eq("id", parsed.data.clientId)
    .maybeSingle();

  if (clientError || !client) {
    return { success: false, errors: [`Cliente no encontrado: ${clientError?.message ?? "sin detalle"}`] };
  }

  if (client.provider_id !== provider.id) {
    return { success: false, errors: ["El cliente no pertenece a este proveedor."] };
  }

  if (parsed.data.orderId) {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, provider_id")
      .eq("id", parsed.data.orderId)
      .maybeSingle();

    if (orderError) {
      return { success: false, errors: [`No se pudo validar el pedido: ${orderError.message}`] };
    }

    if (order && order.provider_id !== provider.id) {
      return { success: false, errors: ["El pedido no pertenece a este proveedor."] };
    }
  }

  const { error } = await supabase.from("client_payments").insert({
    id: randomUUID(),
    provider_id: provider.id,
    client_id: parsed.data.clientId,
    order_id: parsed.data.orderId ?? null,
    amount: parsed.data.amount,
    status: parsed.data.status,
    method: parsed.data.method ?? null,
    reference: parsed.data.reference ?? null,
    note: parsed.data.note ?? null,
    paid_at: paidAt,
  });

  if (error) {
    return { success: false, errors: [`No se pudo guardar el pago: ${error.message}`] };
  }

  return { success: true, message: "Pago registrado." };
}
