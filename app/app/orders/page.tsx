"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Filter, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const orders = [
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
  {
    id: "ord_1237",
    client: "Natural Shop",
    status: "entregado",
    total: "$18.600",
    time: "Hoy",
  },
];

const statusBadge: Record<string, string> = {
  nuevo: "bg-primary/10 text-primary",
  preparando: "bg-amber-500/10 text-amber-700 dark:text-amber-200",
  enviado: "bg-blue-500/10 text-blue-700 dark:text-blue-200",
  entregado: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  cancelado: "bg-destructive/10 text-destructive",
};

export default function OrdersPage() {
  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/50 px-4 pb-12 pt-6 sm:px-8">
      <main className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button asChild variant="ghost" size="sm">
              <Link href="/app">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <span>/</span>
            <Badge variant="secondary">Pedidos</Badge>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
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
              <Input placeholder="Buscar tienda" />
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border/70 p-0">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    {order.client} · {order.total}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.time}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[order.status]}`}
                  >
                    {order.status}
                  </span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/app/orders/${order.id}`}>
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
            ))}
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
