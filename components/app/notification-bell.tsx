"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Bell, Inbox, Loader2, RefreshCw, ShoppingBag, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";
import { useProviderContext } from "./provider-context";

type NotificationItem = {
  id: string;
  orderId?: string;
  type: "order" | "payment_proof" | "order_status";
  createdAt?: string | null;
  clientName?: string | null;
  status?: string | null;
};

function formatTime(value?: string | null) {
  if (!value) return "Hace un momento";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Hace un momento";
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABELS: Record<string, string> = {
  nuevo: "nuevo",
  preparando: "en preparación",
  enviado: "enviado",
  entregado: "entregado",
  cancelado: "cancelado",
};

function eventLabel(item: NotificationItem) {
  if (item.type === "order_status") {
    const label = item.status ? STATUS_LABELS[item.status] ?? item.status : null;
    return label ? `Pedido ${label}` : "Pedido actualizado";
  }
  if (item.type === "payment_proof") return "Comprobante recibido";
  return "Nuevo pedido";
}

export function NotificationBell() {
  const { providerSlug, providerId } = useProviderContext();
  const [events, setEvents] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [clientMap, setClientMap] = useState<Record<string, { name?: string | null }>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const menuOpenRef = useRef<boolean>(false);

  const ordersHref = useMemo(
    () => (providerSlug ? `/app/orders?provider=${providerSlug}` : "/app/orders"),
    [providerSlug],
  );

  const detailHref = useCallback(
    (orderId?: string) => {
      if (!orderId) return ordersHref;
      return providerSlug ? `/app/orders/${orderId}?provider=${providerSlug}` : `/app/orders/${orderId}`;
    },
    [ordersHref, providerSlug],
  );

  const pushEvent = useCallback((item: NotificationItem) => {
    const dedupKey = item.id;
    setEvents((prev) => {
      if (prev.some((event) => event.id === dedupKey)) return prev;
      return [item, ...prev].slice(0, 8);
    });
    if (!menuOpenRef.current) setHasUnread(true);
  }, []);

  const handleOrderInsert = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
      if (process.env.NODE_ENV === "development") {
        console.info("[Bell] Pedido nuevo recibido", payload);
      }
      const next = payload.new ?? {};
      const orderId = (next.id as string | undefined) ?? `order-${Date.now()}`;
      const clientId = (next.client_id as string | undefined) ?? undefined;
      const clientName = clientId ? clientMap[clientId]?.name ?? null : null;
      pushEvent({
        id: `order-${orderId}`,
        orderId,
        type: "order",
        createdAt: (next.created_at as string | undefined) ?? new Date().toISOString(),
        clientName,
      });
    },
    [clientMap, pushEvent],
  );

  const handleProofUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
      if (process.env.NODE_ENV === "development") {
        console.info("[Bell] Cambio de comprobante", payload);
      }
      const next = payload.new ?? {};
      const prev = payload.old ?? {};
      const statusNow = (next.payment_proof_status as string | undefined) ?? null;
      const statusPrev = (prev.payment_proof_status as string | undefined) ?? null;

      if (statusNow !== "subido" || statusPrev === "subido") return;

      const orderId = (next.id as string | undefined) ?? `order-${Date.now()}`;
      const clientId = (next.client_id as string | undefined) ?? undefined;
      const clientName = clientId ? clientMap[clientId]?.name ?? null : null;
      pushEvent({
        id: `proof-${orderId}`,
        orderId,
        type: "payment_proof",
        createdAt: (next.updated_at as string | undefined) ?? new Date().toISOString(),
        clientName,
      });
    },
    [clientMap, pushEvent],
  );

  const handleOrderStatusUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
      const next = payload.new ?? {};
      const prev = payload.old ?? {};
      const statusNow = (next.status as string | undefined) ?? null;
      const statusPrev = (prev.status as string | undefined) ?? null;
      if (!statusNow || statusNow === statusPrev) return;

      const orderId = (next.id as string | undefined) ?? `order-${Date.now()}`;
      const clientId = (next.client_id as string | undefined) ?? undefined;
      const clientName = clientId ? clientMap[clientId]?.name ?? null : null;
      pushEvent({
        id: `order-status-${orderId}-${statusNow}`,
        orderId,
        status: statusNow,
        type: "order_status",
        createdAt: (next.updated_at as string | undefined) ?? new Date().toISOString(),
        clientName,
      });
    },
    [clientMap, pushEvent],
  );

  const hydrateRecent = useCallback(async () => {
    if (!providerSlug) return;
    setHydrating(true);
    setConnectionError(null);
    try {
      const params = new URLSearchParams();
      params.set("providerSlug", providerSlug);
      if (providerId) params.set("providerId", providerId);
      const res = await fetch(`/api/notifications?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        const message = (await res.json().catch(() => null))?.error ?? "No pudimos cargar alertas recientes.";
        setConnectionError(message);
        setHydrating(false);
        return;
      }
      const data = (await res.json()) as { events?: NotificationItem[] };
      const items = Array.isArray(data.events) ? data.events : [];
      if (items.length > 0) {
        const deduped: NotificationItem[] = [];
        const seen = new Set<string>();
        items
          .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
          .forEach((item) => {
            if (!item.id || seen.has(item.id)) return;
            seen.add(item.id);
            deduped.push(item);
          });
        setEvents((prev) => {
          const prevIds = new Set(prev.map((e) => e.id));
          const fresh = deduped.filter((i) => !prevIds.has(i.id));
          const merged = [...fresh, ...prev];
          if (fresh.length > 0 && !menuOpenRef.current) {
            setHasUnread(true);
          }
          return merged.slice(0, 6);
        });
      }
    } catch (error) {
      console.warn("No pudimos hidratar notificaciones", error);
      setConnectionError("No pudimos cargar alertas recientes.");
    } finally {
      setHydrating(false);
    }
  }, [providerId, providerSlug]);

  useEffect(() => {
    const fetchClients = async () => {
      if (!providerId && providerSlug !== "demo") return;
      try {
        const supabase = getSupabaseBrowser();
        const query =
          providerSlug === "demo"
            ? supabase.from("clients").select("id,name").eq("provider_slug", providerSlug)
            : supabase.from("clients").select("id,name").eq("provider_id", providerId);
        const { data, error } = await query;
        if (error || !data) return;
        const next: Record<string, { name?: string | null }> = {};
        data.forEach((row) => {
          if (row.id) next[row.id] = { name: row.name ?? null };
        });
        setClientMap(next);
      } catch {
        // ignore
      }
    };
    void fetchClients();
  }, [providerId, providerSlug]);

  useEffect(() => {
    if (!providerSlug) return undefined;
    if (providerSlug !== "demo" && !providerId) {
      setConnectionError("Selecciona un proveedor para activar las alertas.");
      return undefined;
    }

    const isDemo = providerSlug === "demo";
    const filter = isDemo
      ? `provider_slug=eq.${providerSlug}`
      : providerId
        ? `provider_id=eq.${providerId}`
        : undefined;

    const supabase = getSupabaseBrowser();
    const table = isDemo ? "demo_orders" : "orders";
    const channelName = `notifications-${table}-${providerSlug}`;
    const insertConfig = filter
      ? { event: "INSERT", schema: "public", table, filter }
      : { event: "INSERT", schema: "public", table };
    const updateConfig = filter
      ? { event: "UPDATE", schema: "public", table, filter }
      : { event: "UPDATE", schema: "public", table };

    // Limpia el canal anterior antes de crear uno nuevo.
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch {
        // ignore
      }
      channelRef.current = null;
    }

    setConnecting(true);
    setConnectionError(null);

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", insertConfig, handleOrderInsert)
      .on("postgres_changes", updateConfig, handleProofUpdate)
      .on("postgres_changes", updateConfig, handleOrderStatusUpdate)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnecting(false);
          if (process.env.NODE_ENV === "development") {
            console.info("[Bell] Suscrito a realtime", channelName, insertConfig, updateConfig);
          }
        }
        if (status === "CHANNEL_ERROR") {
          setConnecting(false);
          setConnectionError("No pudimos activar las alertas en vivo.");
        }
      });

    channelRef.current = channel;

    return () => {
      setConnecting(false);
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
      channelRef.current = null;
    };
  }, [handleOrderInsert, handleOrderStatusUpdate, handleProofUpdate, providerId, providerSlug]);

  useEffect(() => {
    if (!providerSlug) return;
    void hydrateRecent();
  }, [hydrateRecent, providerSlug]);

  useEffect(() => {
    if (!providerSlug) return undefined;
    const interval = window.setInterval(() => {
      if (!hydrating && !connecting) {
        void hydrateRecent();
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [connecting, hydrateRecent, hydrating, providerSlug]);

  useEffect(() => {
    if (menuOpenRef.current && events.length === 0 && !hydrating) {
      void hydrateRecent();
    }
  }, [events.length, hydrateRecent, hydrating]);

  const disabled = !providerSlug;

  return (
    <DropdownMenu
      open={menuOpen}
      onOpenChange={(open) => {
        menuOpenRef.current = open;
        setMenuOpen(open);
        if (open) {
          setHasUnread(false);
          if (events.length === 0 && !hydrating) {
            void hydrateRecent();
          }
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notificaciones"
          className={cn("relative", disabled || !providerSlug ? "opacity-60" : "")}
          disabled={disabled}
        >
          <Bell className="h-4 w-4 text-[color:var(--muted-foreground)]" />
          <AnimatePresence>
            {hasUnread ? (
              <motion.span
                key="bell-dot"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0.9, 1, 1.12, 1], opacity: [0.8, 1, 0.7, 1] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 1.4, repeat: Infinity, repeatType: "mirror" }}
                className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[color:var(--error)] shadow-[0_0_0_8px_rgba(214,69,69,0.15)]"
              />
            ) : null}
          </AnimatePresence>
          {connecting ? (
            <motion.span
              className="absolute inset-0 rounded-full border border-[color:var(--muted-foreground)]/30"
              initial={{ opacity: 0.3, scale: 0.9 }}
              animate={{ opacity: [0.6, 0.2, 0.6], scale: [0.9, 1.05, 0.9] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 overflow-visible p-0">
        <div className="flex flex-col">
          <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-semibold">Notificaciones en vivo</span>
            {connecting || hydrating ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-0" />
          {connectionError ? (
            <div className="px-3 py-2 text-xs text-destructive">{connectionError}</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <ScrollArea className="max-h-80">
                {events.length === 0 ? (
                  <div className="flex items-center gap-3 px-3 py-4 text-sm text-muted-foreground">
                    <Inbox className="h-4 w-4" />
                    <span>Acá verás nuevos pedidos y comprobantes.</span>
                  </div>
                ) : (
                  events.map((item) => (
                    <DropdownMenuItem key={item.id} asChild className="focus:bg-accent/40">
                      <Link href={detailHref(item.orderId ?? undefined)} className="flex items-start gap-3 px-2 py-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full border",
                            item.type === "order"
                              ? "border-[color:var(--accent)]/50 bg-[color:var(--accent)]/20 text-[color:var(--brand-deep)]"
                              : item.type === "payment_proof"
                                ? "border-[color:var(--info)]/40 bg-[color:var(--info-light)] text-[color:var(--info)]"
                                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100",
                          )}
                        >
                          {item.type === "order" ? (
                            <ShoppingBag className="h-4 w-4" />
                          ) : item.type === "payment_proof" ? (
                            <UploadCloud className="h-4 w-4" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-0.5">
                          <p className="text-sm font-medium leading-tight">
                            {item.clientName ? `${eventLabel(item)} de ${item.clientName}` : eventLabel(item)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.orderId
                              ? `Pedido #${item.orderId.slice(0, 8)}${
                                  item.status ? ` · ${STATUS_LABELS[item.status] ?? item.status}` : ""
                                }`
                              : "Revisa el panel de pedidos"}
                          </p>
                          <span className="text-[11px] text-muted-foreground">{formatTime(item.createdAt)}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </div>
          )}
          <DropdownMenuSeparator className="my-0" />
          <div className="px-3 pb-3 pt-2">
            <Link
              href={ordersHref}
              className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/60 hover:bg-accent/50"
            >
              <span>Ir a pedidos</span>
              <span className="text-[11px] text-muted-foreground">Panel completo</span>
            </Link>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
