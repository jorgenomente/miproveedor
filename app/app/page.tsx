export const dynamic = "force-dynamic";
export const revalidate = 0;

import { DashboardClient, type DashboardDebugInfo, type OrderSummary, type ProviderSummary } from "./dashboard-client";
import { getDemoData } from "@/lib/demo-data";
import { fetchRecentDemoOrders } from "@/lib/demo-orders";
import { getProviderScope } from "@/lib/provider-scope";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function mapProviderRow(row: {
  id: string;
  name: string;
  slug: string;
  subscription_status?: "active" | "paused" | "canceled" | null;
  subscribed_at?: string | null;
  renews_at?: string | null;
}): ProviderSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    subscriptionStatus: row.subscription_status ?? null,
    subscribedAt: row.subscribed_at ?? null,
    renewsAt: row.renews_at ?? null,
  };
}

const STATUS_KEYS = ["nuevo", "preparando", "entregado"] as const;

function buildMetrics(orders: OrderSummary[], countsOverride?: Record<string, number>) {
  const counts =
    countsOverride ??
    orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

  return [
    { label: "Pedidos nuevos", value: String(counts.nuevo ?? 0) },
    { label: "En preparación", value: String(counts.preparando ?? 0) },
    { label: "Entregados", value: String(counts.entregado ?? 0) },
  ];
}

async function fetchStatusCounts(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  providerId: string,
) {
  const counts: Record<string, number> = {};
  const errors: string[] = [];

  await Promise.all(
    STATUS_KEYS.map(async (status) => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .eq("status", status);
      if (error) errors.push(error.message);
      counts[status] = count ?? 0;
    }),
  );

  return { counts, errors };
}

async function fetchData(preferredProvider?: string) {
  const preferred = preferredProvider?.trim();
  const debug: DashboardDebugInfo = { preferredSlug: preferred };

  if (preferred === "demo") {
    const demo = getDemoData();
    const demoProvider: ProviderSummary = {
      id: demo.provider.id,
      name: demo.provider.name,
      slug: demo.provider.slug,
      subscriptionStatus: "active",
      subscribedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      renewsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const storedOrders = await fetchRecentDemoOrders({ providerSlug: demo.provider.slug });
    const demoOrders: OrderSummary[] = [
      ...storedOrders.map((order) => ({
        id: order.id,
        status: order.status,
        clientName: demo.clients.find((client) => client.slug === order.client_slug)?.name ?? "Cliente demo",
        total: order.total,
        createdAt: order.created_at,
        paymentMethod: order.payment_method,
        contactPhone: order.contact_phone,
      })),
      ...demo.orders.map((order) => ({
        id: order.id,
        status: order.status,
        clientName: demo.clients.find((client) => client.slug === order.clientSlug)?.name ?? "Cliente demo",
        total: order.total,
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod ?? null,
        contactPhone: order.contactPhone ?? null,
      })),
    ].sort((a, b) => {
      const aDate = new Date(a.createdAt ?? "").getTime();
      const bDate = new Date(b.createdAt ?? "").getTime();
      return Number.isNaN(bDate) ? -1 : bDate - aDate;
    });

    debug.demo = true;
    debug.ordersLoaded = demoOrders.length;
    debug.resolvedProvider = { id: demoProvider.id, name: demoProvider.name, slug: demoProvider.slug };

    return {
      providers: [demoProvider],
      provider: demoProvider,
      orders: demoOrders,
      debug,
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  if (preferred) {
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, name, slug, is_active, subscription_status, subscribed_at, renews_at")
      .eq("slug", preferred)
      .maybeSingle();

    if (providerError || !provider) {
      debug.error = providerError?.message ?? "Proveedor no encontrado por slug preferido";
      return { providers: [], provider: null, orders: [], debug };
    }

    const providerSummary = mapProviderRow(provider);

    debug.resolvedProvider = { id: providerSummary.id, name: providerSummary.name, slug: providerSummary.slug };

    const { counts, errors: countErrors } = await fetchStatusCounts(supabase, provider.id);
    if (countErrors.length) {
      debug.ordersError = countErrors.join("; ");
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, status, created_at, client:clients(name), order_items(quantity, unit_price)")
      .eq("provider_id", provider.id)
      .order("created_at", { ascending: false })
      .limit(25);

    if (ordersError) {
      debug.ordersError = ordersError.message;
      return { providers: [providerSummary], provider: providerSummary, orders: [], debug };
    }

    const parsedOrders: OrderSummary[] =
      orders?.map((order) => {
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
          status: order.status,
          clientName,
          total,
          createdAt: order.created_at,
        };
      }) ?? [];

    debug.ordersLoaded = parsedOrders.length;

    return { providers: [providerSummary], provider: providerSummary, orders: parsedOrders, counts, debug };
  }

  const scopeResult = await getProviderScope();
  const scope = scopeResult.scope;
  if (scope?.role === "provider") {
    debug.scopeRole = "provider";
    debug.scopeProviderSlug = scope.provider.slug;
  } else if (scope?.role === "admin") {
    debug.scopeRole = "admin";
  } else if (scopeResult.error) {
    debug.scopeError = scopeResult.error;
  }

  let providersQuery = supabase
    .from("providers")
    .select("id, name, slug, is_active, subscription_status, subscribed_at, renews_at");

  if (scope?.role === "provider") {
    providersQuery = providersQuery.eq("id", scope.provider.id);
  }

  const { data: providers, error: providersError } = await providersQuery.order("created_at", {
    ascending: false,
  });

  if (providersError) return null;
  if (!providers || providers.length === 0) return { providers: [], provider: null, orders: [], debug };

  debug.providersCount = providers.length;

  const providerSummaries = providers.map(mapProviderRow);

  const provider =
    providers.find((p) => p.is_active !== false) || providers[0];

  if (!provider) return { providers: [], provider: null, orders: [], debug };

  const providerSummary = mapProviderRow(provider);
  debug.resolvedProvider = { id: providerSummary.id, name: providerSummary.name, slug: providerSummary.slug };

  const { counts, errors: countErrors } = await fetchStatusCounts(supabase, provider.id);
  if (countErrors.length) {
    debug.ordersError = countErrors.join("; ");
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, status, created_at, contact_phone, payment_method, shipping_cost, client:clients(name), order_items(quantity, unit_price)",
    )
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false })
    .limit(25);

  if (ordersError) {
    debug.ordersError = ordersError.message;
    return { providers: providerSummaries, provider: providerSummary, orders: [], debug };
  }

  const parsedOrders: OrderSummary[] =
    orders?.map((order) => {
      const shippingCost = Number((order as { shipping_cost?: number | null }).shipping_cost ?? 0);
      const total =
        (order.order_items?.reduce(
          (acc, item) => acc + Number(item.unit_price ?? 0) * item.quantity,
          0,
        ) ?? 0) + shippingCost;
      const clientName =
        Array.isArray(order.client) && order.client.length > 0
          ? order.client[0]?.name ?? "Cliente"
          : (order as { client?: { name?: string } }).client?.name ?? "Cliente";

      return {
        id: order.id,
        status: order.status,
        clientName,
        total,
        createdAt: order.created_at,
        paymentMethod: (order as { payment_method?: "efectivo" | "transferencia" | null }).payment_method ?? null,
        contactPhone: (order as { contact_phone?: string | null }).contact_phone ?? null,
      };
    }) ?? [];

  debug.ordersLoaded = parsedOrders.length;

  return {
    providers: providerSummaries,
    provider: providerSummary,
    orders: parsedOrders,
    counts,
    debug,
  };
}

export default async function AppDashboard({
  searchParams,
}: {
  searchParams?: Promise<{ provider?: string; debug?: string }>;
}) {
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const preferred = resolvedSearch?.provider;
  const data = await fetchData(preferred);
  const debug = typeof resolvedSearch?.debug !== "undefined";

  if (!data || !data.provider) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-2xl font-semibold">No hay proveedor seleccionado.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Crea un proveedor en /admin/providers o usa el parámetro ?provider=slug.
        </p>
      </div>
    );
  }

  const metrics = buildMetrics(data.orders, data.counts);
  const recentOrders = data.orders.slice(0, 10);

  return (
    <DashboardClient
      provider={data.provider}
      metrics={metrics}
      recentOrders={recentOrders}
      activeSlug={preferred}
      debug={debug}
      debugInfo={data.debug}
    />
  );
}
