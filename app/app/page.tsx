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

function buildMetrics(orders: OrderSummary[]) {
  const counts = orders.reduce(
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
      })),
      ...demo.orders.map((order) => ({
        id: order.id,
        status: order.status,
        clientName: demo.clients.find((client) => client.slug === order.clientSlug)?.name ?? "Cliente demo",
        total: order.total,
        createdAt: order.createdAt,
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

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, status, created_at, client:clients(name), order_items(quantity, unit_price)")
      .eq("provider_id", provider.id)
      .order("created_at", { ascending: false })
      .limit(8);

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

    return { providers: [providerSummary], provider: providerSummary, orders: parsedOrders, debug };
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

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, status, created_at, client:clients(name), order_items(quantity, unit_price)",
    )
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false })
    .limit(8);

  if (ordersError) {
    debug.ordersError = ordersError.message;
    return { providers: providerSummaries, provider: providerSummary, orders: [], debug };
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

  return {
    providers: providerSummaries,
    provider: providerSummary,
    orders: parsedOrders,
    debug,
  };
}

export default async function AppDashboard({
  searchParams,
  providerSlug,
}: {
  searchParams?: { provider?: string; debug?: string };
  providerSlug?: string;
}) {
  const preferred = providerSlug ?? searchParams?.provider;
  const data = await fetchData(preferred);
  const debug = typeof searchParams?.debug !== "undefined";

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

  const metrics = buildMetrics(data.orders);
  const recentOrders = data.orders.slice(0, 5);

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
