"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Check, MessageCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_STATUS, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { formatCurrency } from "@/lib/whatsapp";
import {
  listOrders,
  listPendingProducts,
  listProviders,
  updateOrderStatus,
  type ListOrdersResult,
  type OrderListItem,
  type ProviderRow,
} from "./actions";

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
  const searchParams = useSearchParams();
  const providerQuery = searchParams?.get("provider") ?? null;
  const lockedProvider = Boolean(initialProviderSlug || providerQuery);
  const [providerSlug, setProviderSlug] = useState(initialProviderSlug ?? providerQuery ?? "");
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
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [openPaymentPopover, setOpenPaymentPopover] = useState<string | null>(null);
  const [searchClient, setSearchClient] = useState("");
  const paymentStatusLabel = useCallback(
    (method?: "efectivo" | "transferencia" | null, status?: "no_aplica" | "pendiente" | "subido" | null) => {
      if (method === "transferencia") {
        if (status === "subido") return "Comprobante cargado";
        if (status === "pendiente") return "Comprobante pendiente";
        return "Comprobante pendiente";
      }
      // Efectivo
      return status === "subido" ? "Efectivo recibido" : "A pagar en la entrega";
    },
    [],
  );
  const preferredProvider = useMemo(() => {
    return initialProviderSlug || providerQuery || undefined;
  }, [initialProviderSlug, providerQuery]);

  useEffect(() => {
    if (lockedProvider && preferredProvider && preferredProvider !== providerSlug) {
      setProviderSlug(preferredProvider);
    }
  }, [lockedProvider, preferredProvider, providerSlug]);

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

  const handleStatusChange = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      if (!providerSlug) return;
      setOrdersError(null);
      let previousStatus: OrderStatus | undefined;
      setOrders((prev) => {
        const found = prev.find((order) => order.id === orderId);
        previousStatus = found?.status;
        return prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order));
      });
      setUpdatingOrderId(orderId);
      const response = await updateOrderStatus({ providerSlug, orderId, status: nextStatus });
      if (!response.success && previousStatus) {
        const rollbackStatus = previousStatus;
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? { ...order, status: rollbackStatus } : order)),
        );
        setOrdersError(response.errors.join("\n"));
      }
      setUpdatingOrderId(null);
    },
    [providerSlug],
  );

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    void loadOrders(providerSlug);
    void loadPendingItems(providerSlug);
  }, [loadOrders, loadPendingItems, providerSlug]);

  const provider = useMemo(() => providers.find((item) => item.slug === providerSlug), [providers, providerSlug]);
  const orderDetailHref = useCallback(
    (orderId: string) => (providerSlug ? `/app/orders/${orderId}?provider=${providerSlug}` : `/app/orders/${orderId}`),
    [providerSlug],
  );
  const filteredOrders = useMemo(() => {
    const term = searchClient.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => order.clientName.toLowerCase().includes(term));
  }, [orders, searchClient]);
  const groupedOrders = useMemo(
    () =>
      ORDER_STATUS.map((status) => ({
        status,
        label: status === "nuevo" ? "Pedidos nuevos" : status === "preparando" ? "Pedidos preparados" : "Pedidos entregados",
        items: filteredOrders.filter((order) => order.status === status),
      })),
    [filteredOrders],
  );
  const hasOrders = orders.length > 0;
  const hasFilteredOrders = filteredOrders.length > 0;

  return (
    <div className="relative isolate w-full">
      <main className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
          <div className="flex flex-wrap items-center gap-2">
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

        <Card className="border-[color:var(--neutral-200)] bg-white shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Pedidos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cambia estados y comparte por WhatsApp al cliente.
              </p>
            </div>
            <div className="w-56">
              <Input
                placeholder="Buscar cliente"
                value={searchClient}
                onChange={(event) => setSearchClient(event.target.value)}
                aria-label="Buscar cliente"
              />
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
                    className="flex flex-col gap-3 rounded-lg border border-[color:var(--neutral-200)] bg-[color:var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : !hasOrders ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                {provider ? "Aún no hay pedidos." : "Selecciona un proveedor para ver pedidos."}
              </div>
            ) : !hasFilteredOrders ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                {searchClient.trim()
                  ? `No se encontraron clientes que coincidan con “${searchClient.trim()}”.`
                  : "Aún no hay pedidos para mostrar."}
              </div>
            ) : (
              groupedOrders.map((group, groupIndex) => (
                <div key={group.status} className="space-y-3 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{group.label}</p>
                    <Badge variant="outline" className="text-xs">
                      {group.items.length} {group.items.length === 1 ? "pedido" : "pedidos"}
                    </Badge>
                  </div>
                  {group.items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin pedidos en este estado.</p>
                  ) : (
                    group.items.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.05 + groupIndex * 0.02 }}
                        className="flex flex-col gap-3 rounded-lg border border-[color:var(--neutral-200)] bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
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
                          {order.deliveryDate ? (
                            <p className="text-xs text-muted-foreground">
                              Entrega:{" "}
                              {new Date(order.deliveryDate).toLocaleDateString("es-AR", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="secondary"
                                className={`rounded-full px-3 py-0 text-xs font-semibold capitalize ${statusBadge[order.status]}`}
                                disabled={!providerSlug || updatingOrderId === order.id}
                              >
                                {updatingOrderId === order.id ? "Actualizando..." : ORDER_STATUS_LABEL[order.status] ?? order.status}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel>Estado del pedido</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {ORDER_STATUS.map((option) => (
                                <DropdownMenuItem
                                  key={option}
                                  className="flex items-center justify-between capitalize"
                                  disabled={updatingOrderId === order.id}
                                  onClick={() => handleStatusChange(order.id, option)}
                                >
                                  <span>{ORDER_STATUS_LABEL[option]}</span>
                                  {order.status === option ? <Check className="h-4 w-4 text-primary" /> : null}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                      </DropdownMenu>
                          <Popover
                            open={openPaymentPopover === order.id}
                            onOpenChange={(open) => setOpenPaymentPopover(open ? order.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <Badge
                                variant="outline"
                                className="flex cursor-pointer items-center gap-1 text-[11px]"
                                role="button"
                                aria-label="Ver comprobante"
                              >
                                {order.paymentMethod === "transferencia" ? "Transferencia" : "Efectivo"}
                                <span className="text-[11px] text-muted-foreground">
                                  {paymentStatusLabel(order.paymentMethod ?? "efectivo", order.paymentProofStatus)}
                                </span>
                              </Badge>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-64 space-y-3">
                              <div className="space-y-1">
                                <p className="text-sm font-semibold">
                                  {order.paymentMethod === "transferencia" ? "Transferencia" : "Efectivo"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {paymentStatusLabel(order.paymentMethod ?? "efectivo", order.paymentProofStatus)}
                                </p>
                              </div>
                              {order.paymentMethod === "transferencia" ? (
                                order.paymentProofStatus === "subido" ? (
                                  <div className="space-y-2">
                                    {order.paymentProofUrl ? (
                                      <Button asChild size="sm" className="w-full">
                                        <a href={order.paymentProofUrl} target="_blank" rel="noreferrer">
                                          Ver comprobante
                                        </a>
                                      </Button>
                                    ) : (
                                      <Button size="sm" className="w-full" variant="outline" disabled>
                                        Comprobante no disponible
                                      </Button>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      Abrimos el comprobante cargado para esta orden.
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Sube el comprobante para habilitar la vista rápida.
                                  </p>
                                )
                              ) : order.paymentProofStatus === "subido" ? (
                                <p className="text-xs text-muted-foreground">Efectivo recibido.</p>
                              ) : (
                                <p className="text-xs text-muted-foreground">A pagar en la entrega.</p>
                              )}
                            </PopoverContent>
                          </Popover>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={orderDetailHref(order.id)}>
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
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-[color:var(--neutral-200)] bg-white shadow-sm backdrop-blur">
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
                    className="flex items-center justify-between rounded-lg border border-[color:var(--neutral-200)] bg-[color:var(--surface)] p-3"
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
                          className="flex items-center justify-between rounded-lg border border-[color:var(--neutral-200)] bg-white px-3 py-2"
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
