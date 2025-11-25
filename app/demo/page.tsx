"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MousePointerClick, PhoneCall, ShoppingBag, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDemoData } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/whatsapp";

const demo = getDemoData();

export default function DemoPage() {
  const publicLinks = demo.clients.map((client) => ({
    label: client.name,
    href: `/${demo.provider.slug}/${client.slug}`,
    contact: client.contact_phone ?? client.contact_email ?? "Sin contacto",
    address: client.address ?? "Sin dirección",
  }));

  const panelLinks = [
    { label: "Dashboard", href: `/demo/panel` },
    { label: "Pedidos", href: `/demo/panel#pedidos` },
    { label: "Tiendas", href: `/demo/panel#clientes` },
    { label: "Productos", href: `/demo/panel#productos` },
  ];
  const defaultPublicHref =
    publicLinks[0]?.href ?? `/${demo.provider.slug}/${demo.clients[0]?.slug ?? ""}`;

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-12 top-6 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <motion.div
          className="absolute right-0 bottom-6 h-80 w-80 rounded-full bg-foreground/5 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
        />
      </div>

      <main className="relative mx-auto flex max-w-6xl flex-col gap-8 px-5 pb-16 pt-12 md:px-10">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="backdrop-blur">
            Demo en vivo · Sin login
          </Badge>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="grid gap-6 rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur md:grid-cols-[1.3fr_1fr]"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10">
              <Sparkles className="h-4 w-4" />
              Modo demo interactivo
            </div>
            <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
              Explora MiProveedor con datos ficticios listos para usar.
            </h1>
            <p className="text-pretty text-sm text-muted-foreground md:text-base">
              No necesitas credenciales. Entra al panel, navega tiendas ficticias y abre un link
              público para enviar un pedido de prueba. Los pedidos que envíes quedan visibles 24h
              y se limpian solos; es solo para ver el flujo completo.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/demo/panel">
                  Abrir panel demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={defaultPublicHref}>
                  Ver link público
                  <ShoppingBag className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {panelLinks.map((item) => (
                <Button key={item.href} asChild variant="ghost" className="justify-between">
                  <Link href={item.href}>
                    {item.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {demo.provider.name} · catálogo demo
              </CardTitle>
              <p className="text-xs text-muted-foreground">Productos activos hoy</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {demo.products.slice(0, 3).map((product) => (
                <div key={product.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
                  <div>
                    <p className="text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.description}</p>
                  </div>
                  <div className="text-sm font-semibold">{formatCurrency(product.price)}</div>
                </div>
              ))}
              <Separator />
              <p className="text-xs text-muted-foreground">
                Hay {demo.products.length} productos activos en este modo de ejemplo.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]"
        >
          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Links de tiendas demo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Abre un link público y envía un pedido de prueba. Se muestra como lo ve la tienda.
                </p>
              </div>
              <Badge variant="secondary">{publicLinks.length} tiendas</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {publicLinks.map((link) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2 rounded-xl border border-border/70 bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {link.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{link.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <PhoneCall className="h-3.5 w-3.5" />
                      {link.contact}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={link.href} target="_blank">
                      Abrir link
                      <MousePointerClick className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
              ))}
              <p className="text-xs text-muted-foreground">
                Nota: todo es ficticio. Usa cualquier nombre y teléfono para probar el flujo completo.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Qué puedes probar</CardTitle>
              <p className="text-sm text-muted-foreground">
                Recorre el panel y envía un pedido desde el link público para ver el resumen listo para WhatsApp.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 text-sm">
                <p className="font-semibold">1. Panel del proveedor</p>
                <p className="text-muted-foreground">
                  Navega Dashboard, Pedidos, Tiendas y Productos. Las acciones se simulan en demo.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 text-sm">
                <p className="font-semibold">2. Link público</p>
                <p className="text-muted-foreground">
                  Elige cantidades, completa tus datos y envía el pedido. Verás el mensaje listo para WhatsApp.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 text-sm">
                <p className="font-semibold">3. Flujo completo</p>
                <p className="text-muted-foreground">
                  Cambia estados en la lista de pedidos demo y copia enlaces de tiendas como si fueras el proveedor.
                </p>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">Datos ficticios</Badge>
                <Badge variant="outline">Mobile-first</Badge>
                <Badge variant="outline">Sin login</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>
    </div>
  );
}
