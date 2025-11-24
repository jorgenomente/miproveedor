"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  BellRing,
  Clock,
  Mail,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Phone,
  RefreshCcw,
  Save,
  KeyRound,
  Pause,
  Play,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  createProvider,
  deleteProvider,
  listProviders,
  type CreateProviderResult,
  type DeleteProviderResult,
  type ProviderRow,
  sendPasswordReset,
  type ResetPasswordResult,
  updateProvider,
  type UpdateProviderResult,
  toggleSubscription,
  type ToggleSubscriptionResult,
  listProviderPayments,
  type ProviderPaymentRow,
} from "./actions";

export default function AdminProvidersPage() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CreateProviderResult | null>(null);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProviderRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editSubscribedAt, setEditSubscribedAt] = useState("");
  const [editRenewsAt, setEditRenewsAt] = useState("");
  const [updateState, startUpdate] = useTransition();
  const [updateResult, setUpdateResult] = useState<UpdateProviderResult | null>(null);
  const [origin, setOrigin] = useState("");
  const [deleteResult, setDeleteResult] = useState<DeleteProviderResult | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const [deleting, setDeleting] = useState<ProviderRow | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<Record<string, ResetPasswordResult>>({});
  const [resetState, startReset] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleResult, setToggleResult] = useState<Record<string, ToggleSubscriptionResult>>({});
  const [toggleState, startToggle] = useTransition();
  const [paymentsFor, setPaymentsFor] = useState<ProviderRow | null>(null);
  const [paymentsByProvider, setPaymentsByProvider] = useState<Record<string, ProviderPaymentRow[]>>({});
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadProviders = useCallback(async () => {
    setLoadingProviders(true);
    setProvidersError(null);
    const response = await listProviders();

    if (response.success) {
      setProviders(response.providers);
    } else {
      setProvidersError(response.errors.join("\n"));
    }
    setLoadingProviders(false);
  }, []);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const toDateTimeLocal = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
    const local = new Date(date.getTime() - tzOffsetMs);
    return local.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (editing) {
      setEditName(editing.name);
      setEditEmail(editing.contact_email ?? "");
      setEditPhone(editing.contact_phone ?? "");
      setEditActive(Boolean(editing.is_active ?? true));
      setEditSubscribedAt(toDateTimeLocal(editing.subscribed_at));
      setEditRenewsAt(toDateTimeLocal(editing.renews_at));
      setUpdateResult(null);
    }
  }, [editing]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: (formData.get("name") as string) ?? "",
      slug: (formData.get("slug") as string) ?? "",
      email: (formData.get("email") as string) ?? "",
      phone: (formData.get("phone") as string) ?? "",
      address: (formData.get("address") as string) ?? "",
      cuit: (formData.get("cuit") as string) ?? "",
    };

    startTransition(async () => {
      const response = await createProvider(payload);
      setResult(response);
      if (response.success) {
        await loadProviders();
      }
    });
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;

    startUpdate(async () => {
      const response = await updateProvider({
        id: editing.id,
        name: editName.trim(),
        contact_email: editEmail.trim(),
        contact_phone: editPhone.trim(),
        is_active: editActive,
        subscribed_at: editSubscribedAt ? new Date(editSubscribedAt).toISOString() : undefined,
        renews_at: editRenewsAt ? new Date(editRenewsAt).toISOString() : undefined,
      });
      setUpdateResult(response);
      if (response.success) {
        await loadProviders();
        setEditing(null);
      }
    });
  };

  const handleDelete = (provider: ProviderRow) => {
    setDeleteResult(null);
    startDelete(async () => {
      const response = await deleteProvider({ id: provider.id });
      setDeleteResult(response);
      if (response.success) {
        await loadProviders();
        setDeleting(null);
      }
    });
  };

  const handleResetPassword = (provider: ProviderRow) => {
    setResettingId(provider.id);
    startReset(async () => {
      const response = await sendPasswordReset({ providerId: provider.id });
      setResetResult((prev) => ({ ...prev, [provider.id]: response }));
      setResettingId(null);
    });
  };

  const handleToggleSubscription = (provider: ProviderRow) => {
    startToggle(async () => {
      setTogglingId(provider.id);
      const response = await toggleSubscription({ id: provider.id });
      setToggleResult((prev) => ({ ...prev, [provider.id]: response }));
      if (response.success) {
        await loadProviders();
      }
      setTogglingId(null);
    });
  };

  const handleOpenPayments = (provider: ProviderRow) => {
    setPaymentsFor(provider);
    setPaymentsError(null);
    if (paymentsByProvider[provider.id]) return;

    setLoadingPayments(true);
    void listProviderPayments({ providerId: provider.id }).then((response) => {
      if (response.success) {
        setPaymentsByProvider((prev) => ({ ...prev, [provider.id]: response.payments }));
      } else {
        setPaymentsError(response.errors.join("\n"));
      }
      setLoadingPayments(false);
    });
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "Fecha no disponible";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Fecha no disponible";
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const activeCount = providers.filter((provider) => provider.is_active).length;
  const currentPayments = paymentsFor ? paymentsByProvider[paymentsFor.id] ?? [] : [];

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/50 px-4 pb-12 pt-8 sm:px-8">
      <main className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link href="/app">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
          <span>/</span>
          <Badge variant="secondary">Admin · Proveedores</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Proveedores creados</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Revisa y refresca los proveedores ya dados de alta.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {activeCount} activos
                  </Badge>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => void loadProviders()}
                    disabled={loadingProviders}
                    aria-label="Refrescar listado de proveedores"
                  >
                    <RefreshCcw className={`h-4 w-4 ${loadingProviders ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {providersError ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {providersError}
                </div>
              ) : null}

              {loadingProviders ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((item) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: item * 0.05 }}
                      className="rounded-xl border border-border/60 bg-secondary/30 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : providers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0.7, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border/70 bg-secondary/30 p-4 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    <span>Aún no hay registros.</span>
                  </div>
                  <p className="text-muted-foreground">
                    Crea un proveedor con el formulario y aparecerá aquí automáticamente.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {providers.map((provider, index) => (
                    <motion.div
                      key={provider.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="relative flex items-start justify-between gap-4">
                          <div className="flex flex-1 items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold leading-tight">{provider.name}</p>
                                <Badge variant="secondary">/{provider.slug}</Badge>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {provider.contact_email ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5" />
                                    {provider.contact_email}
                                  </span>
                                ) : null}
                                {provider.contact_phone ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5" />
                                    {provider.contact_phone}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge
                                  variant={
                                    provider.subscription_status === "paused"
                                      ? "outline"
                                      : provider.subscription_status === "canceled"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {provider.subscription_status === "paused"
                                    ? "Suscripción pausada"
                                    : provider.subscription_status === "canceled"
                                      ? "Suscripción cancelada"
                                      : "Suscripción activa"}
                                </Badge>
                                <span>Suscripto desde: {formatDate(provider.subscribed_at)}</span>
                                <span>Renueva el: {formatDate(provider.renews_at)}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {provider.pending_payments && provider.pending_payments > 0 ? (
                                  <div className="inline-flex items-center gap-2 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-100">
                                    <BellRing className="h-4 w-4" />
                                    {provider.pending_payments} pago(s) para revisar
                                  </div>
                                ) : provider.payments_total && provider.payments_total > 0 ? (
                                  <Badge variant="outline" className="text-[11px]">
                                    {provider.payments_total} pago(s) registrados
                                  </Badge>
                                ) : null}
                                {provider.last_payment_period ? (
                                  <Badge variant="secondary" className="text-[11px]">
                                    Último: {provider.last_payment_period}
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={provider.is_active ? "default" : "outline"}>
                              {provider.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(provider.created_at)}
                            </span>
                            {provider.subscription_status === "paused" && provider.paused_at ? (
                              <span className="text-[11px] text-destructive">
                                Pausado {formatDate(provider.paused_at)}
                              </span>
                            ) : null}
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditing(provider)}
                              className="mt-1"
                            >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                            </Button>
                            <div className="grid w-full gap-2 sm:min-w-[240px]">
                            <Button
                              size="sm"
                              variant={provider.subscription_status === "paused" ? "default" : "outline"}
                              className="w-full justify-center"
                              onClick={() => handleToggleSubscription(provider)}
                                disabled={
                                  (toggleState && togglingId === provider.id) ||
                                  provider.subscription_status === "canceled"
                                }
                              >
                                {provider.subscription_status === "paused" ? (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Activar suscripción
                                  </>
                                ) : (
                                  <>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pausar suscripción
                                  </>
                                )}
                              </Button>
                              {(() => {
                                const toggleEntry = toggleResult[provider.id];
                                if (!toggleEntry) return null;
                                return (
                                  <p
                                    className={`text-[11px] ${
                                      toggleEntry.success ? "text-emerald-600" : "text-destructive"
                                    }`}
                                  >
                                    {toggleEntry.success
                                      ? toggleEntry.message
                                      : toggleEntry.errors.join("\n")}
                                  </p>
                                );
                              })()}
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full justify-center"
                                onClick={() => handleOpenPayments(provider)}
                              >
                                <Receipt className="mr-2 h-4 w-4" />
                                Ver historial de pagos
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full justify-center"
                                onClick={() => {
                                const url = `${origin || ""}/${provider.slug}/<slug-de-cliente>`;
                                navigator.clipboard
                                  .writeText(url)
                                  .catch(() => {
                                    // ignore copy errors
                                  });
                              }}
                            >
                              <LinkIcon className="mr-2 h-4 w-4" />
                              Copiar link base de pedidos
                            </Button>
                            <Button asChild size="sm" variant="secondary" className="justify-center">
                              <Link href={`/app/${provider.slug}`} target="_blank">
                                <LinkIcon className="mr-2 h-4 w-4" />
                                Ir al panel / pedidos
                              </Link>
                            </Button>
                            <div className="space-y-1">
                              {(() => {
                                const resetEntry = resetResult[provider.id];
                                if (!resetEntry) return null;
                                return (
                                  <p
                                    className={`text-[11px] ${
                                      resetEntry.success ? "text-emerald-600" : "text-destructive"
                                    }`}
                                  >
                                    {resetEntry.success
                                      ? resetEntry.message
                                      : resetEntry.errors.join("\n")}
                                  </p>
                                );
                              })()}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full justify-center"
                                onClick={() => handleResetPassword(provider)}
                                disabled={resetState && resettingId === provider.id}
                              >
                                <KeyRound className="mr-2 h-4 w-4" />
                                Reenviar restablecer contraseña
                              </Button>
                            </div>
                            <AlertDialog
                              open={deleting?.id === provider.id}
                              onOpenChange={(open) => {
                                if (!open) {
                                  setDeleting(null);
                                  setDeleteResult(null);
                                }
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="w-full justify-center"
                                  onClick={() => {
                                    setDeleting(provider);
                                    setDeleteResult(null);
                                  }}
                                >
                                  Eliminar proveedor
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar {provider.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Se eliminará este proveedor y sus usuarios asociados si no existen
                                    pedidos, productos o tiendas vinculados. Esta acción no se puede
                                    deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                {deleteResult ? (
                                  <div
                                    className={`text-sm ${
                                      deleteResult.success ? "text-emerald-600" : "text-destructive"
                                    }`}
                                  >
                                    {deleteResult.success
                                      ? deleteResult.message
                                      : deleteResult.errors.join("\n")}
                                  </div>
                                ) : null}
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    onClick={() => {
                                      setDeleting(null);
                                      setDeleteResult(null);
                                    }}
                                  >
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(provider)}
                                    disabled={pendingDelete}
                                  >
                                    Confirmar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">
                Alta manual de proveedor (Supabase)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Crea el proveedor + usuario principal y genera link de invitación desde Supabase Auth.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-secondary/30 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Alta manual desde Supabase</p>
                  <p className="text-sm text-muted-foreground">
                    Crea el proveedor + usuario principal y genera link de invitación sin salir de esta vista.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => void loadProviders()}>
                    Refrescar lista
                    <RefreshCcw className="ml-2 h-4 w-4" />
                  </Button>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    Alta manual de proveedor
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alta manual de proveedor</DialogTitle>
            <DialogDescription>
              Completa los datos para crear el proveedor, su usuario principal y enviar el correo de acceso.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" placeholder="Nombre del negocio" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="negocio-slug"
                  required
                  pattern="^[a-z0-9-]+$"
                  title="Solo minúsculas, números y guiones"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email del proveedor</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contacto@proveedor.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+54 9 11 4444-8899"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Av. Siempre Viva 123, CABA"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuit">CUIT</Label>
                <Input id="cuit" name="cuit" placeholder="30-12345678-9" required />
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Crear proveedor
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>

          <Separator className="my-4" />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: result ? 1 : 0.6, y: 0 }}
            className="space-y-3 rounded-xl border border-border/70 bg-secondary/40 p-4"
          >
            <p className="text-sm font-semibold">Resultado</p>
            {result?.success ? (
              <div className="space-y-3 text-sm">
                <p>
                  {result.message}{" "}
                  {result.resetEmailSent ? "Se envió un correo de restablecimiento automáticamente." : ""}
                </p>
                {result.warning ? (
                  <div className="space-y-1 rounded-lg border border-amber-500/50 bg-amber-50/80 p-3 text-amber-800 shadow-sm dark:border-amber-400/40 dark:bg-amber-950/30 dark:text-amber-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wide">
                      Link de invitación pendiente
                    </p>
                    <p>{result.warning}</p>
                  </div>
                ) : null}
                {result.setPasswordLink ? (
                  <>
                    <p className="text-muted-foreground">
                      Envía este link al proveedor para setear su contraseña si aún no usó el correo:
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <a href={result.setPasswordLink} target="_blank" rel="noreferrer">
                        {result.setPasswordLink}
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Se usa Supabase Auth (service role). También se envió un correo de restablecimiento automático.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    El proveedor quedó creado y el usuario ya existe. Genera un link de reset de contraseña manual
                    desde Supabase Auth si necesita acceder.
                  </p>
                )}
              </div>
            ) : result ? (
              <div className="space-y-1 text-sm text-destructive">
                {result.errors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Completa el formulario para generar el proveedor.</p>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(paymentsFor)}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentsFor(null);
            setPaymentsError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pagos de {paymentsFor?.name ?? "—"}</DialogTitle>
            <DialogDescription>
              Comprobantes reportados por el proveedor. Haz clic para abrir el archivo.
            </DialogDescription>
          </DialogHeader>

          {paymentsError ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
              {paymentsError}
            </div>
          ) : null}

          {loadingPayments ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando pagos...
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {currentPayments.length ? (
                currentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-secondary/30 px-3 py-2"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-tight">{payment.period_label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {payment.status === "pending"
                          ? "Pendiente de revisión"
                          : payment.status === "approved"
                            ? "Aprobado"
                            : "Revisar nuevamente"}
                        {" · "}
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a href={payment.proof_url} target="_blank" rel="noreferrer">
                        Abrir comprobante
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border/70 bg-secondary/30 p-3 text-sm text-muted-foreground">
                  Aún no hay pagos registrados para este proveedor.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar proveedor</DialogTitle>
            <DialogDescription>Actualiza datos de contacto y estado.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleUpdate}>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  placeholder="correo@proveedor.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">WhatsApp</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editPhone}
                  onChange={(event) => setEditPhone(event.target.value)}
                  placeholder="+54 9 ..."
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-subscribed-at">Suscripto desde</Label>
                <Input
                  id="edit-subscribed-at"
                  type="datetime-local"
                  value={editSubscribedAt}
                  onChange={(event) => setEditSubscribedAt(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">Edita la fecha de alta real.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-renews-at">Renueva el</Label>
                <Input
                  id="edit-renews-at"
                  type="datetime-local"
                  value={editRenewsAt}
                  onChange={(event) => setEditRenewsAt(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">Próxima renovación/facturación.</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 px-3 py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Activo</p>
                <p className="text-xs text-muted-foreground">
                  Controla si el proveedor puede usarse en los flujos.
                </p>
              </div>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>

            {updateResult?.success === false ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
                {updateResult.errors.join("\n")}
              </div>
            ) : null}

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateState}>
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
