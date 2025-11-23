"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, MessageCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { formatCurrency } from "@/lib/whatsapp";
import { listOrders, listPendingProducts, listProviders, type ListOrdersResult, type OrderListItem, type ProviderRow } from "./actions";

const statusBadge: Record<string, string> = {
  nuevo: "bg-primary/10 text-primary",
  preparando: "bg-amber-500/10 text-amber-700 dark:text-amber-200",
  enviado: "bg-blue-500/10 text-blue-700 dark:text-blue-200",
  entregado: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  cancelado: "bg-destructive/10 text-destructive",
};

export type OrdersPageProps = { initialProviderSlug?: string };

function OrdersPageContent({ initialProviderSlug }: OrdersPageProps) {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [providerSlug, setProviderSlug] = useState(initialProviderSlug ?? "");
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [productSummary, setProductSummary] = useState<{ nuevo: any[]; preparando: any[]; entregado: any[] }>({
    nuevo: [],
    preparando: [],
    entregado: [],
  });
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const lockedProvider = Boolean(initialProviderSlug);
  const preferredProvider = useMemo(() => {
    if (lockedProvider) return initialProviderSlug ?? undefined;
    return searchParams?.get("provider") ?? undefined;
  }, [initialProviderSlug, lockedProvider, searchParams]);

  const loadProviders = useCallback(async () => {
    setProvidersError(null);
    const response = await listProviders();
    if (response.success) {
      setProviders(response.providers);
      if (!providerSlug && response.providers.length > 0) {
        const foundPreferred = preferredProvider
          ? response.providers.find((provider) => provider.slug === preferredProvider)
          : undefined;
        const firstActive =
          foundPreferred ??
          response.providers.find((provider) => provider.is_active !== false) ??
          response.providers[0];
        if (firstActive?.slug) setProviderSlug(firstActive.slug);
      } else if (lockedProvider && preferredProvider) {
        setProviderSlug(preferredProvider);
      }
    } else {
      setProvidersError(response.errors.join("\n"));
    }
  }, [lockedProvider, preferredProvider, providerSlug]);

  const loadOrders = useCallback(
    async (slug: string) => {
      if (!slug) return;
      setLoadingOrders(true);
      setOrdersError(null);
      const response: ListOrdersResult = await listOrders(slug);
      if (response.success) {
        setOrders(response.orders);
      } else {
        setOrdersError(response.errors.join("\n"));
      }
      setLoadingOrders(false);
    },
    [],
  );

  const loadPendingItems = useCallback(async (slug: string) => {
    if (!slug) return;
    setLoadingItems(true);
    setItemsError(null);
    const response = await listPendingProducts(slug);
    if (response.success) {
      setProductSummary(response.items);
    } else {
      setItemsError(response.errors.join("\n"));
    }
    setLoadingItems(false);
  }, []);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    void loadOrders(providerSlug);
    void loadPendingItems(providerSlug);
  }, [loadOrders, loadPendingItems, providerSlug]);

  const provider = useMemo(() => providers.find((item) => item.slug === providerSlug), [providers, providerSlug]);

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/50 px-4 pb-12 pt-6 sm:px-8">
      <main className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button asChild variant="ghost" size="sm">
              <Link href={providerSlug ? `/app/${providerSlug}` : "/app"}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <span>/</span>
            <Badge variant="secondary">Pedidos</Badge>
          </div>
          <div className="flex items-center gap-2">
            {lockedProvider ? (
              <Badge variant="outline">{providerSlug || "Proveedor"}</Badge>
            ) : (
              <Select
                value={providerSlug}
                onValueChange={(value) => setProviderSlug(value)}
                disabled={providers.length === 0}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((item) => (
                    <SelectItem key={item.id} value={item.slug}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                void loadOrders(providerSlug);
                void loadPendingItems(providerSlug);
              }}
              disabled={loadingOrders || loadingItems}
              aria-label="Refrescar pedidos"
            >
              <RefreshCcw className={`h-4 w-4 ${(loadingOrders || loadingItems) ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Pedidos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cambia estados y comparte por WhatsApp al cliente.
              </p>
            </div>
            <div className="w-56">
              <Input placeholder="Buscar tienda (próximamente)" disabled />
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border/70 p-0">
            {providersError ? (
              <div className="px-4 py-3 text-sm text-destructive">{providersError}</div>
            ) : null}
            {ordersError ? (
              <div className="px-4 py-3 text-sm text-destructive">{ordersError}</div>
            ) : null}
            {loadingOrders ? (
              <div className="space-y-2 px-4 py-3">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                {provider ? "Aún no hay pedidos." : "Selecciona un proveedor para ver pedidos."}
              </div>
            ) : (
              orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      {order.clientName} · {formatCurrency(order.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString("es-AR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Fecha no disponible"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[order.status]}`}>
                      {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status}
                    </span>
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        href={
                          providerSlug ? `/app/orders/${order.id}?provider=${providerSlug}` : `/app/orders/${order.id}`
                        }
                      >
                        Ver detalle
                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Artículos por estado</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Suma los productos en pedidos según su estado (Nuevo, Preparado, Entregado).
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">Nuevo: {productSummary.nuevo.reduce((acc, item) => acc + item.quantity, 0)}</Badge>
              <Badge variant="outline">
                Preparado: {productSummary.preparando.reduce((acc, item) => acc + item.quantity, 0)}
              </Badge>
              <Badge variant="outline">
                Entregado: {productSummary.entregado.reduce((acc, item) => acc + item.quantity, 0)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border/70 p-0">
            {itemsError ? (
              <div className="px-4 py-3 text-sm text-destructive">{itemsError}</div>
            ) : null}
            {loadingItems ? (
              <div className="space-y-2 px-4 py-3">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 p-3"
                  >
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                ))}
              </div>
            ) : (
              ["nuevo", "preparando", "entregado"].map((state) => {
                const items =
                  state === "nuevo"
                    ? productSummary.nuevo
                    : state === "preparando"
                      ? productSummary.preparando
                      : productSummary.entregado;
                return (
                  <div key={state} className="px-4 py-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold capitalize">
                        {state === "preparando" ? "Preparado" : state}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {items.reduce((acc, item) => acc + item.quantity, 0)} uds
                      </Badge>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin artículos en este estado.</p>
                    ) : (
                      items.map((item, index) => (
                        <motion.div
                          key={`${state}-${item.productId}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-card/70 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.unit ?? "Unidad"}</p>
                          </div>
                          <Badge variant="outline" className="text-sm">
                            {item.quantity}
                          </Badge>
                        </motion.div>
                      ))
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Separator />
        <p className="text-xs text-muted-foreground">
          Nota: el botón de WhatsApp reutilizará el helper de resumen del pedido cuando se conecte a datos reales.
        </p>
      </main>
    </div>
  );
}

export default function OrdersPage(props: OrdersPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-3 px-4 py-6 sm:px-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48" />
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      }
    >
      <OrdersPageContent {...props} />
    </Suspense>
  );
}
