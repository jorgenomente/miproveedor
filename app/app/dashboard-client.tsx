"use client";

import React, { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CreditCard, Phone, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
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
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/whatsapp";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";

type Metric = { label: string; value: string; trend?: string };

export type ProviderSummary = {
  id: string;
  name: string;
  slug: string;
  subscriptionStatus?: "active" | "paused" | "canceled" | null;
  subscribedAt?: string | null;
  renewsAt?: string | null;
};

export type OrderSummary = {
  id: string;
  clientName: string;
  status: string;
  total: number;
  createdAt?: string | null;
  deliveryDate?: string | null;
  deliveryZoneName?: string | null;
  paymentMethod?: "efectivo" | "transferencia" | null;
  contactPhone?: string | null;
  paymentProofStatus?: "no_aplica" | "pendiente" | "subido" | null;
};

const statusBadge: Record<string, string> = {
  nuevo: "bg-[color:var(--info-light)] text-[color:var(--brand-deep)]",
  preparando: "bg-[color:var(--warning-light)] text-[color:var(--warning)]",
  enviado: "bg-[color:var(--info-light)] text-[color:var(--brand-deep)]",
  entregado: "bg-[color:var(--success-light)] text-[color:var(--success)]",
  cancelado: "bg-[color:var(--error-light)] text-[color:var(--error)]",
};

type Props = {
  provider?: ProviderSummary | null;
  metrics: Metric[];
  recentOrders: OrderSummary[];
  activeSlug?: string;
  debug?: boolean;
  debugInfo?: DashboardDebugInfo;
  basePathOverride?: string;
  ordersHrefOverride?: string;
  orderDetailHrefOverride?: string;
};

export type DashboardDebugInfo = {
  preferredSlug?: string | null;
  resolvedProvider?: ProviderSummary | null;
  scopeRole?: string;
  scopeProviderSlug?: string;
  providersCount?: number;
  ordersLoaded?: number;
  ordersError?: string;
  scopeError?: string;
  error?: string;
  demo?: boolean;
};

export function DashboardClient({
  provider,
  metrics,
  recentOrders,
  activeSlug,
  debug,
  debugInfo,
  basePathOverride,
  ordersHrefOverride,
  orderDetailHrefOverride,
}: Props) {
  const router = useRouter();
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [lastIncomingTs, setLastIncomingTs] = useState<number | null>(null);
  const [toneId, setToneId] = useState<"bright" | "soft" | "pop">("bright");
  const [liveMetrics, setLiveMetrics] = useState<Metric[]>(metrics);
  const latestOrderRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef(true);
  const prevNewCountRef = useRef<number | null>(null);
  const lastAlarmRef = useRef<number>(0);
  const [, startTransition] = useTransition();
  const audioRef = useRef<AudioContext | null>(null);
  const providerSlug = provider?.slug ?? activeSlug;
  const basePath = basePathOverride ?? (providerSlug ? `/app/${providerSlug}` : "/app");
  const orderDetailHref = (orderId: string) =>
    orderDetailHrefOverride
      ? orderDetailHrefOverride
      : providerSlug
        ? `/app/orders/${orderId}?provider=${providerSlug}`
        : `/app/orders/${orderId}`;
  const formattedDate = (value?: string | null) => {
    if (!value) return "No definido";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No definido";
    return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(date);
  };
  const subscriptionBadge =
    provider?.subscriptionStatus === "paused"
      ? { label: "Suscripción pausada", variant: "outline" as const }
      : provider?.subscriptionStatus === "canceled"
        ? { label: "Suscripción cancelada", variant: "destructive" as const }
        : { label: "Suscripción activa", variant: "secondary" as const };
  const ordersHref =
    ordersHrefOverride ??
    (providerSlug ? `${basePath}/orders?provider=${providerSlug}` : `${basePath}/orders`);

  const paymentStateFor = useCallback(
    (order: OrderSummary) => {
      if (order.paymentMethod === "transferencia") {
        if (order.paymentProofStatus === "subido") return { label: "Comprobante cargado", tone: "success" as const };
        if (order.paymentProofStatus === "pendiente") return { label: "Comprobante pendiente", tone: "warn" as const };
        return { label: "Comprobante no aplica", tone: "muted" as const };
      }
      if (order.paymentMethod === "efectivo") {
        if (order.status === "entregado") return { label: "Efectivo recibido", tone: "success" as const };
        return { label: "Pendiente por cobrar", tone: "warn" as const };
      }
      return { label: "Pago no especificado", tone: "muted" as const };
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("miproveedor:orderAlarmEnabled");
    if (stored === "false") setAlarmEnabled(false);
    const storedTone = localStorage.getItem("miproveedor:orderAlarmTone");
    if (storedTone === "soft" || storedTone === "pop" || storedTone === "bright") {
      setToneId(storedTone);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("miproveedor:orderAlarmEnabled", alarmEnabled ? "true" : "false");
  }, [alarmEnabled]);

  useEffect(() => {
    setLiveMetrics(metrics);
  }, [metrics]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("miproveedor:orderAlarmTone", toneId);
  }, [toneId]);

  useEffect(() => {
    if (!recentOrders || recentOrders.length === 0) return;
    const latestId = recentOrders[0]?.id;
    if (!latestId) return;

    if (isFirstRenderRef.current) {
      latestOrderRef.current = latestId;
      isFirstRenderRef.current = false;
      return;
    }

    if (latestOrderRef.current && latestOrderRef.current !== latestId) {
      latestOrderRef.current = latestId;
    } else {
      latestOrderRef.current = latestId;
    }
  }, [recentOrders]);

  const playChime = useCallback(
    async (tone: "bright" | "soft" | "pop" = toneId) => {
      if (typeof window === "undefined") return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioRef.current) {
          audioRef.current = new AudioCtx();
        }
        const ctx = audioRef.current;
        if (ctx.state === "suspended") {
          await ctx.resume().catch(() => {});
        }
        const seq =
          tone === "soft"
            ? [
                { freq: 660, duration: 0.2, gain: 0.18 },
                { freq: 520, duration: 0.18, gain: 0.14 },
              ]
            : tone === "pop"
              ? [
                  { freq: 1040, duration: 0.08, gain: 0.2 },
                  { freq: 780, duration: 0.08, gain: 0.18 },
                ]
              : [
                  { freq: 880, duration: 0.16, gain: 0.24 },
                  { freq: 1320, duration: 0.12, gain: 0.2 },
                ];

        let startAt = ctx.currentTime;
        seq.forEach((step) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = step.freq;
          gain.gain.setValueAtTime(0.0001, startAt);
          gain.gain.exponentialRampToValueAtTime(step.gain, startAt + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startAt + step.duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startAt);
          osc.stop(startAt + step.duration + 0.05);
          startAt += step.duration * 0.9;
        });
      } catch (error) {
        console.warn("No se pudo reproducir alarma", error);
      }
    },
    [toneId],
  );

  const triggerAlarm = useCallback(() => {
    const now = Date.now();
    if (now - lastAlarmRef.current < 1200) return;
    setLastIncomingTs(now);
    if (alarmEnabled) {
      void playChime(toneId);
    }
    lastAlarmRef.current = now;
  }, [alarmEnabled, playChime, toneId]);

  useEffect(() => {
    const metricNew = liveMetrics.find((metric) => metric.label.toLowerCase().includes("pedidos nuevos"));
    const currentCount = metricNew ? Number(metricNew.value ?? 0) : null;
    if (currentCount === null || Number.isNaN(currentCount)) return;
    if (prevNewCountRef.current === null) {
      prevNewCountRef.current = currentCount;
      return;
    }
    if (currentCount > prevNewCountRef.current) {
      triggerAlarm();
    }
    prevNewCountRef.current = currentCount;
  }, [liveMetrics, triggerAlarm]);

  useEffect(() => {
    if (!providerSlug) return;
    let channel: RealtimeChannel | null = null;
    try {
      const supabase = getSupabaseBrowser();
      const isDemo = providerSlug === "demo";
      const table = isDemo ? "demo_orders" : "orders";
      const filter = isDemo
        ? `provider_slug=eq.${providerSlug}`
        : provider?.id
          ? `provider_id=eq.${provider.id}`
          : undefined;

      channel = supabase
        .channel(`realtime-orders-${providerSlug}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table, filter },
          () => {
            setLiveMetrics((prev) =>
              prev.map((metric) =>
                metric.label.toLowerCase().includes("pedidos nuevos")
                  ? { ...metric, value: String(Number(metric.value ?? 0) + 1) }
                  : metric,
              ),
            );
            startTransition(() => {
              router.refresh();
            });
          },
        )
        .subscribe();
    } catch (error) {
      console.warn("No se pudo iniciar realtime de pedidos", error);
    }

    return () => {
      if (channel) {
        try {
          getSupabaseBrowser().removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, [providerSlug, provider?.id, router, startTransition]);

  useEffect(() => {
    const isDemo = providerSlug === "demo";
    if (!providerSlug) return;

    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, isDemo ? 10000 : 15000);
    return () => clearInterval(interval);
  }, [providerSlug, router]);

  return (
    <div className="w-full">
      <main className="flex w-full flex-col gap-6">
        <header className="flex flex-col gap-3 rounded-lg border border-[color:var(--neutral-200)] bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm text-[color:var(--neutral-500)]">
              MiProveedor {provider ? `· ${provider.slug}` : ""}
            </p>
            <h1 className="text-2xl font-semibold text-[color:var(--neutral-900)] md:text-3xl">
              Panel de control
            </h1>

            {provider ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--neutral-500)]">
                <Badge variant={subscriptionBadge.variant}>{subscriptionBadge.label}</Badge>
                <span>Suscripto desde: {formattedDate(provider.subscribedAt)}</span>
                <span>Renueva el: {formattedDate(provider.renewsAt)}</span>
              </div>
            ) : null}
          </div>
        </header>

        {debug ? (
          <Card className="border-primary/50 bg-primary/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Debug dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div>preferredSlug: {debugInfo?.preferredSlug || "—"}</div>
              <div>resolvedProvider: {debugInfo?.resolvedProvider?.slug || "—"}</div>
              <div>scopeRole: {debugInfo?.scopeRole || "—"}</div>
              <div>scopeProviderSlug: {debugInfo?.scopeProviderSlug || "—"}</div>
              <div>providersCount: {debugInfo?.providersCount ?? "—"}</div>
              <div>ordersLoaded: {debugInfo?.ordersLoaded ?? "—"}</div>
              <div>ordersError: {debugInfo?.ordersError || "—"}</div>
              <div>scopeError: {debugInfo?.scopeError || "—"}</div>
              <div>error: {debugInfo?.error || "—"}</div>
              <div className="break-all">basePath: {basePath}</div>
              <div className="break-all">activeSlug prop: {activeSlug || "—"}</div>
              <div className="break-all">provider prop: {provider?.slug || "—"}</div>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liveMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-[color:var(--neutral-200)] bg-white shadow-sm">
                <CardHeader className="pb-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--neutral-500)]">
                    {metric.label}
                  </p>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-3xl font-semibold text-[color:var(--neutral-900)]">{metric.value}</p>
                  {metric.trend ? (
                    <Badge variant="success" className="px-2 py-1 text-[11px]">
                      {metric.trend}
                    </Badge>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-5" id="pedidos">
          <Card className="border-[color:var(--neutral-200)] bg-white shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Pedidos recientes</CardTitle>
                {lastIncomingTs ? (
                  <Badge variant="secondary" className="animate-pulse">
                    Nuevo pedido
                  </Badge>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={alarmEnabled} onCheckedChange={setAlarmEnabled} id="alarm-switch" />
                  <label htmlFor="alarm-switch" className="cursor-pointer select-none">
                    Alarma nuevos pedidos
                  </label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Acciones alarma
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Alarmas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => playChime(toneId)}>Probar tono actual</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setToneId("bright")}>
                      Tono brillante {toneId === "bright" ? "· activo" : ""}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setToneId("soft")}>
                      Tono suave {toneId === "soft" ? "· activo" : ""}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setToneId("pop")}>
                      Tono pop {toneId === "pop" ? "· activo" : ""}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button asChild variant="ghost" size="sm">
                  <Link href={ordersHref}>
                    Ver todos
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/70 max-h-[460px] overflow-y-auto">
                {recentOrders.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">
                    Aún no hay pedidos para este proveedor.
                  </p>
                ) : (
                  recentOrders.map((order) => (
                      <div
                      key={order.id}
                      className="grid gap-2 border-b border-border/70 px-4 py-3 last:border-b-0 sm:grid-cols-[1.2fr_auto]"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{order.clientName}</p>
                          <span
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge[order.status] ?? "bg-border text-foreground"}`}
                          >
                            {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status}
                          </span>
                          {order.paymentMethod ? (
                            <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
                              {order.paymentMethod === "transferencia" ? <CreditCard className="h-3.5 w-3.5" /> : <Wallet className="h-3.5 w-3.5" />}
                              {order.paymentMethod === "transferencia" ? "Transferencia" : "Efectivo"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px]">
                              Pago no especificado
                            </Badge>
                          )}
                          {(() => {
                            const state = paymentStateFor(order);
                            const tone =
                              state.tone === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                                : state.tone === "warn"
                                  ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
                                  : "border-muted-foreground/20 bg-muted text-muted-foreground";
                          return (
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
                              {state.label}
                            </span>
                          );
                        })()}
                        {(order.deliveryDate || order.deliveryZoneName) ? (
                          <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
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
                        ) : null}
                          {order.contactPhone ? (
                            <a
                              href={`https://wa.me/${order.contactPhone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/15"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {order.contactPhone}
                            </a>
                          ) : (
                            <Badge variant="outline" className="text-[11px]">
                              Sin WhatsApp
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString("es-AR", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Fecha no disponible"}
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                          <p className="text-[11px] text-muted-foreground">Total</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={orderDetailHref(order.id)}>
                            Ver detalle
                            <ArrowUpRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
