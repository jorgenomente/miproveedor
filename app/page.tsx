"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
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

const stats: { label: string; value: string }[] = [];

const solutionBullets = [
  "Pedidos siempre ordenados",
  "Remitos y montos a la vista",
  "Preparación clara y sin errores",
  "Seguimiento de pagos y comprobantes",
  "Historial automático",
  "Todo en un mismo lugar",
];

const steps = [
  {
    title: "El distribuidor invita a una tienda",
    text: "Genera un link y lo comparte por WhatsApp o mail.",
  },
  {
    title: "La tienda hace el pedido desde ese link",
    text: "Sin registrarse y sin descargar apps.",
  },
  {
    title: "El distribuidor lo recibe en su dashboard",
    text: "Puede editar, agregar notas y ajustar cantidades.",
  },
  { title: "Lo prepara y lo despacha", text: "Imprime o usa el modo preparación." },
  { title: "Recibe el comprobante de pago", text: "La tienda sube la foto." },
  {
    title: "Marca el pedido como pagado",
    text: "Todo queda registrado en el historial.",
  },
];

const modules = [
  { title: "Pedidos", text: "Recibí, editá y prepará pedidos con claridad." },
  { title: "Remitos / Montos", text: "Detalle limpio y exportable." },
  { title: "Pagos", text: "La tienda sube comprobantes y vos los marcás." },
  { title: "Historial", text: "Todo guardado automáticamente." },
  { title: "Invitaciones", text: "Links rápidos para que pidan sin fricción." },
  { title: "Perfiles de tiendas", text: "Cada tienda tiene su espacio de pedidos." },
];

const advantages = {
  distribuidores: [
    "Menos tiempo ordenando mensajes",
    "Más control de pagos",
    "Seguimiento claro de pedidos",
    "Preparación más rápida",
    "Menos errores con el personal",
  ],
  tiendas: [
    "Pedido rápido desde un link",
    "Más claridad al hacer su pedido",
    "Sin enviar 20 mensajes",
    "Más confianza y seguimiento",
  ],
};

const testimonials = [
  {
    quote:
      "Finalmente dejamos WhatsApp. Ahora armamos pedidos en la mitad del tiempo.",
    author: "Distribuidora Madre Tierra",
  },
  {
    quote: "Mis tiendas lo aman porque hacen el pedido en un minuto.",
    author: "Distribuidor Zona Oeste",
  },
];

const faqs = [
  { q: "¿Las tiendas deben registrarse?", a: "No. Solo usan un link." },
  {
    q: "¿Necesito instalar algo?",
    a: "No. Todo funciona en el navegador.",
  },
  { q: "¿Puedo usarlo desde el celular?", a: "Sí, 100%." },
  {
    q: "¿Qué necesito para empezar?",
    a: "Crear tu cuenta e invitar a tus clientes.",
  },
];

export default function Home() {
  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/60">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-24 top-4 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <motion.div
          className="absolute right-0 bottom-12 h-80 w-80 rounded-full bg-foreground/5 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.1 }}
        />
      </div>

      <main className="relative mx-auto flex max-w-6xl flex-col gap-8 px-5 pb-16 pt-14 md:px-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid gap-8 rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur md:grid-cols-[1.3fr_1fr]"
        >
          <div className="space-y-5">
            <Badge variant="secondary" className="backdrop-blur">
              Pedidos B2B sin caos
            </Badge>
            <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
              La plataforma para distribuidores que quieren dejar atrás el caos.
            </h1>
            <p className="text-pretty text-base text-muted-foreground md:text-lg">
              Pedidos, remitos y pagos organizados en un sistema central. Sin
              WhatsApp. Sin planillas. Sin confusiones.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/demo">
                  Probar MiProveedor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#como-funciona">
                  Ver cómo funciona
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-background/80 p-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Proveedor</p>
                <p className="font-semibold">TuSnack Distribuidora</p>
              </div>
              <Badge variant="outline">Vista móvil</Badge>
            </div>
            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Pedido de Tieda Palermo
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
                  Enviar y notificar al proveedor
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

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="space-y-4 rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold md:text-2xl">
                MiProveedor.app organiza todo por vos.
              </h2>
            </div>
            <Badge variant="outline">Simple y rápido</Badge>
          </div>
          <p className="text-pretty text-base text-muted-foreground md:text-lg">
            Un sistema simple y rápido donde cada tienda hace su pedido desde un
            link, y el distribuidor lo recibe en un dashboard claro, editable y listo
            para preparar.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {solutionBullets.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          id="como-funciona"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="space-y-4 rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              
              <h2 className="text-xl font-semibold md:text-2xl">
                Cómo funciona 
              </h2>
            </div>
            <Badge variant="outline">Diseñado para distribuidores</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.04 }}
                className="group flex gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              
              <h2 className="text-xl font-semibold md:text-2xl">
                Módulos principales
              </h2>
            </div>
            <Badge variant="outline">Listos para usar</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {modules.map((item) => (
              <Card
                key={item.title}
                className="border-border/60 bg-card/80 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {item.text}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="grid gap-4 rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur md:grid-cols-2"
        >
          <div className="space-y-3">
            
            <h3 className="text-lg font-semibold md:text-xl">Para distribuidores</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {advantages.distribuidores.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold md:text-xl">Para tiendas</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {advantages.tiendas.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="grid gap-4 md:grid-cols-[1.2fr_1fr]"
        >
          <div className="space-y-3 rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur">
            
            <h3 className="text-xl font-semibold md:text-2xl">Testimonios iniciales</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {testimonials.map((testimonial) => (
                <Card
                  key={testimonial.author}
                  className="border-border/60 bg-card/80 shadow-sm"
                >
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm text-muted-foreground">
                      “{testimonial.quote}”
                    </p>
                    <p className="text-xs font-semibold">{testimonial.author}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur">
            <div className="space-y-1">
             
              <h3 className="text-xl font-semibold md:text-2xl">
                Tu distribuidora organizada desde el día uno.
              </h3>
            </div>
            <Card className="border-border/70 bg-card/90 shadow-sm">
              <CardHeader className="pb-2">
                <Badge className="w-fit">Plan único · Early Access</Badge>
                <CardTitle className="text-lg font-semibold">
                  MiProveedor Early Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✔ Todos los módulos</li>
                  <li>✔ Soporte directo</li>
                  <li>✔ Acceso a nuevas funciones</li>
                  <li>✔ Sin límite de tiendas invitadas</li>
                </ul>
                <div className="flex items-end gap-1">
                  <p className="text-3xl font-semibold">US$9,90</p>
                  <p className="text-sm text-muted-foreground">/ mes</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  o el equivalente en tu moneda.
                </p>
                <Button className="w-full" size="lg" asChild>
                  <Link href="/demo">
                    Quiero acceder
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-border/60 bg-card/70 p-6 backdrop-blur"
        >
          <div className="space-y-3">
            
            <h3 className="text-xl font-semibold md:text-2xl">
              Preguntas frecuentes
            </h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {faqs.map((item) => (
              <Card
                key={item.q}
                className="border-border/60 bg-card/80 shadow-sm transition hover:-translate-y-1"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">{item.q}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {item.a}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-border/60 bg-gradient-to-r from-primary/10 via-card to-secondary/20 p-6 shadow-sm backdrop-blur"
        >
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-2">
              
              <h3 className="text-2xl font-semibold md:text-3xl">
                Listo para dejar atrás WhatsApp y tener todo ordenado?
              </h3>
              <p className="text-sm text-muted-foreground">
                MiProveedor te da el control de pedidos, remitos y pagos desde el día
                uno.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link href="/demo">
                Comenzar ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
