export const dynamic = "force-dynamic";
export const revalidate = 0;

import { ArrowUpRight } from "lucide-react";
import { DashboardClient, type OrderSummary, type ProviderSummary } from "@/app/app/dashboard-client";
import { getDemoData } from "@/lib/demo-data";
import { fetchRecentDemoOrders } from "@/lib/demo-orders";

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

export default async function DemoPanelPage() {
  const demo = getDemoData();
  const storedOrders = await fetchRecentDemoOrders({ providerSlug: demo.provider.slug });
  const provider: ProviderSummary = {
    id: demo.provider.id,
    name: demo.provider.name,
    slug: demo.provider.slug,
    subscriptionStatus: "active",
    subscribedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    renewsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const orders: OrderSummary[] = [
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

  const metrics = buildMetrics(orders);
  const recentOrders = orders.slice(0, 5);
  const quickActions = [
    {
      label: "Pedidos demo",
      href: "#pedidos",
      icon: <ArrowUpRight className="h-4 w-4" />,
    },
    {
      label: "Links públicos",
      href: "/demo",
      icon: <ArrowUpRight className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardClient
      provider={provider}
      metrics={metrics}
      recentOrders={recentOrders}
      activeSlug={demo.provider.slug}
      basePathOverride="/demo/panel"
      ordersHrefOverride="#pedidos"
      orderDetailHrefOverride="#pedidos"
      quickActionsOverride={quickActions}
      debugInfo={{ demo: true, ordersLoaded: orders.length, resolvedProvider: provider }}
    />
  );
}
