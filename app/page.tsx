"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const timeline = [
  {
    title: "Comparte un link único",
    text: "Cada tienda recibe su enlace simple para armar pedidos en minutos.",
  },
  {
    title: "Pedidos en un solo panel",
    text: "Organiza pedidos, cambia estados y responde rápido desde tu celular.",
  },
  {
    title: "Notifica por WhatsApp",
    text: "Envía el resumen del pedido al instante. Sin emails, directo a tu WA.",
  },
];

const stats = [
  { label: "Pedidos nuevos", value: "18" },
  { label: "Entregados este mes", value: "62" },
  { label: "Tiempo promedio de armado", value: "12 min" },
];

export default function Home() {
  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/60">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-16 top-12 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <motion.div
          className="absolute right-0 bottom-10 h-80 w-80 rounded-full bg-foreground/5 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.1 }}
        />
      </div>

      <main className="relative mx-auto flex max-w-5xl flex-col gap-12 px-5 pb-16 pt-14 md:px-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid gap-8 rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur md:grid-cols-[1.3fr_1fr]"
        >
          <div className="space-y-5">
            <Badge variant="secondary" className="backdrop-blur">
              Micro-SaaS para proveedores B2B
            </Badge>
            <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
              Recibe y organiza pedidos de tus clientes desde el celu.
            </h1>
            <p className="text-pretty text-base text-muted-foreground md:text-lg">
              Cada tienda tiene su link único para enviar pedidos. Tú los ves en
              un panel simple, cambias estados y notificas por WhatsApp en un
              toque.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/app">
                  Ingresar al panel
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/invite/demo/XXXX">
                  Probar como tienda
                  <ShoppingBag className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-background/80 p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proveedor</p>
                <p className="font-semibold">Tufud Distribuidora</p>
              </div>
              <Badge variant="outline">Vista móvil</Badge>
            </div>
            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Pedido de Nova Caballito
                </CardTitle>
                <p className="text-xs text-muted-foreground">Hace 2 min · nuevo</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Granola Premium</p>
                    <p className="text-xs text-muted-foreground">2 x $5.500</p>
                  </div>
                  <p className="font-semibold">$11.000</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Yerba Orgánica</p>
                    <p className="text-xs text-muted-foreground">3 x $3.800</p>
                  </div>
                  <p className="font-semibold">$11.400</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">Total estimado</p>
                  <p className="text-base font-semibold">$22.400</p>
                </div>
                <Button className="w-full" variant="outline">
                  Notificar al proveedor
                  <MessageCircle className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="grid gap-4 sm:grid-cols-3"
        >
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="border-border/60 bg-card/80 shadow-sm backdrop-blur"
            >
              <CardHeader className="pb-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="grid gap-4 md:grid-cols-3"
        >
          {timeline.map((item) => (
            <Card
              key={item.title}
              className="border-border/60 bg-card/80 shadow-sm backdrop-blur"
            >
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {item.text}
              </CardContent>
            </Card>
          ))}
        </motion.section>
      </main>
    </div>
  );
}
