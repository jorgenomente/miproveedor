"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Clock,
  Mail,
  Link as LinkIcon,
  Pencil,
  Phone,
  RefreshCcw,
  Save,
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
  updateProvider,
  type UpdateProviderResult,
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
  const [updateState, startUpdate] = useTransition();
  const [updateResult, setUpdateResult] = useState<UpdateProviderResult | null>(null);
  const [origin, setOrigin] = useState("");
  const [deleteResult, setDeleteResult] = useState<DeleteProviderResult | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const [deleting, setDeleting] = useState<ProviderRow | null>(null);

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

  useEffect(() => {
    if (editing) {
      setEditName(editing.name);
      setEditEmail(editing.contact_email ?? "");
      setEditPhone(editing.contact_phone ?? "");
      setEditActive(Boolean(editing.is_active ?? true));
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
                Crea el proveedor + usuario owner y genera link de invitación desde Supabase Auth.
              </p>
            </CardHeader>
            <CardContent>
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
                    <Label htmlFor="email">Email del owner</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="owner@proveedor.com"
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
                    <Input
                      id="cuit"
                      name="cuit"
                      placeholder="30-12345678-9"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="submit" disabled={pending}>
                    Crear proveedor
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>

              <Separator className="my-4" />
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: result ? 1 : 0.6, y: 0 }}
                className="space-y-3 rounded-xl border border-border/70 bg-secondary/40 p-4"
              >
                <p className="text-sm font-semibold">Resultado</p>
                {result?.success ? (
                  <div className="space-y-2 text-sm">
                    <p>{result.message}</p>
                    <p className="text-muted-foreground">
                      Envia este link al owner para setear su contraseña:
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <a href={result.setPasswordLink} target="_blank" rel="noreferrer">
                        {result.setPasswordLink}
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Se usa Supabase Auth (service role). Si necesitas reenviar, vuelve a generar link.
                    </p>
                  </div>
                ) : result ? (
                  <div className="space-y-1 text-sm text-destructive">
                    {result.errors.map((error) => (
                      <p key={error}>{error}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Completa el formulario para generar el proveedor.
                  </p>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </main>

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
