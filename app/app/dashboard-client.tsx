"use client";

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CreditCard, Package, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  quickActionsOverride?: {
    label: string;
    href: string;
    icon: React.ReactNode;
  }[];
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
  quickActionsOverride,
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
  const [isRefreshing, startTransition] = useTransition();
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
  const defaultQuickActions = [
    {
      label: "Ver pedidos",
      href: providerSlug ? `${basePath}/orders?provider=${providerSlug}` : `${basePath}/orders`,
      icon: <ShoppingBag className="h-4 w-4" />,
    },
    {
      label: "Clientes y links",
      href: `${basePath}/clients`,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Mis alias y pagos",
      href: `${basePath}/payments`,
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      label: "Administrar artículos",
      href: `${basePath}/products`,
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: "Mi suscripción",
      href: `${basePath}/subscription`,
      icon: <CreditCard className="h-4 w-4" />,
    },
  ];
  const quickActions = quickActionsOverride ?? defaultQuickActions;
  const ordersHref =
    ordersHrefOverride ??
    (providerSlug ? `${basePath}/orders?provider=${providerSlug}` : `${basePath}/orders`);

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

  const playChime = async (tone: "bright" | "soft" | "pop" = toneId) => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
  };

  const triggerAlarm = () => {
    const now = Date.now();
    if (now - lastAlarmRef.current < 1200) return;
    setLastIncomingTs(now);
    if (alarmEnabled) {
      void playChime(toneId);
    }
    lastAlarmRef.current = now;
  };

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
  }, [liveMetrics, alarmEnabled, toneId]);

  useEffect(() => {
    if (!providerSlug) return;
    let channel: any = null;
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
  }, [providerSlug, provider?.id, alarmEnabled, toneId, router]);

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

        <Card className="border-[color:var(--neutral-200)] bg-white shadow-sm">
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                asChild
                variant="ghost"
                className="justify-start rounded-lg border border-[color:var(--neutral-200)] bg-[color:var(--surface)] text-[color:var(--neutral-900)] hover:bg-[color:var(--info-light)]"
              >
                <Link href={action.href}>
                  <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--info-light)] text-[color:var(--brand-deep)]">
                    {action.icon}
                  </span>
                  <span className="mr-auto">{action.label}</span>
                  <ArrowUpRight className="ml-2 h-4 w-4 text-[color:var(--neutral-500)]" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

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
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold">{order.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString("es-AR", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Fecha no disponible"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[order.status]}`}
                        >
                          {order.status}
                        </span>
                        <p className="text-sm font-semibold">
                          {formatCurrency(order.total)}
                        </p>
                        <Button asChild size="icon" variant="ghost">
                          <Link href={orderDetailHref(order.id)}>
                            <ArrowUpRight className="h-4 w-4" />
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
