"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  MessageCircle,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const metrics = [
  { label: "Pedidos nuevos", value: "6", trend: "+2 hoy" },
  { label: "En preparación", value: "4", trend: "al día" },
  { label: "Entregados semana", value: "28", trend: "+12% vs pasada" },
];

const quickActions = [
  {
    label: "Ver pedidos",
    href: "/app/orders",
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  {
    label: "Crear invitación",
    href: "/app/clients",
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "Agregar producto",
    href: "/app/products",
    icon: <Package className="h-4 w-4" />,
  },
];

const recentOrders = [
  {
    id: "ord_1234",
    client: "Nova Caballito",
    status: "nuevo",
    total: "$22.400",
    time: "Hace 5 min",
  },
  {
    id: "ord_1235",
    client: "Mercado Azul",
    status: "preparando",
    total: "$15.800",
    time: "Hace 20 min",
  },
  {
    id: "ord_1236",
    client: "Dietetica Centro",
    status: "enviado",
    total: "$9.200",
    time: "Hace 1 h",
  },
];

const statusBadge: Record<string, string> = {
  nuevo: "bg-primary/10 text-primary",
  preparando: "bg-amber-500/10 text-amber-700 dark:text-amber-200",
  enviado: "bg-blue-500/10 text-blue-700 dark:text-blue-200",
  entregado: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  cancelado: "bg-destructive/10 text-destructive",
};

export default function AppDashboard() {
  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/50 px-4 pb-12 pt-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-10 top-8 h-52 w-52 rounded-full bg-primary/10 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        <motion.div
          className="absolute right-0 bottom-10 h-64 w-64 rounded-full bg-foreground/5 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.05 }}
        />
      </div>

      <main className="relative mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between md:gap-6 md:p-6">
          <div>
            <p className="text-sm text-muted-foreground">MiProveedor</p>
            <h1 className="text-2xl font-semibold md:text-3xl">
              Dashboard de proveedor
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona pedidos, notifica por WhatsApp y mantiene tu catálogo al día.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button key={action.href} asChild variant="outline">
                <Link href={action.href}>
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            ))}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <Card
              key={metric.label}
              className="border-border/60 bg-card/80 shadow-sm backdrop-blur"
            >
              <CardHeader className="pb-2">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <p className="text-2xl font-semibold">{metric.value}</p>
                <Badge variant="secondary">{metric.trend}</Badge>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-5 md:grid-cols-[1.5fr_1fr]">
          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Pedidos recientes</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/app/orders">
                  Ver todos
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="divide-y divide-border/70 p-0">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{order.client}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[order.status]}`}
                    >
                      {order.status}
                    </span>
                    <p className="text-sm font-semibold">{order.total}</p>
                    <Button asChild size="icon" variant="ghost">
                      <Link href={`/app/orders/${order.id}`}>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">
                Notifica por WhatsApp
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Envía el resumen del pedido al instante. Sin emails.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/40 p-3">
                <div>
                  <p className="text-sm font-semibold">+54 9 11 5555-4422</p>
                  <p className="text-xs text-muted-foreground">
                    Edita este número en Ajustes
                  </p>
                </div>
                <Badge variant="outline">Proveedor</Badge>
              </div>
              <Separator />
              <Button className="w-full" variant="outline">
                <MessageCircle className="mr-2 h-4 w-4" />
                Abrir WhatsApp
              </Button>
              <Button className="w-full" variant="secondary" asChild>
                <Link href="/app/orders">Ver pedidos</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
