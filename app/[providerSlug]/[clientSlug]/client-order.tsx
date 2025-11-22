"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { buildWhatsAppLink, formatCurrency } from "@/lib/whatsapp";
import { createOrder, type OrderSummaryItem } from "./actions";

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  unit?: string | null;
};

export type Provider = {
  id: string;
  name: string;
  slug: string;
  contact_phone?: string | null;
};

export type Client = {
  id: string;
  name: string;
  slug: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
};

type SummaryItem = {
  id: string;
  name: string;
  price: number;
  unit?: string | null;
  quantity: number;
};

type Props = {
  provider: Provider;
  client: Client;
  products: Product[];
};

export function ClientOrder({ provider, client, products }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [contactName, setContactName] = useState(() => client.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(() => client.contactPhone ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [note, setNote] = useState("");
  const [orderSent, setOrderSent] = useState(false);
  const [pendingOrder, startOrder] = useTransition();
  const [serverItems, setServerItems] = useState<OrderSummaryItem[] | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const items = useMemo(
    () =>
      products
        .filter((product) => (quantities[product.id] ?? 0) > 0)
        .map((product) => ({
          ...product,
          quantity: quantities[product.id] ?? 0,
        })),
    [products, quantities],
  );

  const summaryItems: SummaryItem[] =
    serverItems?.map((item) => ({
      id: item.productId,
      name: item.name,
      unit: item.unit,
      price: item.unitPrice,
      quantity: item.quantity,
    })) ??
    items.map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      price: item.price,
      quantity: item.quantity,
    }));

  const total = serverTotal ?? summaryItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const whatsappLink = buildWhatsAppLink({
    providerName: provider.name,
    providerPhone: provider.contact_phone ?? undefined,
    clientName: client.name,
    contactName,
    contactPhone,
    deliveryMethod,
    note,
    items: summaryItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      unit: item.unit ?? undefined,
    })),
  })?.href;

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/40">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-10 top-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.7, scale: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
        <motion.div
          className="absolute -right-10 bottom-16 h-56 w-56 rounded-full bg-foreground/5 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
        />
      </div>

      <main className="relative mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-16 pt-10 md:px-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur md:p-6"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{provider.slug}</Badge>
            <span className="text-xs">/</span>
            <Badge variant="secondary">{client.slug}</Badge>
          </div>
          <h1 className="text-balance text-2xl font-semibold md:text-3xl">
            {provider.name} · Pedido de {client.name}
          </h1>
          <p className="text-pretty text-sm text-muted-foreground md:text-base">
            Selecciona cantidades, completa tus datos y envía el pedido. Luego podrás notificar al proveedor por WhatsApp con un resumen listo.
          </p>
        </motion.header>

        <section className="grid gap-5 md:grid-cols-[2fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Catálogo</h2>
              <Badge variant="secondary">Mobile-first</Badge>
            </div>

            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-secondary/30 p-4 text-sm text-muted-foreground">
                Este proveedor aún no tiene productos activos.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {products.map((product) => (
                  <Card key={product.id} className="border-border/70 bg-card/80 shadow-sm">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-base font-semibold">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-lg font-semibold">{formatCurrency(product.price)}</div>
                        {product.unit ? (
                          <p className="text-xs text-muted-foreground">{product.unit}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-border/70 bg-secondary px-2 py-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Restar ${product.name}`}
                          onClick={() =>
                            setQuantities((prev) => ({
                              ...prev,
                              [product.id]: Math.max((prev[product.id] ?? 0) - 1, 0),
                            }))
                          }
                        >
                          -
                        </Button>
                        <span className="w-6 text-center text-sm font-semibold">
                          {quantities[product.id] ?? 0}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Sumar ${product.name}`}
                          onClick={() =>
                            setQuantities((prev) => ({
                              ...prev,
                              [product.id]: (prev[product.id] ?? 0) + 1,
                            }))
                          }
                        >
                          +
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
            className="sticky top-4 h-fit space-y-4 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur md:p-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Resumen</h2>
              <Badge>{items.length} items</Badge>
            </div>
            <Separator />
            <div className="space-y-1 rounded-xl border border-border/60 bg-secondary/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Datos de la tienda
              </p>
              <p className="text-sm font-semibold text-foreground">{client.name}</p>
              <p className="text-xs text-muted-foreground">
                {client.address ? client.address : "Sin dirección guardada"}
              </p>
              <p className="text-xs text-muted-foreground">
                Contacto: {client.contactPhone ? client.contactPhone : "Sin teléfono"}
              </p>
              {client.contactName ? (
                <p className="text-xs text-muted-foreground">Responsable: {client.contactName}</p>
              ) : null}
            </div>
            <div className="space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Agrega productos para ver el resumen.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2">
                    <div className="text-sm">
                      <p className="font-semibold">
                        {item.quantity} × {item.name}
                      </p>
                      {item.unit ? <p className="text-xs text-muted-foreground">{item.unit}</p> : null}
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Total estimado</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <form
              className="space-y-3 pt-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (items.length === 0) return;
                setFormError(null);
                startOrder(async () => {
                  const response = await createOrder({
                    providerSlug: provider.slug,
                    clientSlug: client.slug,
                    contactName,
                    contactPhone,
                    deliveryMethod,
                    note,
                    items: items.map((item) => ({
                      productId: item.id,
                      quantity: item.quantity,
                    })),
                  });

                  if (response.success) {
                    setServerItems(response.items);
                    setServerTotal(response.total);
                    setOrderId(response.orderId);
                    setOrderSent(true);
                  } else {
                    setFormError(response.errors.join("\n"));
                    setOrderSent(false);
                  }
                });
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="contactName">Nombre de contacto</Label>
                <Input
                  id="contactName"
                  autoComplete="name"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactPhone">WhatsApp / Teléfono</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  autoComplete="tel"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliveryMethod">Método de entrega</Label>
                <Input
                  id="deliveryMethod"
                  placeholder="Retiro o envío"
                  value={deliveryMethod}
                  onChange={(event) => setDeliveryMethod(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note">Nota del pedido</Label>
                <Textarea
                  id="note"
                  placeholder="Detalles adicionales para el proveedor"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full" disabled={items.length === 0}>
                {pendingOrder ? "Enviando..." : "Enviar pedido"}
              </Button>
            </form>
            {formError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
                {formError}
              </div>
            ) : null}

            <AnimatePresence>
              {orderSent ? (
                <motion.div
                  key="whatsapp"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3"
                >
                  <div className="text-sm font-semibold">Pedido creado. Notifica al proveedor.</div>
                  {orderId ? (
                    <p className="text-xs text-muted-foreground">ID: {orderId}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Abriremos WhatsApp con un resumen listo para enviar.
                  </p>
                  <Button
                    type="button"
                    className="w-full"
                    variant="outline"
                    asChild
                    disabled={!whatsappLink}
                  >
                    <a href={whatsappLink ?? "#"} target="_blank" rel="noreferrer">
                      Notificar al proveedor
                    </a>
                  </Button>
                  {!provider.contact_phone ? (
                    <p className="text-xs text-destructive">
                      Falta teléfono del proveedor para completar la notificación.
                    </p>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.aside>
        </section>
      </main>
    </div>
  );
}
