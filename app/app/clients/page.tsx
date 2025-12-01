"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Copy,
  ExternalLink,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldPlus,
  Store,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createClient,
  listClients,
  type ClientRow,
  type CreateClientResult,
  updateClient,
  type UpdateClientResult,
} from "./actions";
import { useProviderContext } from "@/components/app/provider-context";

type CopyState = { link: string; copied: boolean };

export type ClientsPageProps = { initialProviderSlug?: string };

export default function ClientsPage({ initialProviderSlug }: ClientsPageProps) {
  const { providerSlug, setProviderSlug } = useProviderContext();
  const activeProviderSlug = providerSlug ?? "";
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateClientResult | null>(null);
  const [pendingCreate, startCreate] = useTransition();
  const [origin, setOrigin] = useState("");
  const [copyState, setCopyState] = useState<CopyState | null>(null);
  const [slugValue, setSlugValue] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [editValues, setEditValues] = useState({
    name: "",
    slug: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
  });
  const [editSlugValue, setEditSlugValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editResult, setEditResult] = useState<UpdateClientResult | null>(null);
  const [pendingEdit, startEdit] = useTransition();

  useEffect(() => {
    if (initialProviderSlug && initialProviderSlug !== activeProviderSlug) {
      void setProviderSlug(initialProviderSlug, { lock: true });
    }
  }, [activeProviderSlug, initialProviderSlug, setProviderSlug]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const loadClients = useCallback(
    async (slug: string) => {
      if (!slug) return;
      setLoadingClients(true);
      setClientsError(null);
      const response = await listClients(slug);
      if (response.success) {
        setClients(response.clients);
      } else {
        setClientsError(response.errors.join("\n"));
      }
      setLoadingClients(false);
    },
    [],
  );

  useEffect(() => {
    void loadClients(activeProviderSlug);
  }, [activeProviderSlug, loadClients]);

  useEffect(() => {
    if (!createDialogOpen) {
      setFormError(null);
      setSlugError(null);
      setResult(null);
      setSlugValue("");
    }
  }, [createDialogOpen]);

  useEffect(() => {
    if (!editDialogOpen) {
      setEditingClient(null);
      setEditError(null);
      setEditResult(null);
      setEditValues({
        name: "",
        slug: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        address: "",
      });
      setEditSlugValue("");
    }
  }, [editDialogOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSlugError(null);
    setFormError(null);
    setResult(null);
    const formData = new FormData(event.currentTarget);
    const payload = {
      providerSlug: activeProviderSlug,
      name: (formData.get("name") as string) ?? "",
      slug: (formData.get("slug") as string) ?? "",
      contactName: (formData.get("contactName") as string) ?? "",
      contactPhone: (formData.get("contactPhone") as string) ?? "",
      contactEmail: (formData.get("contactEmail") as string) ?? "",
      address: (formData.get("address") as string) ?? "",
    };
    startCreate(async () => {
      const response = await createClient(payload);
      setResult(response);
      if (response.success) {
        await loadClients(activeProviderSlug);
        (event.target as HTMLFormElement).reset();
        setSlugValue("");
        setSlugError(null);
        setFormError(null);
      } else {
        const slugMessage = response.errors.find((error) => /slug/i.test(error));
        if (slugMessage) setSlugError(slugMessage);
        const firstError = response.errors[0] ?? null;
        if (firstError) setFormError(firstError);
      }
    });
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingClient) return;
    setEditError(null);
    setEditResult(null);
    startEdit(async () => {
      const response = await updateClient({
        id: editingClient.id,
        providerSlug: activeProviderSlug,
        name: editValues.name.trim(),
        slug: editValues.slug.trim(),
        contactName: editValues.contactName.trim(),
        contactPhone: editValues.contactPhone.trim(),
        contactEmail: editValues.contactEmail.trim(),
        address: editValues.address.trim(),
      });
      setEditResult(response);
      if (response.success) {
        await loadClients(activeProviderSlug);
        setEditDialogOpen(false);
      } else {
        setEditError(response.errors[0] ?? "No se pudo actualizar.");
      }
    });
  };

  const buildOrderLink = (client: ClientRow) => {
    const base = origin || "https://miproveedor.app";
    return `${base}/${activeProviderSlug}/${client.slug}`;
  };

  const handleCopyLink = (client: ClientRow) => {
    const link = buildOrderLink(client);
    setCopyState({ link, copied: true });
    navigator.clipboard.writeText(link).catch(() => {
      setCopyState({ link, copied: false });
    });
    setTimeout(() => setCopyState(null), 1600);
  };

  const buildWhatsappLink = (client: ClientRow) => {
    const phone = (client.contact_phone || "").replace(/[^\d]/g, "");
    if (!phone) return null;
    const link = buildOrderLink(client);
    const message =
      "Hola! Te dejo tu link de acceso " +
      link +
      " lo puedes usar cada vez que necesites hacer un pedido. Quedamos disponibles ante cualquier duda. gracias!";
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const sanitizeSlugInput = (value: string) =>
    value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const reinforceSlug = () => {
    setEditValues((prev) => {
      const base = sanitizeSlugInput(prev.slug || "");
      const cleanBase = base.length > 0 ? base : "tienda";
      const suffix = Math.random().toString(36).slice(2, 6);
      const next = cleanBase.endsWith("-") ? `${cleanBase}${suffix}` : `${cleanBase}-${suffix}`;
      setEditSlugValue(next);
      return { ...prev, slug: next };
    });
  };

  const slugStrength = useMemo(() => {
    const slug = (editValues.slug || "").trim();
    if (!slug) {
      return {
        label: "Link débil",
        tone: "border-amber-200 bg-amber-50 text-amber-700",
        glow: true,
      };
    }
    const hasRandomSuffix = /-[a-z0-9]{4,}$/.test(slug);
    const hasDigits = /\d/.test(slug);
    const longEnough = slug.length >= 12;
    const mixed = hasDigits && /[a-z]/.test(slug);
    if (hasRandomSuffix && mixed && longEnough) {
      return { label: "Clave fuerte", tone: "border-emerald-200 bg-emerald-50 text-emerald-700", glow: false };
    }
    if (hasRandomSuffix || (mixed && slug.length >= 8)) {
      return { label: "Link mejorado", tone: "border-blue-200 bg-blue-50 text-blue-700", glow: false };
    }
    return { label: "Link débil", tone: "border-amber-200 bg-amber-50 text-amber-700", glow: true };
  }, [editValues.slug]);

  if (!activeProviderSlug) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-xl font-semibold">Falta el slug de proveedor.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecciona un proveedor desde el selector superior para gestionar las tiendas y links de pedido.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <main className="flex w-full flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link href={activeProviderSlug ? `/app/${activeProviderSlug}` : "/app"}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
          <span>/</span>
          <Badge variant="secondary">Clientes</Badge>
        </div>

        <Card className="border border-[color:var(--border)] bg-card/95 shadow-[0_18px_48px_-26px_rgba(0,0,0,0.55)] backdrop-blur-sm">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg">Clientes registrados</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Bienvenido, {activeProviderSlug}: aquí puedes administrar tus clientes y copiar sus links
                  únicos de pedido.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Refrescar tiendas"
                  onClick={() => void loadClients(activeProviderSlug)}
                  disabled={loadingClients}
                >
                  <RefreshCcw className={`h-4 w-4 ${loadingClients ? "animate-spin" : ""}`} />
                </Button>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo cliente
                    </Button>
                  </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Crear tienda</DialogTitle>
                      <DialogDescription>
                        Genera el link único de pedidos para esta tienda.
                      </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      {formError ? (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                          {formError}
                        </div>
                      ) : null}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre</Label>
                          <Input id="name" name="name" required placeholder="Ej: Tienda Caballito" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="slug" className="flex items-center justify-between gap-2">
                            <span>Link</span>
                            <span className="text-right text-[11px] font-normal text-muted-foreground">
                              {(origin || "https://miproveedor.app") +
                                `/${activeProviderSlug || "[proveedor]"}/${slugValue || "[tienda]"}`}
                            </span>
                          </Label>
                          <Input
                            id="slug"
                            name="slug"
                            required
                            value={slugValue}
                            onChange={(event) => setSlugValue(event.target.value)}
                            pattern="^[a-z0-9-]+$"
                            title="Solo minúsculas, números y guiones"
                            placeholder="nombredelatienda"
                            aria-invalid={Boolean(slugError)}
                          />
                          {slugError ? <p className="text-xs text-destructive">{slugError}</p> : null}
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="contactName">Contacto</Label>
                          <Input id="contactName" name="contactName" placeholder="Nombre de contacto" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPhone">WhatsApp / Teléfono</Label>
                          <Input id="contactPhone" name="contactPhone" type="tel" placeholder="+54 9 ..." />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="contactEmail">Email</Label>
                          <Input id="contactEmail" name="contactEmail" type="email" placeholder="opcional" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Dirección</Label>
                          <Input id="address" name="address" placeholder="opcional" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{activeProviderSlug || "Sin proveedor"}</span>
                        </div>
                        <span className="text-muted-foreground">Se usará para el link único</span>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="submit" disabled={pendingCreate || !activeProviderSlug}>
                          Crear tienda
                        </Button>
                      </div>
                    </form>
                    <Separator className="my-2" />
                    <AnimatePresence>
                      {result && result.success ? (
                        <motion.div
                          key="result"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3 shadow-[var(--shadow-xs)]"
                        >
                          <p className="text-sm font-semibold">Resultado</p>
                          <div className="space-y-2 text-sm">
                            <p>{result.message}</p>
                            <div>
                              <p className="text-xs text-muted-foreground">Link de pedidos</p>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 truncate rounded-md bg-card px-2 py-1 text-xs">
                                  {buildOrderLink({
                                    id: result.client.id,
                                    name: "",
                                    slug: result.client.slug,
                                    contact_name: null,
                                    contact_phone: null,
                                    contact_email: null,
                                    address: null,
                                    created_at: null,
                                  })}
                                </code>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => {
                                    const link = buildOrderLink({
                                      id: result.client.id,
                                      name: "",
                                      slug: result.client.slug,
                                      contact_name: null,
                                      contact_phone: null,
                                      contact_email: null,
                                      address: null,
                                      created_at: null,
                                    });
                                    navigator.clipboard.writeText(link).catch(() => {
                                      // ignore copy errors
                                    });
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-sm">
              <Label className="text-xs text-muted-foreground">Proveedor</Label>
              <Badge variant="outline">{activeProviderSlug}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientsError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {clientsError}
              </div>
            ) : null}

            {loadingClients ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-4 shadow-[var(--shadow-xs)]"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-32 rounded-md" />
                  </div>
                ))}
              </div>
            ) : clients.length === 0 ? (
              <motion.div
                initial={{ opacity: 0.8, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--muted)] p-4 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2 text-primary">
                  <Store className="h-4 w-4" />
                  <span>Aún no hay tiendas.</span>
                </div>
                <p>Usa el botón “Nuevo cliente” para crear la primera.</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {clients.map((client, index) => (
                  <motion.div
                    key={client.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="group relative overflow-hidden rounded-xl border border-[color:var(--border)] bg-card/95 p-4 shadow-[var(--shadow-sm)]"
                  >
                    <div className="absolute inset-0 bg-[color:var(--accent)]/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--brand-deep)] ring-1 ring-[color:var(--accent-foreground)]/30">
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold leading-tight">{client.name}</p>
                            <Badge variant="secondary">/{client.slug}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {client.contact_phone || client.contact_email || "Sin contacto"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {client.created_at
                              ? new Date(client.created_at).toLocaleString("es-AR", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "Fecha no disponible"}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:w-full sm:max-w-xl sm:flex-row sm:flex-wrap sm:justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="justify-center">
                              <LinkIcon className="mr-2 h-4 w-4" />
                              Link de cliente
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              {buildOrderLink(client)}
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              className="gap-2 text-sm"
                              onClick={() => handleCopyLink(client)}
                            >
                              <Copy className="h-4 w-4" />
                              Copiar link
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-sm" asChild>
                              <a href={buildOrderLink(client)} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-4 w-4" />
                                Abrir link
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-sm"
                              disabled={!buildWhatsappLink(client)}
                              asChild={Boolean(buildWhatsappLink(client))}
                            >
                              {buildWhatsappLink(client) ? (
                                <a href={buildWhatsappLink(client) ?? "#"} target="_blank" rel="noreferrer">
                                  <MessageCircle className="h-4 w-4" />
                                  Enviar por WhatsApp
                                </a>
                              ) : (
                                <div className="flex items-center gap-2 opacity-60">
                                  <MessageCircle className="h-4 w-4" />
                                  Enviar por WhatsApp
                                </div>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="justify-center"
                          aria-label="Editar cliente"
                          onClick={() => {
                            setEditingClient(client);
                            setEditValues({
                              name: client.name ?? "",
                              slug: client.slug ?? "",
                              contactName: client.contact_name ?? "",
                              contactPhone: client.contact_phone ?? "",
                              contactEmail: client.contact_email ?? "",
                              address: client.address ?? "",
                            });
                            setEditSlugValue(client.slug ?? "");
                            setEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Editar tienda</DialogTitle>
              <DialogDescription>Actualiza los datos y el link único de pedidos.</DialogDescription>
            </DialogHeader>
            {editError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {editError}
              </div>
            ) : null}
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input
                    id="edit-name"
                    name="edit-name"
                    value={editValues.name}
                    onChange={(event) => setEditValues((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contactName">Contacto</Label>
                  <Input
                    id="edit-contactName"
                    name="edit-contactName"
                    value={editValues.contactName}
                    onChange={(event) =>
                      setEditValues((prev) => ({ ...prev, contactName: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-contactPhone">WhatsApp / Teléfono</Label>
                  <Input
                    id="edit-contactPhone"
                    name="edit-contactPhone"
                    type="tel"
                    value={editValues.contactPhone}
                    onChange={(event) =>
                      setEditValues((prev) => ({ ...prev, contactPhone: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contactEmail">Email</Label>
                  <Input
                    id="edit-contactEmail"
                    name="edit-contactEmail"
                    type="email"
                    value={editValues.contactEmail}
                    onChange={(event) =>
                      setEditValues((prev) => ({ ...prev, contactEmail: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Dirección</Label>
                <Input
                  id="edit-address"
                  name="edit-address"
                  value={editValues.address}
                  onChange={(event) => setEditValues((prev) => ({ ...prev, address: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="edit-slug" className="flex items-center gap-2">
                    <span>Link</span>
                  </Label>
                  <span className="text-right text-[11px] font-normal text-muted-foreground">
                    {(origin || "https://miproveedor.app") +
                      `/${activeProviderSlug || "[proveedor]"}/${editSlugValue || "[tienda]"}`}
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    id="edit-slug"
                    name="edit-slug"
                    value={editValues.slug}
                    onChange={(event) => {
                      const sanitized = sanitizeSlugInput(event.target.value);
                      setEditValues((prev) => ({ ...prev, slug: sanitized }));
                      setEditSlugValue(sanitized);
                    }}
                    pattern="^[a-z0-9-]+$"
                    title="Solo minúsculas, números y guiones"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${slugStrength.tone}`}>
                      {slugStrength.label}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={reinforceSlug}
                      className={`sm:w-auto ${slugStrength.glow ? "ring-2 ring-amber-300 ring-offset-2 animate-pulse" : ""}`}
                    >
                      <ShieldPlus className="mr-1.5 h-4 w-4" />
                      Reforzar
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex w-full items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pendingEdit || !editingClient}>
                  {pendingEdit ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
            {editResult && editResult.success ? (
              <p className="text-sm text-emerald-700">Cambios guardados.</p>
            ) : null}
          </DialogContent>
        </Dialog>

        {copyState ? (
          <p className="text-xs text-muted-foreground">
            {copyState.copied ? "Link copiado." : "No se pudo copiar el link."}
          </p>
        ) : null}
      </main>
    </div>
  );
}
