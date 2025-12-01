"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CreditCard,
  Download,
  Eye,
  LayoutList,
  MessagesSquare,
  RefreshCcw,
  Rows3,
  Truck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_STATUS, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { useProviderContext } from "@/components/app/provider-context";
import { formatCurrency } from "@/lib/whatsapp";
import {
  getOrderSnapshot,
  listOrders,
  listPendingProducts,
  listProviders,
  updateOrderStatus,
  updateDeliveryDate,
  type ListOrdersResult,
  type OrderListItem,
  type OrderDetail,
  type ProviderRow,
} from "./actions";

const statusBadge: Record<string, string> = {
  nuevo:
    "border border-[color:var(--accent-foreground)]/20 bg-[color:var(--accent)] text-[color:var(--brand-deep)]",
  preparando:
    "border border-[color:var(--warning)]/25 bg-[color:var(--warning-light)] text-[color:var(--warning)]",
  enviado:
    "border border-[color:var(--info)]/25 bg-[color:var(--info-light)] text-[color:var(--info)]",
  entregado:
    "border border-[color:var(--success)]/25 bg-[color:var(--success-light)] text-[color:var(--success)]",
  cancelado:
    "border border-[color:var(--destructive)]/25 bg-[color:var(--error-light)] text-[color:var(--destructive)]",
};

export type OrdersPageProps = { initialProviderSlug?: string };

function OrdersPageContent({ initialProviderSlug }: OrdersPageProps) {
  const { providerSlug, setProviderSlug, isLocked } = useProviderContext();
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const searchParams = useSearchParams();
  const providerQuery = searchParams?.get("provider") ?? null;
  const lockedProvider = isLocked || Boolean(initialProviderSlug || providerQuery);
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
  const [updatingDeliveryId, setUpdatingDeliveryId] = useState<string | null>(null);
  const [openDeliveryPopover, setOpenDeliveryPopover] = useState<string | null>(null);
  const [searchClient, setSearchClient] = useState("");
  const [tableView, setTableView] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [quickViewOrder, setQuickViewOrder] = useState<OrderDetail | null>(null);
  const [quickViewError, setQuickViewError] = useState<string | null>(null);
  const paymentStatusLabel = useCallback((status?: "no_aplica" | "pendiente" | "subido" | null) => {
    if (status === "subido") return { label: "Comprobante cargado", tone: "ok" as const };
    if (status === "pendiente") return { label: "Comprobante pendiente", tone: "warn" as const };
    return { label: "A pagar en la entrega", tone: "muted" as const };
  }, []);
  const preferredProvider = useMemo(() => {
    return initialProviderSlug || providerQuery || providerSlug || undefined;
  }, [initialProviderSlug, providerQuery, providerSlug]);

  useEffect(() => {
    const nextPreferred = initialProviderSlug || providerQuery;
    if (nextPreferred && nextPreferred !== providerSlug) {
      void setProviderSlug(nextPreferred, { lock: true });
    }
  }, [initialProviderSlug, providerQuery, providerSlug, setProviderSlug]);

  const formatDate = useCallback((value?: string | null, withTime = true) => {
    if (!value) return "Fecha no disponible";
    try {
      return new Date(value).toLocaleString("es-AR", {
        dateStyle: "medium",
        timeStyle: withTime ? "short" : undefined,
      });
    } catch {
      return value;
    }
  }, []);

  const openQuickView = useCallback(
    async (orderId: string) => {
      setQuickViewOpen(true);
      setQuickViewLoading(true);
      setQuickViewError(null);
      const response = await getOrderSnapshot(orderId);
      if (response.success) {
        setQuickViewOrder(response.order);
      } else {
        setQuickViewOrder(null);
        setQuickViewError(response.errors.join("\n"));
      }
      setQuickViewLoading(false);
    },
    [],
  );

  const downloadQuickViewPdf = useCallback(() => {
    if (!quickViewOrder) return;
    const order = quickViewOrder;
    const createdAt = formatDate(order.createdAt);
    const delivery = order.deliveryDate ? formatDate(order.deliveryDate, false) : "Sin fecha";
    const rows = order.items
      .map((item, index) => {
        const subtotal = item.subtotal ?? item.unitPrice * item.quantity;
        return `
          <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${index + 1}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${item.productName}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${item.quantity}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${item.unit ?? "-"}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(
              item.unitPrice ?? 0,
            )}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(
              subtotal ?? 0,
            )}</td>
          </tr>`;
      })
      .join("");

    const total = order.items.reduce((acc, item) => {
      const subtotal = item.subtotal ?? item.unitPrice * item.quantity;
      return acc + (Number.isFinite(subtotal) ? subtotal : 0);
    }, 0);

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Pedido ${order.id}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 24px; color: #111827; }
            h1 { margin: 0 0 4px; font-size: 20px; }
            .muted { color: #6b7280; font-size: 12px; margin: 0 0 8px; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
            .row { display: flex; flex-wrap: wrap; gap: 12px; }
            .pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: #f3f4f6; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { text-align: left; background: #f9fafb; font-size: 12px; color: #4b5563; padding: 8px; border-bottom: 1px solid #e5e7eb; }
            tfoot td { font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>Pedido #${order.id.slice(0, 8)}</h1>
          <p class="muted">${order.client.name} · Creado: ${createdAt} · Entrega: ${delivery}</p>
          <div class="card">
            <div class="row">
              <span class="pill">Cliente: ${order.client.name}</span>
              <span class="pill">Tel: ${order.contactPhone || "—"}</span>
              <span class="pill">Entrega: ${delivery}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Producto</th><th style="text-align:right;">Cant.</th><th style="text-align:right;">Unidad</th><th style="text-align:right;">Precio</th><th style="text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="5" style="padding:8px;text-align:right;">Total</td>
                  <td style="padding:8px;text-align:right;">${formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p class="muted">Notas: ${order.note ? order.note : "—"}</p>
          <script>window.print();</script>
        </body>
      </html>`;

    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
  }, [formatDate, quickViewOrder]);

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
        if (firstActive?.slug) void setProviderSlug(firstActive.slug);
      } else if (lockedProvider && preferredProvider) {
        void setProviderSlug(preferredProvider, { lock: true });
      }
    } else {
      setProvidersError(response.errors.join("\n"));
    }
  }, [lockedProvider, preferredProvider, providerSlug, setProviderSlug]);

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

  const handleUpdateDeliveryDate = useCallback(
    async (orderId: string, date: Date | null) => {
      if (!providerSlug) return;
      setOrdersError(null);
      setUpdatingDeliveryId(orderId);
      const payloadDate = date ? new Date(date).toISOString() : null;
      const response = await updateDeliveryDate({ providerSlug, orderId, deliveryDate: payloadDate });
      if (response.success) {
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? { ...order, deliveryDate: response.deliveryDate ?? null } : order)),
        );
      } else {
        setOrdersError(response.errors.join("\n"));
      }
      setUpdatingDeliveryId(null);
    },
    [providerSlug],
  );

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    if (!providerSlug) return;
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
  const accordionDefaults = useMemo(
    () => groupedOrders.filter((group) => group.items.length > 0).map((group) => group.status),
    [groupedOrders],
  );
  const productAccordionDefaults = useMemo(() => {
    const counts = {
      nuevo: productSummary.nuevo.length,
      preparando: productSummary.preparando.length,
      entregado: productSummary.entregado.length,
    };
    return (["nuevo", "preparando", "entregado"] as const).filter((state) => counts[state] > 0);
  }, [productSummary]);
  const productRows = useMemo(
    () => [
      ...productSummary.nuevo.map((item) => ({ ...item, state: "nuevo" as const })),
      ...productSummary.preparando.map((item) => ({ ...item, state: "preparando" as const })),
      ...productSummary.entregado.map((item) => ({ ...item, state: "entregado" as const })),
    ],
    [productSummary],
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
                onValueChange={(value) => void setProviderSlug(value)}
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
                if (!providerSlug) return;
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

        <Card className="border-border/70 bg-card/95 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.55)] backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Pedidos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cambia estados y comparte por WhatsApp al cliente.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <div className="w-full min-w-[220px] sm:w-56">
                <Input
                  placeholder="Buscar cliente"
                  value={searchClient}
                  onChange={(event) => setSearchClient(event.target.value)}
                  aria-label="Buscar cliente"
                />
              </div>
              <Button
                variant={tableView ? "default" : "outline"}
                size="sm"
                className="justify-center gap-2"
                onClick={() => setTableView((prev) => !prev)}
                aria-pressed={tableView}
              >
                {tableView ? <LayoutList className="h-4 w-4" /> : <Rows3 className="h-4 w-4" />}
                {tableView ? "Vista cards" : "Vista tabla"}
              </Button>
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
                    className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-[color:var(--muted)]/60 p-4 sm:flex-row sm:items-center sm:justify-between shadow-[var(--shadow-xs)]"
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
            ) : tableView ? (
              <div className="overflow-hidden px-2 pb-4">
                <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card/95 shadow-[var(--shadow-sm)]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[color:var(--muted)]/60 text-muted-foreground">
                        <TableHead className="uppercase tracking-[0.08em] text-[11px]">Cliente</TableHead>
                        <TableHead className="whitespace-nowrap uppercase tracking-[0.08em] text-[11px]">Estado</TableHead>
                        <TableHead className="whitespace-nowrap uppercase tracking-[0.08em] text-[11px]">Total</TableHead>
                        <TableHead className="min-w-[200px] uppercase tracking-[0.08em] text-[11px]">Pago</TableHead>
                        <TableHead className="min-w-[140px] uppercase tracking-[0.08em] text-[11px]">Entrega</TableHead>
                        <TableHead className="whitespace-nowrap text-right uppercase tracking-[0.08em] text-[11px]">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order, index) => (
                        <TableRow
                          key={order.id}
                          className="align-top transition-colors hover:bg-muted/40"
                          style={{ animationDelay: `${index * 40}ms` }}
                        >
                          <TableCell className="min-w-[180px]">
                            <div className="text-sm font-semibold">{order.clientName}</div>
                            <p className="text-xs text-muted-foreground">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleString("es-AR", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })
                                : "Fecha no disponible"}
                            </p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className={`rounded-full px-3 py-0 text-xs font-semibold capitalize ${statusBadge[order.status]}`}
                                  disabled={!providerSlug || updatingOrderId === order.id}
                                >
                                  {updatingOrderId === order.id
                                    ? "Actualizando..."
                                    : ORDER_STATUS_LABEL[order.status] ?? order.status}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-44">
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
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-semibold">
                            {formatCurrency(order.total)}
                          </TableCell>
                          <TableCell className="min-w-[200px]">
                            {(() => {
                              const paymentStatus = paymentStatusLabel(order.paymentProofStatus);
                              const paymentLabel = order.paymentMethod === "transferencia" ? "Transferencia" : "Efectivo";
                              return (
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="flex items-center gap-1 text-[11px]">
                                    {order.paymentMethod === "transferencia" ? (
                                      <CreditCard className="h-3.5 w-3.5" />
                                    ) : (
                                      <Wallet className="h-3.5 w-3.5" />
                                    )}
                                    {paymentLabel}
                                  </Badge>
                                  <Badge
                                    variant={paymentStatus.tone === "ok" ? "secondary" : "outline"}
                                    className={
                                      paymentStatus.tone === "warn"
                                        ? "border-amber-400/60 text-amber-700 dark:text-amber-200"
                                        : paymentStatus.tone === "ok"
                                          ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-200"
                                          : "text-muted-foreground"
                                    }
                                  >
                                    {paymentStatus.label}
                                  </Badge>
                                  {order.paymentMethod === "transferencia" && order.paymentProofUrl ? (
                                    <Button asChild size="sm" variant="ghost" className="px-2 text-xs">
                                      <a href={order.paymentProofUrl} target="_blank" rel="noreferrer">
                                        Comprobante
                                      </a>
                                    </Button>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="min-w-[140px]">
                            <Popover open={openDeliveryPopover === order.id} onOpenChange={(open) => setOpenDeliveryPopover(open ? order.id : null)}>
                              <PopoverTrigger asChild>
                                <Badge
                                  variant="secondary"
                                  className="flex cursor-pointer items-center gap-1 text-[11px]"
                                  title="Reprogramar entrega"
                                >
                                  <Truck className="h-3.5 w-3.5" />
                                  {order.deliveryDate
                                    ? new Date(order.deliveryDate).toLocaleDateString("es-AR", {
                                        weekday: "short",
                                        day: "numeric",
                                        month: "short",
                                      })
                                    : "Sin fecha"}
                                  {order.deliveryZoneName ? ` · Zona ${order.deliveryZoneName}` : ""}
                                </Badge>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-3" align="start">
                                <Calendar
                                  mode="single"
                                  selected={order.deliveryDate ? new Date(order.deliveryDate) : undefined}
                                  onSelect={(date) => {
                                    setOpenDeliveryPopover(null);
                                    void handleUpdateDeliveryDate(order.id, date ?? null);
                                  }}
                                  initialFocus
                                />
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setOpenDeliveryPopover(null);
                                      void handleUpdateDeliveryDate(order.id, null);
                                    }}
                                    disabled={updatingDeliveryId === order.id}
                                  >
                                    {updatingDeliveryId === order.id ? "Guardando..." : "Limpiar"}
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setOpenDeliveryPopover(null)}
                                    disabled={updatingDeliveryId === order.id}
                                  >
                                    {updatingDeliveryId === order.id ? "Guardando..." : "Listo"}
                                  </Button>
                                </div>
                              </PopoverContent>
                          </Popover>
                        </TableCell>
                          <TableCell className="space-y-1 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => void openQuickView(order.id)}
                                disabled={quickViewLoading}
                                title="Ver pedido"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                title="Ver detalle"
                              >
                                <Link href={orderDetailHref(order.id)}>
                                  <ArrowUpRight className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                title="WhatsApp"
                              >
                                <MessagesSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <Accordion
                type="multiple"
                defaultValue={accordionDefaults}
                className="divide-y divide-border/70 px-2"
              >
                {groupedOrders.map((group, groupIndex) => (
                  <AccordionItem
                    key={group.status}
                    value={group.status}
                    className="border-0 px-2 py-1 [--trigger-height:44px]"
                  >
                    <AccordionTrigger className="rounded-xl px-2 text-sm font-semibold hover:no-underline">
                      <div className="flex w-full items-center justify-between">
                        <span>{group.label}</span>
                        <Badge variant="outline" className="text-[11px]">
                          {group.items.length} {group.items.length === 1 ? "pedido" : "pedidos"}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      {group.items.length === 0 ? (
                        <p className="px-1 text-xs text-muted-foreground">Sin pedidos en este estado.</p>
                      ) : (
                        <div className="space-y-3">
                          {group.items.map((order, index) => (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: index * 0.05 + groupIndex * 0.02 }}
                              className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/95 px-3 py-3 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between"
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
                                <div className="flex flex-wrap items-center gap-2">
                                  <Popover open={openDeliveryPopover === order.id} onOpenChange={(open) => setOpenDeliveryPopover(open ? order.id : null)}>
                                    <PopoverTrigger asChild>
                                      <Badge
                                        variant="secondary"
                                        className="flex cursor-pointer items-center gap-1 text-[11px]"
                                        title="Reprogramar entrega"
                                      >
                                        <Truck className="h-3.5 w-3.5" />
                                        {order.deliveryDate
                                          ? new Date(order.deliveryDate).toLocaleDateString("es-AR", {
                                              weekday: "short",
                                              day: "numeric",
                                              month: "short",
                                            })
                                          : "Sin fecha"}
                                        {order.deliveryZoneName ? ` · Zona ${order.deliveryZoneName}` : ""}
                                      </Badge>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-3" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={order.deliveryDate ? new Date(order.deliveryDate) : undefined}
                                        onSelect={(date) => {
                                          setOpenDeliveryPopover(null);
                                          void handleUpdateDeliveryDate(order.id, date ?? null);
                                        }}
                                        initialFocus
                                      />
                                      <div className="mt-2 flex items-center justify-between gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setOpenDeliveryPopover(null);
                                            void handleUpdateDeliveryDate(order.id, null);
                                          }}
                                          disabled={updatingDeliveryId === order.id}
                                        >
                                          {updatingDeliveryId === order.id ? "Guardando..." : "Limpiar"}
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => setOpenDeliveryPopover(null)}
                                          disabled={updatingDeliveryId === order.id}
                                        >
                                          {updatingDeliveryId === order.id ? "Guardando..." : "Listo"}
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
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
                                      {updatingOrderId === order.id
                                        ? "Actualizando..."
                                        : ORDER_STATUS_LABEL[order.status] ?? order.status}
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
                                {(() => {
                                  const paymentStatus = paymentStatusLabel(order.paymentProofStatus);
                                  const paymentLabel = order.paymentMethod === "transferencia" ? "Transferencia" : "Efectivo";
                                  return (
                                    <>
                                      <Badge variant="outline" className="flex items-center gap-1 text-[11px]">
                                        {order.paymentMethod === "transferencia" ? (
                                          <CreditCard className="h-3.5 w-3.5" />
                                        ) : (
                                          <Wallet className="h-3.5 w-3.5" />
                                        )}
                                        {paymentLabel}
                                      </Badge>
                                      <Badge
                                        variant={paymentStatus.tone === "ok" ? "secondary" : "outline"}
                                        className={
                                          paymentStatus.tone === "warn"
                                            ? "border-amber-400/60 text-amber-700 dark:text-amber-200"
                                            : paymentStatus.tone === "ok"
                                              ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-200"
                                              : "text-muted-foreground"
                                        }
                                      >
                                        {paymentStatus.label}
                                      </Badge>
                                      {order.paymentMethod === "transferencia" && order.paymentProofUrl ? (
                                        <Button asChild size="sm" variant="ghost" className="text-xs">
                                          <a href={order.paymentProofUrl} target="_blank" rel="noreferrer">
                                            Ver comprobante
                                          </a>
                                        </Button>
                                      ) : null}
                                    </>
                                  );
                                })()}
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => void openQuickView(order.id)}
                              disabled={quickViewLoading}
                              title="Ver pedido"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button asChild variant="ghost" size="icon" title="Ver detalle">
                              <Link href={orderDetailHref(order.id)}>
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="icon" title="WhatsApp">
                              <MessagesSquare className="h-4 w-4" />
                            </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 shadow-[0_18px_48px_-28px_rgba(0,0,0,0.55)] backdrop-blur-sm">
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
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-[color:var(--muted)]/60 p-3 shadow-[var(--shadow-xs)]"
                  >
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                ))}
              </div>
            ) : tableView ? (
              <div className="overflow-hidden px-2 pb-4">
                <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card/95 shadow-[var(--shadow-sm)]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[color:var(--muted)]/60 text-muted-foreground">
                        <TableHead className="uppercase tracking-[0.08em] text-[11px]">Estado</TableHead>
                        <TableHead className="uppercase tracking-[0.08em] text-[11px]">Producto</TableHead>
                        <TableHead className="whitespace-nowrap uppercase tracking-[0.08em] text-[11px]">Unidad</TableHead>
                        <TableHead className="whitespace-nowrap text-right uppercase tracking-[0.08em] text-[11px]">
                          Cantidad
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                            Aún no hay artículos por mostrar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        productRows.map((item) => (
                          <TableRow key={`${item.state}-${item.productId}`} className="transition-colors hover:bg-muted/40">
                            <TableCell className="capitalize text-sm font-semibold">
                              {item.state === "preparando" ? "Preparado" : item.state === "nuevo" ? "Nuevo" : "Entregado"}
                            </TableCell>
                            <TableCell className="text-sm font-semibold">{item.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{item.unit ?? "Unidad"}</TableCell>
                            <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <Accordion type="multiple" defaultValue={productAccordionDefaults} className="divide-y divide-border/70 px-2">
                {(["nuevo", "preparando", "entregado"] as const).map((state) => {
                  const items =
                    state === "nuevo"
                      ? productSummary.nuevo
                      : state === "preparando"
                        ? productSummary.preparando
                        : productSummary.entregado;
                  const label = state === "preparando" ? "Preparado" : state === "nuevo" ? "Nuevo" : "Entregado";
                  return (
                    <AccordionItem key={state} value={state} className="border-0 px-2 py-1 [--trigger-height:44px]">
                    <AccordionTrigger className="rounded-xl px-2 text-sm font-semibold capitalize hover:no-underline">
                        <div className="flex w-full items-center justify-between">
                          <span>{label}</span>
                          <Badge variant="secondary" className="text-[11px]">
                            {items.reduce((acc, item) => acc + item.quantity, 0)} uds
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2">
                        {items.length === 0 ? (
                          <p className="px-1 text-xs text-muted-foreground">Sin artículos en este estado.</p>
                        ) : (
                          <div className="space-y-2">
                            {items.map((item, index) => (
                              <motion.div
                                key={`${state}-${item.productId}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/95 px-3 py-2 shadow-[var(--shadow-sm)]"
                              >
                                <div>
                                  <p className="text-sm font-semibold">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">{item.unit ?? "Unidad"}</p>
                                </div>
                                <Badge variant="outline" className="text-sm">
                                  {item.quantity}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <Separator />
        <p className="text-xs text-muted-foreground">
          Nota: el botón de WhatsApp reutilizará el helper de resumen del pedido cuando se conecte a datos reales.
        </p>
      </main>

      <Dialog
        open={quickViewOpen}
        onOpenChange={(open) => {
          setQuickViewOpen(open);
          if (!open) {
            setQuickViewOrder(null);
            setQuickViewError(null);
            setQuickViewLoading(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vista rápida del pedido</DialogTitle>
            <DialogDescription>Revisa los ítems y descarga un PDF listo para imprimir.</DialogDescription>
          </DialogHeader>
          {quickViewError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {quickViewError}
            </div>
          ) : null}
          {quickViewLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : quickViewOrder ? (
            <ScrollArea className="max-h-[70vh] pr-2">
              <div className="space-y-4 rounded-2xl bg-[color:var(--muted)]/60 p-1">
                <div className="rounded-2xl border border-border/60 bg-card/95 p-4 shadow-[var(--shadow-sm)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="text-base font-semibold">{quickViewOrder.client.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Pedido</p>
                      <p className="text-base font-semibold">#{quickViewOrder.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Creado</p>
                      <p className="text-sm font-semibold text-foreground">{formatDate(quickViewOrder.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Entrega</p>
                      <p className="text-sm font-semibold text-foreground">
                        {quickViewOrder.deliveryDate ? formatDate(quickViewOrder.deliveryDate, false) : "Sin fecha"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Contacto</p>
                      <p className="text-sm font-semibold text-foreground">
                        {quickViewOrder.contactPhone || quickViewOrder.contactName || "Sin contacto"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/95 p-3 shadow-[var(--shadow-sm)]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Artículos</p>
                    <Badge variant="secondary">{quickViewOrder.items.length} items</Badge>
                  </div>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-border/60">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">Producto</th>
                          <th className="px-2 py-2 text-right font-medium">Cant.</th>
                          <th className="px-2 py-2 text-right font-medium">Unidad</th>
                          <th className="px-2 py-2 text-right font-medium">Precio</th>
                          <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/40">
                        {quickViewOrder.items.map((item) => (
                          <tr key={item.orderItemId || item.productId}>
                            <td className="px-3 py-2 font-medium text-foreground">{item.productName}</td>
                            <td className="px-2 py-2 text-right">{item.quantity}</td>
                            <td className="px-2 py-2 text-right text-muted-foreground">{item.unit || "—"}</td>
                            <td className="px-2 py-2 text-right text-muted-foreground">
                              {formatCurrency(item.unitPrice ?? 0)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">
                              {formatCurrency(item.subtotal ?? item.unitPrice * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-base font-semibold">
                      {formatCurrency(
                        quickViewOrder.items.reduce((acc, item) => {
                          const subtotal = item.subtotal ?? item.unitPrice * item.quantity;
                          return acc + (Number.isFinite(subtotal) ? subtotal : 0);
                        }, 0),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : null}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={() => setQuickViewOpen(false)}>
              Cerrar
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={downloadQuickViewPdf} disabled={!quickViewOrder}>
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
