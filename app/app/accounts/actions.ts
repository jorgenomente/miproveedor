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
type PaymentProofStatus = "no_aplica" | "pendiente" | "subido" | "verificado";
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

export type ProviderRow = {
  id: string;
  name: string;
  slug: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  is_active?: boolean | null;
};

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
  deliveryDate?: string | null;
  deliveryZoneName?: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  paymentMethod?: PaymentMethod | null;
  paymentProofStatus?: PaymentProofStatus | null;
  paymentProofUrl?: string | null;
};

export type ArchivedOrder = {
  id: string;
  client: ClientSummary;
  total: number;
  status: OrderStatus;
  createdAt: string | null;
  archivedAt: string | null;
  paymentMethod?: PaymentMethod | null;
  paymentProofStatus?: PaymentProofStatus | null;
  paymentProofUrl?: string | null;
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
    archivedCount?: number;
  };
  orders: AccountOrder[];
  payments: AccountPayment[];
};

export type AccountsResult =
  | { success: true; provider: ProviderRow; accounts: ClientAccount[]; archivedCount?: number }
  | { success: false; errors: string[] };

export type RecordPaymentResult =
  | { success: true; message: string }
  | { success: false; errors: string[] };

export type ProofStatusResult =
  | { success: true; proofUrl?: string | null; status?: PaymentProofStatus }
  | { success: false; errors: string[] };

export type UpdateOrderStatusResult =
  | { success: true }
  | { success: false; errors: string[] };

export type DeleteOrderResult =
  | { success: true }
  | { success: false; errors: string[] };

export type UpdatePaymentMethodResult =
  | { success: true }
  | { success: false; errors: string[] };

export type ArchivedOrdersResult =
  | { success: true; provider: ProviderRow; orders: ArchivedOrder[] }
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
  (items ?? []).reduce((acc, item) => {
    const qty = (item as { delivered_quantity?: number | null }).delivered_quantity ?? item.quantity ?? 0;
    return acc + Number(item.unit_price ?? 0) * Number(qty);
  }, 0);

const isOrderConfirmedServer = (
  order: { id: string; status?: string | null; paymentMethod?: PaymentMethod | null; paymentProofStatus?: string | null },
  payments: AccountPayment[],
) => {
  const status = normalizeStatus(order.status);
  if (status !== "entregado") return false;

  const proofVerified = order.paymentProofStatus === "verificado";
  const proofUploaded = order.paymentProofStatus === "subido";
  const approvedForOrder = payments.filter((payment) => payment.orderId === order.id && payment.status === "approved");

  if (order.paymentMethod === "efectivo") {
    return approvedForOrder.some((payment) => payment.method === "efectivo");
  }

  if (order.paymentMethod === "transferencia") {
    const hasApprovedTransfer = approvedForOrder.some((payment) => payment.method === "transferencia");
    // Confirmamos si el comprobante está verificado o si existe una transferencia aprobada con comprobante cargado.
    if (proofVerified) return true;
    return hasApprovedTransfer && (proofVerified || proofUploaded);
  }

  return false;
};

export async function getClientAccounts(providerSlug: string): Promise<AccountsResult> {
  if (!providerSlug) return { success: false, errors: ["Falta el proveedor."] };

  if (providerSlug === "demo") {
    const demo = getDemoData();
    const storedOrders = await fetchRecentDemoOrders({ providerSlug: "demo", includeArchived: true });
    const mergedOrders = [...storedOrders, ...demo.orders].map((order: DemoOrderRecord | DemoOrder) => {
      const clientSlug = "client_slug" in order ? order.client_slug : order.clientSlug;
      const status = "status" in order ? order.status : "nuevo";
      const itemsRaw =
        "items" in order
          ? order.items
          : (order as { order_items?: { quantity?: number; unit_price?: number }[] }).order_items ?? [];
      const items = Array.isArray(itemsRaw) ? (itemsRaw as any[]) : [];
      const itemsTotal = items.reduce(
        (acc, item: any) => acc + Number(item.unitPrice ?? item.unit_price ?? 0) * Number(item.quantity ?? 0),
        0,
      );
      const rawTotal = "total" in order ? Number(order.total ?? 0) : 0;
      const total = rawTotal > 0 ? rawTotal : itemsTotal;
      const createdAt = "created_at" in order ? order.created_at : (order as DemoOrder).createdAt ?? null;
      const paymentMethod =
        "payment_method" in order
          ? ((order as { payment_method?: PaymentMethod | null }).payment_method ?? null)
          : (order as DemoOrder).paymentMethod ?? "efectivo";
      const rawProof = "payment_proof_status" in order ? (order as any).payment_proof_status : (order as DemoOrder).paymentProofStatus;
      const paymentProofStatus =
        rawProof === "subido" || rawProof === "pendiente" || rawProof === "no_aplica" ? rawProof : "pendiente";
      const paymentProofUrl =
        "payment_proof_url" in order
          ? (order as { payment_proof_url?: string | null }).payment_proof_url ?? null
          : "paymentProofUrl" in order
            ? (order as { paymentProofUrl?: string | null }).paymentProofUrl ?? null
            : null;
      const isArchived =
        "is_archived" in order
          ? Boolean((order as { is_archived?: boolean | null }).is_archived)
          : "isArchived" in order
            ? Boolean((order as { isArchived?: boolean | null }).isArchived)
            : false;
      const archivedAt = "archived_at" in order ? (order as { archived_at?: string | null }).archived_at ?? null : null;
      const deliveryDate =
        "delivery_date" in order
          ? (order as { delivery_date?: string | null }).delivery_date ?? null
          : "deliveryDate" in order
            ? (order as { deliveryDate?: string | null }).deliveryDate ?? null
            : null;
      const deliveryZoneName =
        "delivery_zone_name" in order
          ? (order as { delivery_zone_name?: string | null }).delivery_zone_name ?? null
          : "deliveryZoneName" in order
            ? (order as { deliveryZoneName?: string | null }).deliveryZoneName ?? null
            : null;

      return {
        id: order.id,
        clientSlug,
        status: normalizeStatus(status),
        total,
        createdAt,
        paymentMethod,
        paymentProofStatus,
        paymentProofUrl,
        isArchived,
        deliveryDate,
        deliveryZoneName,
        archivedAt,
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
    const archivedCounts = new Map<string, number>();

    mergedOrders.forEach((order) => {
      const client = clientMap.get(order.clientSlug);
      if (!client) return;
      if (order.isArchived) {
        const current = archivedCounts.get(client.id) ?? 0;
        archivedCounts.set(client.id, current + 1);
        return;
      }
      const entry: AccountOrder = {
        id: order.id,
        total: Number(order.total ?? 0),
        status: order.status,
        createdAt: order.createdAt ?? null,
        paymentMethod: order.paymentMethod ?? null,
        isArchived: order.isArchived ?? false,
        archivedAt: order.archivedAt ?? null,
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
      const activeOrderIds = new Set(validOrders.map((order) => order.id));
      const confirmedOrders = validOrders.filter((order) => isOrderConfirmedServer(order, clientPayments));
      const pendingOrders = validOrders.filter((order) => !isOrderConfirmedServer(order, clientPayments));
      const totalOrdered = validOrders.reduce((acc, order) => acc + order.total, 0);
      const paid = confirmedOrders.reduce((acc, order) => acc + order.total, 0);
      const pendingPayments = clientPayments
        .filter((payment) => payment.status === "pending" && (!payment.orderId || activeOrderIds.has(payment.orderId)))
        .reduce((acc, payment) => acc + payment.amount, 0);
      const pending = Math.max(pendingOrders.reduce((acc, order) => acc + order.total, 0), pendingPayments, 0);

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
          archivedCount: archivedCounts.get(client.id) ?? 0,
        },
        orders: clientOrders,
        payments: clientPayments,
      };
    });

    return {
      success: true,
      provider: {
        id: demo.provider.id,
        name: demo.provider.name,
        slug: demo.provider.slug,
        contactEmail: demo.provider.contact_email ?? null,
        contactPhone: demo.provider.contact_phone ?? null,
        address: null,
        city: null,
        country: null,
      },
      accounts,
      archivedCount: mergedOrders.filter((order) => order.isArchived).length,
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, name, slug, contact_email, contact_phone, is_active")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const [
    { data: clients, error: clientsError },
    { data: orders, error: ordersError },
    { data: payments, error: paymentsError },
    { data: archivedRows },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, slug, contact_name, contact_phone, address, is_active")
      .eq("provider_id", provider.id)
      .order("name", { ascending: true }),
    supabase
      .from("orders")
      .select(
        "id, client_id, status, created_at, archived_at, is_archived, payment_method, payment_proof_status, payment_proof_url, delivery_date, delivery_zone:delivery_zones(name), order_items(quantity, delivered_quantity, unit_price)",
      )
      .eq("provider_id", provider.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("client_payments")
      .select("id, client_id, order_id, amount, status, method, reference, note, paid_at, created_at")
      .eq("provider_id", provider.id)
      .order("paid_at", { ascending: false, nullsFirst: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("client_id")
      .eq("provider_id", provider.id)
      .eq("is_archived", true),
  ]);

  if (clientsError) return { success: false, errors: [`No se pudieron cargar clientes: ${clientsError.message}`] };
  if (ordersError) return { success: false, errors: [`No se pudieron cargar pedidos: ${ordersError.message}`] };
  if (paymentsError) return { success: false, errors: [`No se pudieron cargar pagos: ${paymentsError.message}`] };

  const archivedCounts = new Map<string, number>();
  (archivedRows ?? []).forEach((row) => {
    const clientId = (row as { client_id?: string }).client_id;
    if (!clientId) return;
    archivedCounts.set(clientId, (archivedCounts.get(clientId) ?? 0) + 1);
  });

  const orderBuckets = new Map<string, AccountOrder[]>();
  (orders ?? []).forEach((order) => {
    if ((order as { is_archived?: boolean }).is_archived) return;
    const entry: AccountOrder = {
      id: order.id,
      total: calculateOrderTotal(order.order_items),
      status: normalizeStatus(order.status as string),
      createdAt: (order as { created_at?: string | null }).created_at ?? null,
      isArchived: Boolean((order as { is_archived?: boolean | null }).is_archived),
      archivedAt: (order as { archived_at?: string | null }).archived_at ?? null,
      paymentMethod: (order as { payment_method?: PaymentMethod | null }).payment_method ?? null,
      paymentProofStatus: (order as { payment_proof_status?: PaymentProofStatus | null }).payment_proof_status ?? null,
      paymentProofUrl: (order as { payment_proof_url?: string | null }).payment_proof_url ?? null,
      deliveryDate: (order as { delivery_date?: string | null }).delivery_date ?? null,
      deliveryZoneName:
        Array.isArray((order as any).delivery_zone) && (order as any).delivery_zone.length > 0
          ? (order as any).delivery_zone[0]?.name ?? null
          : ((order as any).delivery_zone as { name?: string } | null | undefined)?.name ?? null,
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
      const activeOrderIds = new Set(validOrders.map((order) => order.id));
      const confirmedOrders = validOrders.filter((order) => isOrderConfirmedServer(order, clientPayments));
      const pendingOrders = validOrders.filter((order) => !isOrderConfirmedServer(order, clientPayments));
      const totalOrdered = validOrders.reduce((acc, order) => acc + order.total, 0);
      const paid = confirmedOrders.reduce((acc, order) => acc + order.total, 0);
      const pendingPayments = clientPayments
        .filter((payment) => payment.status === "pending" && (!payment.orderId || activeOrderIds.has(payment.orderId)))
        .reduce((acc, payment) => acc + payment.amount, 0);
      const pending = Math.max(pendingOrders.reduce((acc, order) => acc + order.total, 0), pendingPayments, 0);

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
          archivedCount: archivedCounts.get(client.id) ?? 0,
        },
        orders: clientOrders,
        payments: clientPayments,
      };
    }) ?? [];

  const providerRow: ProviderRow = {
    id: provider.id,
    name: provider.name,
    slug: provider.slug,
    contactEmail: (provider as { contact_email?: string | null }).contact_email ?? null,
    contactPhone: (provider as { contact_phone?: string | null }).contact_phone ?? null,
    address: null,
    city: null,
    country: null,
    is_active: provider.is_active ?? null,
  };

  const providerArchivedTotal = Array.from(archivedCounts.values()).reduce((acc, val) => acc + val, 0);

  return { success: true, provider: providerRow, accounts, archivedCount: providerArchivedTotal };
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

export async function markOrderProofStatus({
  providerSlug,
  orderId,
  proofUrl,
  status,
}: {
  providerSlug: string;
  orderId: string;
  proofUrl?: string | null;
  status: PaymentProofStatus;
}): Promise<ProofStatusResult> {
  if (!orderId) return { success: false, errors: ["Falta el ID del pedido"] };
  if (!["no_aplica", "pendiente", "subido", "verificado"].includes(status)) {
    return { success: false, errors: ["Estado de comprobante inválido"] };
  }
  const targetStatus = status;
  const dbStatus: PaymentProofStatus = status === "verificado" ? "subido" : status;

  if (providerSlug === "demo") {
    // No persistimos en demo, solo devolvemos éxito para mantener la UI fluida.
    return {
      success: true,
      proofUrl: proofUrl ?? null,
      status: targetStatus,
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const payload: { payment_proof_status: PaymentProofStatus; payment_proof_url?: string | null } = {
    payment_proof_status: dbStatus,
  };
  if (proofUrl !== undefined) {
    payload.payment_proof_url = proofUrl;
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", orderId)
    .eq("provider_id", provider.id);

  if (updateError) {
    return { success: false, errors: [`No se pudo actualizar el comprobante: ${updateError.message}`] };
  }

  return { success: true };
}

export async function updateOrderStatus({
  providerSlug,
  orderId,
  status,
}: {
  providerSlug: string;
  orderId: string;
  status: OrderStatus;
}): Promise<UpdateOrderStatusResult> {
  if (!orderId) return { success: false, errors: ["Falta el ID del pedido"] };
  if (!["nuevo", "preparando", "enviado", "entregado", "cancelado"].includes(status)) {
    return { success: false, errors: ["Estado de pedido inválido"] };
  }

  if (providerSlug === "demo") {
    const supabase = getSupabaseAdmin();
    if (!supabase) return { success: true };
    const { error } = await supabase.from("demo_orders").update({ status }).eq("id", orderId);
    if (error) return { success: false, errors: [`No se pudo actualizar el demo: ${error.message}`] };
    return { success: true };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("provider_id", provider.id);

  if (updateError) {
    return { success: false, errors: [`No se pudo actualizar el pedido: ${updateError.message}`] };
  }

  return { success: true };
}

export async function updatePaymentMethod({
  providerSlug,
  orderId,
  method,
}: {
  providerSlug: string;
  orderId: string;
  method: PaymentMethod;
}): Promise<UpdatePaymentMethodResult> {
  if (!orderId) return { success: false, errors: ["Falta el ID del pedido"] };
  if (!["efectivo", "transferencia"].includes(method)) {
    return { success: false, errors: ["Método de pago inválido"] };
  }

  if (providerSlug === "demo") {
    const supabase = getSupabaseAdmin();
    if (!supabase) return { success: true };
    const updates: Record<string, unknown> = {
      payment_method: method,
      payment_proof_status: method === "efectivo" ? "no_aplica" : "pendiente",
      payment_proof_url: method === "efectivo" ? null : null,
    };
    const { error } = await supabase.from("demo_orders").update(updates).eq("id", orderId);
    if (error) return { success: false, errors: [`No se pudo actualizar el demo: ${error.message}`] };
    return { success: true };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const updates: Record<string, unknown> = {
    payment_method: method,
    payment_proof_status: method === "efectivo" ? "no_aplica" : "pendiente",
    payment_proof_url: method === "efectivo" ? null : null,
  };

  const { error: updateError } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .eq("provider_id", provider.id);

  if (updateError) {
    return { success: false, errors: [`No se pudo actualizar el método de pago: ${updateError.message}`] };
  }

  return { success: true };
}

export async function deleteOrder({
  providerSlug,
  orderId,
  archivedBy,
  archivedReason,
}: {
  providerSlug: string;
  orderId: string;
  archivedBy: string;
  archivedReason: string;
}): Promise<DeleteOrderResult> {
  if (!orderId) return { success: false, errors: ["Falta el ID del pedido."] };
  if (!archivedBy?.trim()) return { success: false, errors: ["Falta el responsable."] };
  if (!archivedReason?.trim()) return { success: false, errors: ["Falta la razón de archivo."] };

  const archivedAt = new Date().toISOString();
  const auditNote = `Archivado por ${archivedBy.trim()} (${new Date().toLocaleString("es-AR")}). Motivo: ${archivedReason.trim()}`;

  if (providerSlug === "demo") {
    const supabase = getSupabaseAdmin();
    if (!supabase) return { success: true };
    const { data: orderRow } = await supabase.from("demo_orders").select("note").eq("id", orderId).maybeSingle();
    const existingNote = (orderRow as { note?: string | null } | null)?.note ?? null;
    const mergedNote = [existingNote, auditNote].filter(Boolean).join("\n\n");
    const { error } = await supabase
      .from("demo_orders")
      .update({ is_archived: true, archived_at: archivedAt, note: mergedNote })
      .eq("id", orderId);
    if (error) return { success: false, errors: [`No se pudo archivar el pedido demo: ${error.message}`] };
    return { success: true };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const { data: orderRow, error: orderFetchError } = await supabase
    .from("orders")
    .select("note")
    .eq("id", orderId)
    .eq("provider_id", provider.id)
    .maybeSingle();

  if (orderFetchError) {
    return { success: false, errors: [`No se pudo obtener el pedido: ${orderFetchError.message}`] };
  }

  const existingNote = (orderRow as { note?: string | null } | null)?.note ?? null;
  const mergedNote = [existingNote, auditNote].filter(Boolean).join("\n\n");

  const { error: updateError } = await supabase
    .from("orders")
    .update({ is_archived: true, archived_at: archivedAt, note: mergedNote })
    .eq("id", orderId)
    .eq("provider_id", provider.id);

  if (updateError) {
    return { success: false, errors: [`No se pudo archivar el pedido: ${updateError.message}`] };
  }

  return { success: true };
}

export async function listArchivedOrders(providerSlug: string): Promise<ArchivedOrdersResult> {
  if (!providerSlug) return { success: false, errors: ["Falta el proveedor."] };

  if (providerSlug === "demo") {
    const demo = getDemoData();
    const storedOrders = await fetchRecentDemoOrders({ providerSlug: "demo" });
    const archivedOrders = [...storedOrders, ...demo.orders]
      .filter((order) => {
        const archived =
          "is_archived" in order
            ? (order as { is_archived?: boolean | null }).is_archived
            : "isArchived" in order
              ? (order as { isArchived?: boolean | null }).isArchived
              : false;
        return Boolean(archived);
      })
      .map((order) => {
        const clientSlug = "client_slug" in order ? order.client_slug : order.clientSlug;
        const client = demo.clients.find((item) => item.slug === clientSlug);
        return {
          id: order.id,
          client: client
            ? {
                id: client.id,
                name: client.name,
                slug: client.slug,
                contactName: client.contact_name ?? null,
                contactPhone: client.contact_phone ?? null,
                isActive: client.is_active ?? true,
              }
            : {
                id: "unknown",
                name: clientSlug,
                slug: clientSlug,
                contactName: null,
                contactPhone: null,
                isActive: true,
              },
          total: "total" in order ? Number(order.total ?? 0) : 0,
          status: normalizeStatus("status" in order ? order.status : "nuevo"),
          createdAt: "created_at" in order ? order.created_at : null,
          archivedAt: "archived_at" in order ? (order as any).archived_at ?? null : null,
          paymentMethod:
            "payment_method" in order
              ? ((order as { payment_method?: PaymentMethod | null }).payment_method ?? null)
              : (order as DemoOrder).paymentMethod ?? null,
          paymentProofStatus:
            "payment_proof_status" in order ? (order as any).payment_proof_status ?? null : (order as DemoOrder).paymentProofStatus ?? null,
          paymentProofUrl:
            "payment_proof_url" in order
              ? (order as { payment_proof_url?: string | null }).payment_proof_url ?? null
              : "paymentProofUrl" in order
                ? (order as { paymentProofUrl?: string | null }).paymentProofUrl ?? null
                : null,
        } satisfies ArchivedOrder;
      });

    return {
      success: true,
      provider: {
        id: demo.provider.id,
        name: demo.provider.name,
        slug: demo.provider.slug,
        contactEmail: demo.provider.contact_email ?? null,
        contactPhone: demo.provider.contact_phone ?? null,
        address: null,
        city: null,
        country: null,
      },
      orders: archivedOrders,
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, name, slug, contact_email, contact_phone")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        status,
        created_at,
        archived_at,
        payment_method,
        payment_proof_status,
        payment_proof_url,
        is_archived,
        client:clients(id, name, slug, contact_name, contact_phone, is_active),
        order_items(quantity, delivered_quantity, unit_price)
      `,
    )
    .eq("provider_id", provider.id)
    .eq("is_archived", true)
    .order("archived_at", { ascending: false });

  if (error) {
    return { success: false, errors: [`No se pudieron cargar pedidos archivados: ${error.message}`] };
  }

  const mapped: ArchivedOrder[] =
    orders?.map((order) => ({
      id: order.id,
      status: normalizeStatus(order.status as string),
      createdAt: (order as { created_at?: string | null }).created_at ?? null,
      archivedAt: (order as { archived_at?: string | null }).archived_at ?? null,
      paymentMethod: (order as { payment_method?: PaymentMethod | null }).payment_method ?? null,
      paymentProofStatus: (order as { payment_proof_status?: PaymentProofStatus | null }).payment_proof_status ?? null,
      paymentProofUrl: (order as { payment_proof_url?: string | null }).payment_proof_url ?? null,
      total: calculateOrderTotal((order as { order_items?: { quantity?: number; unit_price?: number | string | null }[] }).order_items),
      client: {
        id: (order as any).client?.id ?? "unknown",
        name: (order as any).client?.name ?? "Cliente",
        slug: (order as any).client?.slug ?? "sin-slug",
        contactName: (order as any).client?.contact_name ?? null,
        contactPhone: (order as any).client?.contact_phone ?? null,
        isActive: (order as any).client?.is_active ?? true,
      },
    })) ?? [];

  const providerRow: ProviderRow = {
    id: provider.id,
    name: provider.name,
    slug: provider.slug,
    contactEmail: (provider as { contact_email?: string | null }).contact_email ?? null,
    contactPhone: (provider as { contact_phone?: string | null }).contact_phone ?? null,
    address: null,
    city: null,
    country: null,
  };

  return { success: true, provider: providerRow, orders: mapped };
}

export async function restoreOrder({
  providerSlug,
  orderId,
}: {
  providerSlug: string;
  orderId: string;
}): Promise<DeleteOrderResult> {
  if (!orderId) return { success: false, errors: ["Falta el ID del pedido."] };

  if (providerSlug === "demo") {
    const supabase = getSupabaseAdmin();
    if (!supabase) return { success: true };
    const { error } = await supabase
      .from("demo_orders")
      .update({ is_archived: false, archived_at: null })
      .eq("id", orderId);
    if (error) return { success: false, errors: [`No se pudo restaurar el pedido demo: ${error.message}`] };
    return { success: true };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ is_archived: false, archived_at: null })
    .eq("id", orderId)
    .eq("provider_id", provider.id);

  if (updateError) {
    return { success: false, errors: [`No se pudo restaurar el pedido: ${updateError.message}`] };
  }

  return { success: true };
}
