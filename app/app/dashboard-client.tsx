"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  CreditCard,
  Phone,
  ShoppingCart,
  Timer,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const metricIconMap: Record<string, LucideIcon> = {
  "pedidos nuevos": Bell,
  "en preparación": Timer,
  entregados: CheckCircle2,
};

function iconForMetric(label: string): LucideIcon {
  const key = label.toLowerCase();
  const match = Object.entries(metricIconMap).find(([name]) => key.includes(name));
  return match ? match[1] : TrendingUp;
}

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

  const [salesRange, setSalesRange] = useState<"monthly" | "weekly">("monthly");

  const salesData = useMemo(() => {
    if (salesRange === "weekly") {
      const now = new Date();
      const monday = new Date(now);
      const diffToMonday = (monday.getDay() + 6) % 7;
      monday.setDate(monday.getDate() - diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const weeks = Array.from({ length: 8 }).map((_, idx) => {
        const start = new Date(monday);
        start.setDate(monday.getDate() - (7 * (7 - idx)));
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return { start, end, label: start.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) };
      });

      return weeks.map((bucket) => {
        const total = recentOrders.reduce((acc, order) => {
          if (!order.createdAt) return acc;
          const d = new Date(order.createdAt);
          if (Number.isNaN(d.getTime())) return acc;
          if (d >= bucket.start && d < bucket.end) {
            return acc + Number(order.total ?? 0);
          }
          return acc;
        }, 0);
        return { label: bucket.label, total: Number.isFinite(total) ? Math.max(total, 0) : 0 };
      });
    }

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    const buckets = Array.from({ length: 6 }).map((_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return {
        label: `${monthNames[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`,
        month: date.getMonth(),
        year: date.getFullYear(),
      };
    });

    return buckets.map((bucket) => {
      const total = recentOrders.reduce((acc, order) => {
        if (!order.createdAt) return acc;
        const d = new Date(order.createdAt);
        if (Number.isNaN(d.getTime())) return acc;
        if (d.getMonth() === bucket.month && d.getFullYear() === bucket.year) {
          return acc + Number(order.total ?? 0);
        }
        return acc;
      }, 0);
      return { label: bucket.label, total: Number.isFinite(total) ? Math.max(total, 0) : 0 };
    });
  }, [recentOrders, salesRange]);

  return (
    <div className="w-full">
      <main className="flex w-full flex-col gap-6">
        <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-6 shadow-[0_18px_48px_-26px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <div className="absolute left-[-40px] top-[-60px] h-32 w-32 rounded-full bg-[color:var(--accent)] blur-3xl" />
            <div className="absolute right-[-30px] top-[-10px] h-36 w-36 rounded-full bg-[color:var(--ring)]/40 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                MiProveedor {provider ? `· ${provider.slug}` : ""}
              </p>
              <h1 className="text-3xl font-semibold text-foreground md:text-4xl">Panel de control</h1>

              {provider ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={subscriptionBadge.variant}>{subscriptionBadge.label}</Badge>
                  <span>Suscripto desde: {formattedDate(provider.subscribedAt)}</span>
                  <span>Renueva el: {formattedDate(provider.renewsAt)}</span>
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2 self-start rounded-full border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground shadow-[0_8px_26px_-20px_rgba(0,0,0,0.6)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--success)] shadow-[0_0_0_6px_rgba(18,178,114,0.18)]" />
              Actualizado en vivo
            </div>
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {liveMetrics.map((metric, index) => {
            const Icon = iconForMetric(metric.label);
            const trendIsPositive = metric.trend ? !metric.trend.trim().startsWith("-") : true;

            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/90 p-5 shadow-[0_16px_44px_-26px_rgba(0,0,0,0.6)]">
                  <div className="absolute right-[-18px] top-[-24px] h-28 w-28 rounded-full bg-[color:var(--ring)]/20 blur-3xl" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {metric.label}
                      </p>
                      <p className="text-3xl font-semibold text-foreground md:text-4xl">{metric.value}</p>
                      {metric.trend ? (
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            trendIsPositive
                              ? "bg-[color:var(--success-light)] text-[color:var(--success)]"
                              : "bg-[color:var(--error-light)] text-[color:var(--destructive)]"
                          }`}
                        >
                          {trendIsPositive ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {metric.trend}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Estado al día</span>
                      )}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--accent)]/70 text-[color:var(--brand-deep)] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>

        <section className="grid gap-5" id="pedidos">
          <Card className="overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.55)]">
            <CardHeader className="space-y-4 border-b border-border/60 bg-gradient-to-r from-[color:var(--accent)]/30 via-transparent to-transparent p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--accent)]/70 text-[color:var(--brand-deep)] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)]">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Pedidos recientes</CardTitle>
                    <p className="text-sm text-muted-foreground">Últimas transacciones registradas</p>
                  </div>
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
                  <Button asChild variant="ghost" size="sm" className="rounded-full">
                    <Link href={ordersHref}>
                      Ver todos
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="hidden md:grid grid-cols-[1.5fr_1.6fr_1fr_1fr_auto] gap-3 border-b border-border/60 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <span>Pedido</span>
                <span>Pago y contacto</span>
                <span>Entrega</span>
                <span>Estado</span>
                <span className="text-right">Total</span>
              </div>
              <div className="divide-y divide-border/60 max-h-[520px] overflow-y-auto">
                {recentOrders.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-muted-foreground">
                    Aún no hay pedidos para este proveedor.
                  </p>
                ) : (
                  recentOrders.map((order, index) => {
                    const paymentState = paymentStateFor(order);
                    const tone =
                      paymentState.tone === "success"
                        ? "border-[color:var(--success)]/25 bg-[color:var(--success-light)] text-[color:var(--success)]"
                        : paymentState.tone === "warn"
                          ? "border-[color:var(--warning)]/25 bg-[color:var(--warning-light)] text-[color:var(--warning)]"
                          : "border-[color:var(--muted-foreground)]/25 bg-[color:var(--muted)] text-[color:var(--muted-foreground)]";

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="grid gap-4 px-5 py-4 md:grid-cols-[1.5fr_1.6fr_1fr_1fr_auto]"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-foreground">{order.clientName}</p>
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
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {order.paymentMethod ? (
                            <Badge variant="secondary" className="flex items-center gap-1 rounded-full text-[11px]">
                              {order.paymentMethod === "transferencia" ? (
                                <CreditCard className="h-3.5 w-3.5" />
                              ) : (
                                <Wallet className="h-3.5 w-3.5" />
                              )}
                              {order.paymentMethod === "transferencia" ? "Transferencia" : "Efectivo"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-full text-[11px]">
                              Pago no especificado
                            </Badge>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${tone}`}
                          >
                            {paymentState.label}
                          </span>
                          {order.contactPhone ? (
                            <a
                              href={`https://wa.me/${order.contactPhone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-[color:var(--ring)]/40 bg-[color:var(--accent)] px-3 py-1 text-[11px] font-semibold text-[color:var(--brand-deep)] transition hover:bg-[color:var(--accent)]/80"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {order.contactPhone}
                            </a>
                          ) : (
                            <Badge variant="outline" className="rounded-full text-[11px]">
                              Sin WhatsApp
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {order.deliveryDate || order.deliveryZoneName ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[color:var(--muted)] px-3 py-1 text-[11px] font-semibold text-foreground">
                              <Truck className="h-3.5 w-3.5" />
                              {order.deliveryDate
                                ? new Date(order.deliveryDate).toLocaleDateString("es-AR", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  })
                                : "Sin fecha"}
                              {order.deliveryZoneName ? ` · Zona ${order.deliveryZoneName}` : ""}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Entrega sin definir</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge[order.status] ?? "bg-border text-foreground"}`}
                          >
                            {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 md:justify-end">
                          <div className="text-right">
                            <p className="text-base font-semibold text-foreground">{formatCurrency(order.total)}</p>
                            <p className="text-[11px] text-muted-foreground">Total</p>
                          </div>
                          <Button asChild size="sm" variant="outline" className="rounded-full">
                            <Link href={orderDetailHref(order.id)}>
                              Ver detalle
                              <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5">
          <Card className="overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.55)]">
            <CardHeader className="space-y-2 border-b border-border/60 bg-gradient-to-r from-[color:var(--ring)]/30 via-transparent to-transparent p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--accent)]/70 text-[color:var(--brand-deep)] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Ventas mensuales</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {salesRange === "weekly"
                      ? "Últimas 8 semanas · datos de pedidos recientes"
                      : "Últimos 6 meses · datos de pedidos recientes"}
                  </p>
                </div>
              </div>
              <Tabs value={salesRange} onValueChange={(value) => setSalesRange(value as "monthly" | "weekly")}>
                <TabsList>
                  <TabsTrigger value="monthly">Mensual</TabsTrigger>
                  <TabsTrigger value="weekly">Semanal</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-5">
              {salesData.every((item) => item.total === 0) ? (
                <p className="text-sm text-muted-foreground">Aún no hay ventas para graficar.</p>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData} margin={{ left: 8, right: 8 }}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="6 6" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                      />
                      <RechartsTooltip
                        cursor={{ stroke: "var(--ring)", strokeWidth: 1 }}
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "12px",
                          boxShadow: "var(--shadow-sm)",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: "var(--muted-foreground)" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="var(--chart-1)"
                        strokeWidth={3}
                        fill="url(#salesGradient)"
                        dot={{ r: 3, stroke: "var(--background)", strokeWidth: 1.2, fill: "var(--chart-1)" }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
