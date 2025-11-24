"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Banknote, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { savePaymentSettings, type PaymentSettings, type ProviderRow } from "./actions";

type Props = {
  providerSlug: string;
  provider: ProviderRow;
  initialSettings: PaymentSettings;
};

export function PaymentsClient({ providerSlug, provider, initialSettings }: Props) {
  const [settings, setSettings] = useState<PaymentSettings>(initialSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const paymentOptions = useMemo(
    () => [
      { key: "cashEnabled", label: "Efectivo", description: "El cliente paga al recibir o retirar.", icon: <Banknote className="h-4 w-4" /> },
      { key: "transferEnabled", label: "Transferencia", description: "Mostrar alias/CBU y solicitar comprobante.", icon: <CreditCard className="h-4 w-4" /> },
    ],
    [],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (!settings.cashEnabled && !settings.transferEnabled) {
      setError("Activa al menos un método de pago.");
      return;
    }
    startTransition(async () => {
      const response = await savePaymentSettings({
        providerSlug,
        cashEnabled: settings.cashEnabled,
        transferEnabled: settings.transferEnabled,
        transferAlias: settings.transferAlias ?? null,
        transferCbu: settings.transferCbu ?? null,
        transferNotes: settings.transferNotes ?? null,
      });

      if (response.success) {
        setMessage(response.message);
        setSettings(response.settings);
      } else {
        setError(response.errors.join("\n"));
      }
    });
  };

  const previewNotes = settings.transferNotes?.trim()
    ? settings.transferNotes.trim()
    : "Recuerda adjuntar el comprobante si elegís transferencia.";

  return (
    <div className="relative isolate min-h-screen bg-linear-to-b from-background via-background to-secondary/50 px-4 pb-14 pt-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-10 top-8 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        <motion.div
          className="absolute -right-6 bottom-10 h-56 w-56 rounded-full bg-foreground/5 blur-3xl"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.08 }}
        />
      </div>

      <main className="relative mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link href={providerSlug ? `/app/${providerSlug}` : "/app"}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
          <span>/</span>
          <Badge variant="secondary">Mis alias y pagos</Badge>
        </div>

        <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Configura los métodos de pago</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Lo que completes aquí se mostrará en el link público de pedidos ({provider.slug}/{"{tu tienda}"}).
                </p>
              </div>
              <Badge variant="outline" className="uppercase">{provider.slug}</Badge>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">Mobile-first</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Controlas qué métodos se muestran
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1.2fr,0.9fr]">
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/30 p-4">
                {paymentOptions.map((option) => (
                  <div key={option.key} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-card/70 px-3 py-2">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-primary">{option.icon}</span>
                      <div>
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings[option.key as keyof PaymentSettings] as boolean}
                      onCheckedChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          [option.key]: value,
                        }))
                      }
                      aria-label={`Habilitar ${option.label}`}
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="alias">Alias (opcional)</Label>
                  <Input
                    id="alias"
                    placeholder="mi.alias.banco"
                    value={settings.transferAlias ?? ""}
                    onChange={(event) => setSettings((prev) => ({ ...prev, transferAlias: event.target.value }))}
                    disabled={!settings.transferEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cbu">CBU / CVU (opcional)</Label>
                  <Input
                    id="cbu"
                    placeholder="0000000000000000000000"
                    value={settings.transferCbu ?? ""}
                    onChange={(event) => setSettings((prev) => ({ ...prev, transferCbu: event.target.value }))}
                    disabled={!settings.transferEnabled}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas para transferencias</Label>
                <Textarea
                  id="notes"
                  placeholder="Ej: Envía el comprobante por aquí, horario de acreditación, etc."
                  value={settings.transferNotes ?? ""}
                  onChange={(event) => setSettings((prev) => ({ ...prev, transferNotes: event.target.value }))}
                  rows={4}
                  disabled={!settings.transferEnabled}
                />
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={pending}>
                  {pending ? "Guardando..." : "Guardar cambios"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Los métodos desactivados no se mostrarán en el formulario público.
                </p>
              </div>
            </form>

            <div className="space-y-3">
              <Card className="border-border/60 bg-card/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Así lo verá tu cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    {settings.cashEnabled ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Banknote className="h-3.5 w-3.5" />
                        Efectivo
                      </Badge>
                    ) : null}
                    {settings.transferEnabled ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" />
                        Transferencia
                      </Badge>
                    ) : null}
                    {!settings.cashEnabled && !settings.transferEnabled ? (
                      <Badge variant="destructive">Sin métodos activos</Badge>
                    ) : null}
                  </div>
                  {settings.transferEnabled ? (
                    <div className="space-y-2 rounded-lg border border-border/60 bg-secondary/30 p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Datos de transferencia</p>
                      {settings.transferAlias ? (
                        <p className="text-sm font-semibold">Alias: {settings.transferAlias}</p>
                      ) : null}
                      {settings.transferCbu ? (
                        <p className="text-sm font-semibold">CBU/CVU: {settings.transferCbu}</p>
                      ) : null}
                      {!settings.transferAlias && !settings.transferCbu ? (
                        <p className="text-xs text-muted-foreground">Sin alias/CBU cargados.</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">{previewNotes}</p>
                    </div>
                  ) : null}
                  <Separator />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    El cliente verá estas opciones al elegir método de pago.
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
