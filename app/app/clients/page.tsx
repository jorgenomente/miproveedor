"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Building2, Copy, Link as LinkIcon, RefreshCcw, Store } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createClient,
  listClients,
  type ClientRow,
  type CreateClientResult,
} from "./actions";

type CopyState = { link: string; copied: boolean };

export type ClientsPageProps = { initialProviderSlug?: string };

export default function ClientsPage({ initialProviderSlug }: ClientsPageProps) {
  const providerSlug = initialProviderSlug ?? "";
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateClientResult | null>(null);
  const [pendingCreate, startCreate] = useTransition();
  const [origin, setOrigin] = useState("");
  const [copyState, setCopyState] = useState<CopyState | null>(null);

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
    void loadClients(providerSlug);
  }, [loadClients, providerSlug]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      providerSlug,
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
        await loadClients(providerSlug);
        (event.target as HTMLFormElement).reset();
      }
    });
  };

  const buildOrderLink = (client: ClientRow) => {
    const base = origin || "https://miproveedor.app";
    return `${base}/${providerSlug}/${client.slug}`;
  };

  if (!providerSlug) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-xl font-semibold">Falta el slug de proveedor.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Usa la ruta /app/[providerSlug]/clients para gestionar las tiendas de un proveedor.
        </p>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/50 px-4 pb-12 pt-8 sm:px-8">
      <main className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link href={providerSlug ? `/app/${providerSlug}` : "/app"}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
          <span>/</span>
          <Badge variant="secondary">Clientes</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr,0.95fr]">
          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Tiendas creadas</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Bienvenido, {providerSlug}: aquí puedes administrar tus tiendas y copiar sus links
                    únicos de pedido.
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Refrescar tiendas"
                  onClick={() => void loadClients(providerSlug)}
                  disabled={loadingClients}
                >
                  <RefreshCcw className={`h-4 w-4 ${loadingClients ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm">
                <Label className="text-xs text-muted-foreground">Proveedor</Label>
                <Badge variant="outline">{providerSlug}</Badge>
              </div>

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
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 p-4"
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
                  className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border/70 bg-secondary/30 p-4 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-2 text-primary">
                    <Store className="h-4 w-4" />
                    <span>Aún no hay tiendas.</span>
                  </div>
                  <p>Usa el formulario para crear la primera.</p>
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
                      className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10">
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
                        <div className="flex flex-col gap-2 sm:w-60">
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-center"
                            onClick={() => {
                              const link = buildOrderLink(client);
                              setCopyState({ link, copied: true });
                              navigator.clipboard.writeText(link).catch(() => {
                                setCopyState({ link, copied: false });
                              });
                              setTimeout(() => setCopyState(null), 1600);
                            }}
                          >
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Copiar link de pedidos
                          </Button>
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
              <CardTitle className="text-lg">Crear tienda</CardTitle>
              <p className="text-sm text-muted-foreground">
                Genera el link único de pedidos para esta tienda.
              </p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" name="name" required placeholder="Ej: Nova Caballito" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      name="slug"
                      required
                      pattern="^[a-z0-9-]+$"
                      title="Solo minúsculas, números y guiones"
                      placeholder="nova-caballito"
                    />
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
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{providerSlug || "Sin proveedor"}</span>
                  </div>
                  <span className="text-muted-foreground">Se usará para el link único</span>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="submit" disabled={pendingCreate || !providerSlug}>
                    Crear tienda
                  </Button>
                </div>
              </form>

              <Separator className="my-4" />
              <AnimatePresence>
                {result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="space-y-3 rounded-xl border border-border/70 bg-secondary/40 p-4"
                  >
                    <p className="text-sm font-semibold">Resultado</p>
                    {result.success ? (
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
                    ) : (
                      <div className="space-y-1 text-sm text-destructive">
                        {result.errors.map((error) => (
                          <p key={error}>{error}</p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {copyState ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {copyState.copied ? "Link copiado." : "No se pudo copiar el link."}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
