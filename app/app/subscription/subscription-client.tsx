"use client";

import { ChangeEvent, type ReactNode, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Archive,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  Receipt,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createPayment, type PaymentRow, type ProviderInfo } from "./actions";

type Props = {
  providerSlug: string;
  provider: ProviderInfo;
  initialPayments: PaymentRow[];
};

type UploadState = {
  name?: string;
  mimeType?: string;
  size?: number;
};

const statusStyle: Record<
  PaymentRow["status"],
  { badge: string; text: string; icon: ReactNode }
> = {
  pending: {
    badge: "bg-amber-500/15 text-amber-800 dark:text-amber-100 border border-amber-500/30",
    text: "Pendiente de revisión",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  approved: {
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-100 border border-emerald-500/30",
    text: "Pago validado",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  rejected: {
    badge: "bg-destructive/10 text-destructive border border-destructive/30",
    text: "Revisar nuevamente",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
};

function formatDate(value?: string | null) {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function SubscriptionClient({ providerSlug, provider, initialPayments }: Props) {
  const [payments, setPayments] = useState<PaymentRow[]>(initialPayments);
  const [periodLabel, setPeriodLabel] = useState("");
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const statusBadge =
    provider.subscription_status === "paused"
      ? { label: "Suscripción pausada", variant: "outline" as const }
      : provider.subscription_status === "canceled"
        ? { label: "Suscripción cancelada", variant: "destructive" as const }
        : { label: "Suscripción activa", variant: "secondary" as const };

  const nextPaymentHint = useMemo(() => {
    if (!provider.renews_at) return "Sin fecha definida";
    const date = new Date(provider.renews_at);
    if (Number.isNaN(date.getTime())) return "Sin fecha definida";
    return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(date);
  }, [provider.renews_at]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFormError(null);
    setFormSuccess(null);

    if (!file) {
      setProofBase64(null);
      setUploadState(null);
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFormError("El archivo supera los 8MB. Súbelo más liviano.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setProofBase64(result);
        setUploadState({ name: file.name, mimeType: file.type, size: file.size });
      } else {
        setFormError("No pudimos leer el archivo, intenta nuevamente.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!periodLabel.trim()) {
      setFormError("Indica a qué período corresponde el pago.");
      return;
    }

    if (!proofBase64 || !uploadState) {
      setFormError("Sube un comprobante para registrar el pago.");
      return;
    }

    startTransition(async () => {
      const response = await createPayment({
        providerSlug,
        periodLabel: periodLabel.trim(),
        receiptBase64: proofBase64,
        fileName: uploadState.name,
        mimeType: uploadState.mimeType,
      });

      if (!response.success) {
        setFormError(response.errors.join("\n"));
        return;
      }

      setPayments((prev) => [response.payment, ...prev]);
      setFormSuccess(response.message);
      setPeriodLabel("");
      setProofBase64(null);
      setUploadState(null);
      (event.currentTarget as HTMLFormElement).reset();
    });
  };

  return (
    <div className="relative isolate min-h-screen bg-[color:var(--surface)] px-4 pb-12 pt-8 sm:px-8">
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

      <main className="relative mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/app/${providerSlug}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
          <span>/</span>
          <Badge variant="secondary" className="gap-1">
            <CreditCard className="h-3.5 w-3.5" />
            Mi suscripción
          </Badge>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href={`/app/${providerSlug}/subscription/deleted-orders`}>
              <Archive className="h-4 w-4" />
              Pedidos eliminados
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr,0.85fr]">
          <Card className="border-[color:var(--neutral-200)] bg-white shadow-sm backdrop-blur">
            <CardHeader className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Historial de pagos</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Los comprobantes quedan guardados y el admin recibe una alerta inmediata.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    <span>Próxima renovación: {nextPaymentHint}</span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Validación manual por admin
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Receipt className="h-3.5 w-3.5" />
                  {payments.length} pagos
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {payments.length === 0 ? (
                <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[color:var(--neutral-200)] bg-[color:var(--surface)] p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-primary">
                    <Receipt className="h-4 w-4" />
                    <span>Aún no hay comprobantes.</span>
                  </div>
                  <p>Sube el primero para que el admin lo revise.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {payments.map((payment, index) => {
                      const style = statusStyle[payment.status];
                      return (
                        <motion.div
                          key={payment.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ delay: index * 0.03 }}
                          className="group relative overflow-hidden rounded-xl border border-[color:var(--neutral-200)] bg-white p-4 shadow-sm"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="relative flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{payment.period_label}</p>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}>
                                  {style.icon}
                                  {style.text}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">Subido: {formatDate(payment.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button asChild variant="outline" size="sm" className="justify-center">
                                <a href={payment.proof_url} target="_blank" rel="noreferrer">
                                  <FileText className="mr-2 h-4 w-4" />
                                  Ver comprobante
                                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[color:var(--neutral-200)] bg-white shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Registrar un pago</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sube el comprobante y dinos el período facturado. Lo verá el admin en su panel.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="period">Período facturado</Label>
                  <Input
                    id="period"
                    name="period"
                    placeholder="Ej: Mayo 2024"
                    value={periodLabel}
                    onChange={(event) => setPeriodLabel(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof">Comprobante (imagen o PDF)</Label>
                  <label
                    htmlFor="proof"
                    className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[color:var(--neutral-200)] bg-[color:var(--surface)] px-4 py-6 text-center transition hover:border-primary/60 hover:bg-[color:var(--surface)]"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <UploadCloud className="h-4 w-4 text-primary" />
                      Sube archivo (máx 8MB)
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WEBP o PDF. El admin podrá abrirlo al instante.
                    </p>
                    <Input
                      id="proof"
                      name="proof"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  {uploadState ? (
                    <div className="flex items-center justify-between rounded-lg border border-[color:var(--neutral-200)] bg-secondary/20 px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        <div className="text-left">
                          <p className="font-medium leading-tight">{uploadState.name}</p>
                          <p className="text-muted-foreground">
                            {uploadState.mimeType} · {Math.round((uploadState.size ?? 0) / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Listo</Badge>
                    </div>
                  ) : null}
                </div>

                <Separator />

                <div className="space-y-2 rounded-lg border border-[color:var(--neutral-200)] bg-[color:var(--surface)] p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    El equipo revisa cada comprobante
                  </div>
                  <p>
                    Verificamos los pagos manualmente. Si algo falta, te contactaremos al email/WhatsApp del
                    proveedor.
                  </p>
                </div>

                {formError ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
                    {formError}
                  </div>
                ) : null}

                {formSuccess ? (
                  <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2 text-sm text-emerald-700 dark:text-emerald-100">
                    {formSuccess}
                  </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando pago...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Enviar comprobante
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
