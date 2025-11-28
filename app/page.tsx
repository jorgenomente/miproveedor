"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Fingerprint,
  History,
  HelpCircle,
  Image as ImageIcon,
  Link2,
  ListChecks,
  LayoutDashboard,
  MessageSquare,
  Printer,
  Repeat,
  ShieldCheck,
  Send,
  UploadCloud,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Layers,
  FileDown,
  PanelsTopLeft,
  MessageCircleWarning,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const chaosPoints = [
  { icon: MessageSquare, text: "WhatsApp explotado y sin orden" },
  { icon: ImageIcon, text: "Pedidos mezclados con fotos" },
  { icon: Repeat, text: "Pedidos, facturas, remitos y cobros dispersos" },
  { icon: AlertTriangle, text: "Comprobantes que no aparecen" },
  { icon: HelpCircle, text: "Errores por información duplicada" },
  { icon: Clock3, text: "Clientes con muchas preguntas" },
];

const platformPoints = [
  { icon: Link2, title: "Link único por cliente", text: "Ver catálogo y hacer pedidos sin errores." },
  { icon: UploadCloud, title: "Suben comprobantes", text: "Adjuntan pagos sin pedirlos mil veces." },
  { icon: History, title: "Pedidos anteriores", text: "Todo el historial a mano para la tienda." },
  { icon: ListChecks, title: "Estado de cuenta", text: "Consultan saldos y evitan repreguntar." },
  { icon: ShieldCheck, title: "Sin login", text: "Acceso directo, cero fricción." },
];

const impactStats = [
  { label: "Mensajes en WhatsApp", value: "–60%", accent: "primary" },
  { label: "Trabajo administrativo", value: "–50%", accent: "secondary" },
  { label: "Errores en pedidos", value: "–70%", accent: "emerald" },
  { label: "Pedidos incompletos", value: "-90%", accent: "amber" },
  { label: "Eficiencia cuentas corrientes", value: "+3x", accent: "blue" },
  { label: "Clientes autogestionados", value: "Tus clientes", accent: "violet", suffix: " mantienen tu orden" },
];

const impactTranslations = [
  "tu equipo respira",
  "tus pedidos entran bien",
  "tus cuentas están claras",
  "tus clientes no dependen de vos",
  "todo fluye con menos esfuerzo",
];

const featureHighlights = [
  { icon: Link2, title: "Links de pedido únicos", text: "Cada cliente entra directo a su link; cero confusión." },
  { icon: Layers, title: "Catálogo claro", text: "Filtros, fotos y variaciones sin enredos." },
  { icon: ClipboardCheck, title: "Pedidos sin errores", text: "Formularios inteligentes que evitan vacíos." },
  { icon: UploadCloud, title: "Carga de comprobantes", text: "PDF o imagen; queda asociado al pedido." },
  { icon: ListChecks, title: "Estados claros", text: "Creado → confirmado → enviado → entregado → pagado." },
  { icon: History, title: "Historial completo", text: "Cada cliente y cada pedido con trazabilidad." },
  { icon: FileDown, title: "Remitos e informes", text: "Listos para imprimir o compartir." },
  { icon: LayoutDashboard, title: "Panel del distribuidor", text: "Control total de pedidos, pagos y clientes." },
];

const howItWorks = [
  {
    title: "Configurás tu catálogo y clientes",
    text: "Subís precios, productos y asignás un link único a cada tienda.",
    icon: Layers,
  },
  {
    title: "Tu cliente hace su pedido",
    text: "Ingresa al link, ve el catálogo y carga su pedido sin errores.",
    icon: Fingerprint,
  },
  {
    title: "Vos recibís todo ordenado",
    text: "Estados claros, comprobantes cargados, historial completo y remito listo.",
    icon: ClipboardCheck,
  },
];

const beforeList = [
  "Todo entraba por WhatsApp.",
  "Los pedidos se mezclaban.",
  "Los comprobantes se perdían.",
  "Los estados no se entendían.",
  "El equipo administrativo vivía apagando incendios.",
];

const afterList = [
  "Pedidos, comprobantes, pagos y estados en una sola plataforma.",
  "Todo claro. Todo ordenado. Todo simple.",
  "Menos persecución. Más control. Más tiempo para vender.",
];

export default function Home() {
  return (
    <div className="relative isolate min-h-screen bg-linear-to-b from-background via-background to-secondary/60">
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
          className="grid gap-8 rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur md:grid-cols-[1.3fr_1fr] md:p-6"
        >
          <div className="space-y-5">
            <Badge variant="secondary" className="backdrop-blur">
              Pedidos B2B sin caos
            </Badge>
            <h1 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
              El sistema para distribuidores y vendedores que elimina el caos de pedidos y comprobantes.
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
            <Card className="relative flex max-h-[280px] flex-col overflow-hidden border-border/60 bg-card/80 shadow-sm md:max-h-[320px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Cobros y remitos
                    </p>
                    <CardTitle className="text-base font-semibold">
                      Comprobantes a la vista
                    </CardTitle>
                  </div>
                  <Badge className="flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3" />
                    4 comprobantes pendientes
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative flex-1 space-y-3 overflow-auto pr-1 text-sm">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 p-3 text-emerald-900 shadow-inner dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          Comprobante recibido
                        </p>
                        <Badge className="bg-blue-500/15 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200">
                          Ver comprobante
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold">Aroma Natural</p>
                      <p className="text-xs text-emerald-900/80 dark:text-emerald-100/70">
                        Transferencia · $72.400 · hace 3 min
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="border-emerald-200/60">
                      Remito listo
                    </Badge>
                    <Button variant="secondary" size="sm" className="h-8">
                      <FileText className="mr-2 h-3.5 w-3.5" />
                      Descargar remito
                    </Button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className="rounded-xl border border-border/80 bg-background/60 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                        Comprobante pendiente
                      </p>
                      <p className="text-sm font-semibold">Fresco Market</p>
                      <p className="text-xs text-muted-foreground">
                        Esperando foto del pago · Pedido #1043
                      </p>
                    </div>
                    <Clock3 className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary">Recordatorio enviado</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      Verificar mañana
                    </Badge>
                  </div>
                </motion.div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="min-h-[44px] justify-start whitespace-normal break-words text-left leading-tight"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                    Confirmar pago manual
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-[44px] justify-start whitespace-normal break-words text-left leading-tight"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Resumen de cuenta
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-[44px] justify-start whitespace-normal break-words text-left leading-tight"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir remito
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-[44px] justify-start whitespace-normal break-words text-left leading-tight"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Ver próximos retiros
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-3xl border border-border/60 bg-linear-to-r from-primary/5 via-card to-secondary/10 p-6 shadow-sm backdrop-blur"
        >
          <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div className="space-y-3">
            
              <h2 className="text-2xl font-semibold md:text-3xl">
                Si vendés a tiendas, este caos te es familiar
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                Todo ese desorden te quita tiempo, te genera errores y convierte el día a
                día en un desgaste.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                MiProveedor.app existe para darte orden.
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {chaosPoints.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="group flex items-start gap-3 rounded-2xl border border-border/50 bg-background/70 p-3 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold leading-snug">{item.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur md:p-8"
        >
          <div className="grid gap-6 md:grid-cols-[1.05fr_1fr] md:items-center">
            <div className="relative space-y-4 rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.15),transparent_35%)] p-5 shadow-inner">
              
              <h3 className="text-2xl font-semibold leading-tight md:text-3xl">
                Qué es MiProveedor.app
              </h3>
              <p className="text-base text-muted-foreground">
                Una plataforma donde cada cliente recibe un link de pedidos único y puede:
              </p>
              <ul className="space-y-2 text-sm md:text-base">
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  ver catálogo
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  hacer pedidos sin errores
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  subir comprobantes
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  ver sus pedidos anteriores
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  consultar su estado de cuenta
                </li>
              </ul>
              <div className="flex items-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                <ShieldCheck className="h-5 w-5" />
                Todo sin necesitar login.
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {platformPoints.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                      <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-primary/15 blur-3xl" />
                      <div className="absolute -right-6 bottom-0 h-24 w-24 rounded-full bg-secondary/15 blur-3xl" />
                    </div>
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.text}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-border/60 bg-background/80 p-4 text-sm text-muted-foreground">
            Y vos, como distribuidor, ves todo en un panel centralizado: pedidos,
            estados, pagos, comprobantes y actividad del cliente.
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="overflow-hidden rounded-3xl border border-border/60 bg-linear-to-br from-background via-card/80 to-primary/10 p-6 shadow-sm backdrop-blur md:p-8"
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-2">
                
                <h3 className="text-2xl font-semibold md:text-3xl">
                  Impacto real en tu operación
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <TrendingUp className="h-4 w-4" />
                Operación más limpia y rápida
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {impactStats.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10 opacity-0 transition group-hover:opacity-100" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">
                        {item.value}
                        {item.suffix ? (
                          <span className="ml-1 text-sm font-medium text-muted-foreground">
                            {item.suffix}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                    {item.value.startsWith("-") ? (
                      <TrendingDown className="h-5 w-5 text-amber-500" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-primary mb-2">Traducción práctica:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {impactTranslations.map((text) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/80 px-3 py-2 text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="overflow-hidden rounded-3xl border border-border/60 bg-linear-to-tr from-secondary/15 via-card to-primary/10 p-6 shadow-sm backdrop-blur md:p-8"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
              
                <h3 className="text-2xl font-semibold md:text-3xl">
                  Qué hace MiProveedor por vos
                </h3>
                <p className="text-sm text-muted-foreground md:text-base">
                  Del link de pedido al panel central, todo pensado para que el flujo sea rápido y sin fricción.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Send className="h-4 w-4 text-primary" />
                Link → Pedido → Comprobante → Pago → Historial
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {featureHighlights.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="group relative overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 transition group-hover:opacity-100" />
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.text}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="relative rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary">
                <span className="rounded-full bg-primary/15 px-3 py-1">Creado</span>
                <ArrowRight className="h-4 w-4" />
                <span className="rounded-full bg-primary/15 px-3 py-1">Confirmado</span>
                <ArrowRight className="h-4 w-4" />
                <span className="rounded-full bg-primary/15 px-3 py-1">Enviado</span>
                <ArrowRight className="h-4 w-4" />
                <span className="rounded-full bg-primary/15 px-3 py-1">Entregado</span>
                <ArrowRight className="h-4 w-4" />
                <span className="rounded-full bg-primary/15 px-3 py-1">Pagado</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Toda la trazabilidad en un solo panel, con remitos listos para imprimir y comprobantes guardados.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="como-funciona"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur md:p-8"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit">
                  Cómo funciona (en 3 pasos)
                </Badge>
                <h3 className="text-2xl font-semibold md:text-3xl">
                  Cómo funciona (en 3 pasos)
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Claro, simple y directo
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {howItWorks.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="group relative overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 transition group-hover:opacity-100" />
                    <div className="relative mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold">
                      {index + 1}. {item.title}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="overflow-hidden rounded-3xl border border-border/60 bg-linear-to-r from-card via-background to-primary/5 p-6 shadow-sm backdrop-blur md:p-8"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Badge variant="secondary" className="w-fit">
                  Antes vs Después
                </Badge>
                <h3 className="text-2xl font-semibold md:text-3xl">
                  Antes vs Después de MiProveedor.app
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
                Más control, menos ruido
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-amber-500/10" />
                <div className="relative flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200">
                    <MessageCircleWarning className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-200">
                      Antes
                    </p>
                    <p className="text-base font-semibold">Caos en WhatsApp</p>
                  </div>
                </div>
                <ul className="relative mt-3 space-y-2 text-sm text-muted-foreground">
                  {beforeList.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500/70" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-primary/10" />
                <div className="relative flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                    <PanelsTopLeft className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                      Después
                    </p>
                    <p className="text-base font-semibold">Plataforma centralizada</p>
                  </div>
                </div>
                <ul className="relative mt-3 space-y-2 text-sm text-muted-foreground">
                  {afterList.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-border/60 bg-linear-to-r from-primary/10 via-card to-secondary/20 p-6 shadow-sm backdrop-blur"
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
