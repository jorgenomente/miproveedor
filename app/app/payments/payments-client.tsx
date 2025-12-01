"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Banknote, ChevronDown, ChevronUp, CreditCard, Plus, ShieldCheck, Trash2 } from "lucide-react";
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
  const [settings, setSettings] = useState<PaymentSettings>(() => ({
    ...initialSettings,
    transferProfiles: initialSettings.transferProfiles ?? [],
  }));
  const [openProfile, setOpenProfile] = useState<string | null>(initialSettings.transferProfiles?.[0]?.id ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const paymentOptions = useMemo(
    () => [
      { key: "cashEnabled", label: "Efectivo", description: "El cliente paga al recibir o retirar.", icon: <Banknote className="h-4 w-4" /> },
      {
        key: "transferEnabled",
        label: "Transferencia",
        description: "Activa transferencias y administra tus alias/CBU visibles para clientes.",
        icon: <CreditCard className="h-4 w-4" />,
      },
    ],
    [],
  );

  const addTransferProfile = () => {
    const generatedId = `temp-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    setSettings((prev) => ({
      ...prev,
      transferProfiles: [
        ...(prev.transferProfiles ?? []),
        {
          id: generatedId,
          label: prev.transferProfiles?.length ? "Nueva cuenta" : "Cuenta principal",
          alias: "",
          cbu: "",
          extraInfo: "",
          isActive: true,
        },
      ],
    }));
    setOpenProfile(generatedId);
  };

  const updateProfile = (id: string, changes: Partial<PaymentSettings["transferProfiles"][number]>) => {
    setSettings((prev) => ({
      ...prev,
      transferProfiles: (prev.transferProfiles ?? []).map((profile) =>
        profile.id === id ? { ...profile, ...changes } : profile,
      ),
    }));
  };

  const removeProfile = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      transferProfiles: (prev.transferProfiles ?? []).filter((profile) => profile.id !== id),
    }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (!settings.cashEnabled && !settings.transferEnabled) {
      setError("Activa al menos un método de pago.");
      return;
    }

    const cleanedProfiles =
      settings.transferProfiles
        ?.map((profile) => {
          const alias = profile.alias?.trim() ?? "";
          const cbu = profile.cbu?.trim() ?? "";
          return {
            ...profile,
            id: profile.id?.startsWith("temp-") ? undefined : profile.id,
            label: profile.label?.trim() || null,
            alias: alias.length ? alias : null,
            cbu: cbu.length ? cbu : null,
            extraInfo: profile.extraInfo?.trim() || null,
            isActive: profile.isActive !== false,
          };
        })
        .filter((profile) => profile.alias || profile.cbu) ?? [];

    if (settings.transferEnabled && cleanedProfiles.filter((profile) => profile.isActive).length === 0) {
      setError("Activa al menos una cuenta de transferencia o apaga el método.");
      return;
    }

    startTransition(async () => {
      const response = await savePaymentSettings({
        providerSlug,
        cashEnabled: settings.cashEnabled,
        transferEnabled: settings.transferEnabled,
        transferNotes: settings.transferNotes ?? null,
        transferProfiles: cleanedProfiles,
      });

      if (response.success) {
        setMessage(response.message);
        setSettings({
          ...response.settings,
          transferProfiles: response.settings.transferProfiles ?? [],
        });
      } else {
        setError(response.errors.join("\n"));
      }
    });
  };

  const previewNotes = settings.transferNotes?.trim()
    ? settings.transferNotes.trim()
    : "Recuerda adjuntar el comprobante si elegís transferencia.";

  const activeTransferProfiles = useMemo(
    () =>
      (settings.transferProfiles ?? []).filter((profile) => {
        const hasData = Boolean(profile.alias?.trim() || profile.cbu?.trim());
        return profile.isActive && hasData;
      }),
    [settings.transferProfiles],
  );

  const transferAvailable = settings.transferEnabled && activeTransferProfiles.length > 0;

  return (
    <div className="relative isolate min-h-screen bg-[color:var(--muted)] px-4 pb-14 pt-8 sm:px-8">
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

        <Card className="border-[color:var(--border)] bg-card/95 shadow-sm backdrop-blur">
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
            <form className="space-y-4" onSubmit={submit} id="payment-settings-form">
              <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-4">
                {paymentOptions.map((option) => (
                  <div key={option.key} className="flex items-start justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-card/95 px-3 py-2">
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

                {settings.transferEnabled ? (
                  <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">Perfiles de transferencia</p>
                        <p className="text-xs text-muted-foreground">
                          Carga varios alias/CBU y decide cuáles se muestran. El toggle general de transferencia apaga todo.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={addTransferProfile}
                        disabled={!settings.transferEnabled}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Nuevo perfil
                      </Button>
                    </div>

                    {settings.transferProfiles?.length ? (
                      <div className="space-y-3">
                        {settings.transferProfiles.map((profile, index) => {
                          const isOpen = openProfile === profile.id;
                          const isPrimary = index === 0;
                          const displayLabel =
                            profile.label?.trim() || (isPrimary ? "Cuenta principal" : `Cuenta ${index + 1}`);
                          return (
                            <motion.div
                              key={profile.id}
                              className="rounded-xl border border-[color:var(--border)] bg-card/95 shadow-xs"
                              layout
                            >
                              <div
                                role="button"
                                tabIndex={0}
                                className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left"
                                onClick={() => setOpenProfile((prev) => (prev === profile.id ? null : profile.id))}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    setOpenProfile((prev) => (prev === profile.id ? null : profile.id));
                                  }
                                }}
                              >
                                <div className="flex flex-1 flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold">{displayLabel}</p>
                                    {isPrimary ? (
                                      <Badge variant="secondary" className="text-[10px] uppercase">
                                        Principal
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {profile.alias ? <span>Alias: {profile.alias}</span> : null}
                                    {profile.cbu ? <span>CBU/CVU: {profile.cbu}</span> : null}
                                    {!profile.alias && !profile.cbu ? <span>Sin alias/CBU cargados</span> : null}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-1 text-xs">
                                    <span className="text-muted-foreground">Activo</span>
                                    <Switch
                                      checked={settings.transferEnabled && profile.isActive}
                                      onCheckedChange={(value) => updateProfile(profile.id, { isActive: value })}
                                      disabled={!settings.transferEnabled}
                                      aria-label={`Activar perfil de transferencia ${index + 1}`}
                                    />
                                  </div>
                                  <span className="text-muted-foreground">
                                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </span>
                                </div>
                              </div>

                              {isOpen ? (
                                <div className="space-y-3 border-t border-[color:var(--border)] bg-card/95 p-3">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label htmlFor={`label-${profile.id}`}>Nombre interno</Label>
                                      <Input
                                        id={`label-${profile.id}`}
                                        placeholder="Banco / alias visible"
                                        value={profile.label ?? ""}
                                        onChange={(event) => updateProfile(profile.id, { label: event.target.value })}
                                        disabled={!settings.transferEnabled}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`alias-${profile.id}`}>Alias</Label>
                                      <Input
                                        id={`alias-${profile.id}`}
                                        placeholder="mi.alias.banco"
                                        value={profile.alias ?? ""}
                                        onChange={(event) => updateProfile(profile.id, { alias: event.target.value })}
                                        disabled={!settings.transferEnabled}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`cbu-${profile.id}`}>CBU / CVU</Label>
                                      <Input
                                        id={`cbu-${profile.id}`}
                                        placeholder="0000000000000000000000"
                                        value={profile.cbu ?? ""}
                                        onChange={(event) => updateProfile(profile.id, { cbu: event.target.value })}
                                        disabled={!settings.transferEnabled}
                                      />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                      <Label htmlFor={`extra-${profile.id}`}>Notas visibles de esta cuenta</Label>
                                      <Input
                                        id={`extra-${profile.id}`}
                                        placeholder="Ej: A nombre de / Banco / CUIT"
                                        value={profile.extraInfo ?? ""}
                                        onChange={(event) => updateProfile(profile.id, { extraInfo: event.target.value })}
                                        disabled={!settings.transferEnabled}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs text-muted-foreground">
                                      Los cambios se guardan junto con el botón principal de “Guardar cambios”.
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeProfile(profile.id)}
                                        disabled={pending}
                                        aria-label="Eliminar perfil"
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                      <Button type="submit" form="payment-settings-form" size="sm" disabled={pending}>
                                        Guardar perfil
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--muted)] p-4 text-sm text-muted-foreground">
                        Agrega tu primer alias o CBU para mostrar en el checkout de transferencias.
                      </div>
                    )}
                  </div>
                ) : null}
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
              <Card className="border-[color:var(--border)] bg-card/95 shadow-sm">
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
                    {transferAvailable ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" />
                        Transferencia ({activeTransferProfiles.length})
                      </Badge>
                    ) : settings.transferEnabled ? (
                      <Badge variant="outline" className="flex items-center gap-1 border-destructive/60 text-destructive">
                        <CreditCard className="h-3.5 w-3.5" />
                        Transferencia sin cuentas
                      </Badge>
                    ) : null}
                    {!settings.cashEnabled && !settings.transferEnabled ? (
                      <Badge variant="destructive">Sin métodos activos</Badge>
                    ) : null}
                  </div>
                  {transferAvailable ? (
                    <div className="space-y-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Cuentas de transferencia</p>
                      <div className="space-y-2">
                        {activeTransferProfiles.map((profile) => (
                          <div
                            key={profile.id}
                            className="rounded-md border border-[color:var(--border)] bg-card/95 px-3 py-2"
                          >
                            <p className="text-sm font-semibold">
                              {profile.label?.trim() || "Cuenta bancaria"}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {profile.alias ? <span>Alias: {profile.alias}</span> : null}
                              {profile.cbu ? <span>CBU/CVU: {profile.cbu}</span> : null}
                            </div>
                            {profile.extraInfo ? (
                              <p className="text-xs text-muted-foreground">{profile.extraInfo}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{previewNotes}</p>
                    </div>
                  ) : settings.transferEnabled ? (
                    <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--muted)] p-3 text-xs text-muted-foreground">
                      Activa al menos un perfil para mostrar datos de transferencia.
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
