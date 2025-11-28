"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock3, CreditCard, Download, FilePlus2, Save, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/whatsapp";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { generateReceipt, updateOrder, type OrderDetail } from "./actions";

type Props = {
  order: OrderDetail;
  backHref: string;
};

type PaymentMethod = "efectivo" | "transferencia";

const statusChoices: OrderStatus[] = ["nuevo", "preparando", "entregado"];

export function OrderDetailClient({ order, backHref }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [contactName, setContactName] = useState(order.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(order.contactPhone ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState(order.deliveryMethod ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod ?? "efectivo");
  const [paymentStatus, setPaymentStatus] = useState(order.paymentProofStatus ?? "no_aplica");
  const [note, setNote] = useState(order.note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [baseline, setBaseline] = useState({
    status: order.status,
    contactName: order.contactName ?? "",
    contactPhone: order.contactPhone ?? "",
    deliveryMethod: order.deliveryMethod ?? "",
    paymentMethod: order.paymentMethod ?? "efectivo",
    paymentStatus: order.paymentProofStatus ?? "no_aplica",
    note: order.note ?? "",
  });
  const [receiptReadyAt, setReceiptReadyAt] = useState(order.receiptGeneratedAt ?? null);
  const [receiptQuantities, setReceiptQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    order.items.forEach((item) => {
      const key = item.orderItemId || item.productId;
      initial[key] = item.deliveredQuantity ?? item.quantity;
    });
    return initial;
  });
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [generatingReceipt, startGeneratingReceipt] = useTransition();

  const accent = useMemo(() => {
    const palette = [
      { dot: "#22d3ee", trail: ["#22d3ee", "#a855f7", "#f97316"] },
      { dot: "#f97316", trail: ["#f97316", "#facc15", "#22c55e"] },
      { dot: "#22c55e", trail: ["#22c55e", "#06b6d4", "#6366f1"] },
      { dot: "#a855f7", trail: ["#a855f7", "#22d3ee", "#f472b6"] },
    ];
    return palette[Math.floor(Math.random() * palette.length)];
  }, []);

  useEffect(() => {
    setStatus(order.status);
    setContactName(order.contactName ?? "");
    setContactPhone(order.contactPhone ?? "");
    setDeliveryMethod(order.deliveryMethod ?? "");
    setPaymentMethod(order.paymentMethod ?? "efectivo");
    setPaymentStatus(order.paymentProofStatus ?? "no_aplica");
    setNote(order.note ?? "");
    setBaseline({
      status: order.status,
      contactName: order.contactName ?? "",
      contactPhone: order.contactPhone ?? "",
      deliveryMethod: order.deliveryMethod ?? "",
      paymentMethod: order.paymentMethod ?? "efectivo",
      paymentStatus: order.paymentProofStatus ?? "no_aplica",
      note: order.note ?? "",
    });
    setReceiptReadyAt(order.receiptGeneratedAt ?? null);
    setReceiptQuantities(() => {
      const next: Record<string, number> = {};
      order.items.forEach((item) => {
        const key = item.orderItemId || item.productId;
        next[key] = item.deliveredQuantity ?? item.quantity;
      });
      return next;
    });
    setReceiptModalOpen(false);
  }, [order]);

  const allowedNextStatuses = useMemo(() => statusChoices, []);

  const paymentMethodLabel = paymentMethod === "transferencia" ? "Transferencia" : "Efectivo";

  const paymentStatusText = (method: "efectivo" | "transferencia" | null | undefined, status: string) => {
    if (status === "subido") {
      return method === "transferencia" ? "Comprobante cargado" : "Efectivo recibido";
    }

    if (method === "transferencia") {
      if (status === "pendiente") return "Comprobante pendiente";
      return "Esperando comprobante";
    }

    if (method === "efectivo") {
      return "A pagar en la entrega";
    }

    return "A pagar en la entrega";
  };

  const totals = useMemo(() => {
    const subtotal = order.items.reduce((acc, item) => acc + (item.deliveredSubtotal ?? item.subtotal), 0);
    return { subtotal, total: subtotal };
  }, [order.items]);

  const receiptReady = Boolean(receiptReadyAt);

  const togglePaymentMethod = () => {
    setPaymentMethod((prev) => {
      const nextMethod: PaymentMethod = prev === "transferencia" ? "efectivo" : "transferencia";

      // Ajusta automáticamente el estado de pago para que el badge muestre el texto correcto.
      setPaymentStatus((current) => {
        if (nextMethod === "efectivo" && current !== "subido") return "no_aplica";
        if (nextMethod === "transferencia" && current === "no_aplica") return "pendiente";
        return current;
      });

      return nextMethod;
    });
  };

  const updateReceiptQuantity = (itemId: string, value: number, max: number) => {
    const safe = Number.isFinite(value) ? Math.max(0, Math.min(Math.round(value), max)) : 0;
    setReceiptQuantities((prev) => ({ ...prev, [itemId]: safe }));
  };

  const handleGenerateReceipt = () => {
    setError(null);
    setMessage(null);
    const itemsPayload = order.items.map((item) => {
      const key = item.orderItemId || item.productId;
      const desired = receiptQuantities[key];
      const max = item.quantity;
      const quantity = Math.max(0, Math.min(max, Number.isFinite(desired) ? Math.round(desired) : item.quantity));
      return {
        orderItemId: item.orderItemId || item.productId,
        productId: item.productId,
        quantity,
      };
    });

    if (itemsPayload.some((item) => !item.orderItemId)) {
      setError("No se pudo preparar el remito: faltan datos de los items.");
      return;
    }

    startGeneratingReceipt(async () => {
      const response = await generateReceipt({ orderId: order.id, items: itemsPayload });
      if (response.success) {
        setReceiptReadyAt(response.receiptGeneratedAt);
        setReceiptModalOpen(false);
        setMessage(response.message);
        router.refresh();
      } else {
        setError(response.errors.join("\n"));
      }
    });
  };

  const isDirty = useMemo(() => {
    return (
      status !== baseline.status ||
      contactName.trim() !== (baseline.contactName?.trim() ?? "") ||
      contactPhone.trim() !== (baseline.contactPhone?.trim() ?? "") ||
      deliveryMethod !== (baseline.deliveryMethod ?? "") ||
      paymentMethod !== (baseline.paymentMethod ?? "efectivo") ||
      paymentStatus !== baseline.paymentStatus ||
      note.trim() !== (baseline.note?.trim() ?? "")
    );
  }, [baseline, contactName, contactPhone, deliveryMethod, note, paymentMethod, paymentStatus, status]);

  const handleStatusChange = (nextStatus: OrderStatus) => {
    if (nextStatus === status) return;

    if (nextStatus === "entregado") {
      const confirmed =
        typeof window !== "undefined"
          ? window.confirm(
              paymentMethod === "transferencia"
                ? "¿Marcamos también el comprobante como recibido?"
                : "¿Marcamos el efectivo como recibido?",
            )
          : false;
      if (confirmed) {
        setPaymentStatus("subido");
      }
    }

    setStatus(nextStatus);
  };

  const save = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await updateOrder({
        orderId: order.id,
        status,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        deliveryMethod: deliveryMethod ? (deliveryMethod as "retiro" | "envio") : null,
        paymentMethod,
        paymentProofStatus: paymentStatus as "no_aplica" | "pendiente" | "subido",
        note: note.trim(),
      });

      if (response.success) {
        setMessage(response.message);
        setBaseline({
          status,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          deliveryMethod: deliveryMethod || "",
          paymentMethod,
          paymentStatus,
          note: note.trim(),
        });
        router.refresh();
      } else {
        setError(response.errors.join("\n"));
      }
    });
  };

  const downloadPdf = async () => {
    if (!receiptReady) {
      setError("El remito aún no está disponible. Generá el remito primero.");
      return;
    }
    setError(null);
    setDownloading(true);
    try {
      const response = await fetch(`/app/orders/${order.id}/receipt`, { cache: "no-store" });
      if (!response.ok) throw new Error("No se pudo generar el PDF");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `remito-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message || "No se pudo descargar el PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen bg-[color:var(--surface)] px-4 pb-12 pt-6 sm:px-8">
      <main className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href={backHref}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver a pedidos
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {order.provider.name}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {ORDER_STATUS_LABEL[order.status] ?? order.status}
            </Badge>
          </div>
        </div>

        <Card className="border-[color:var(--neutral-200)] bg-white shadow-sm backdrop-blur">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Creado el{" "}
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString("es-AR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Fecha no disponible"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
              <div className="flex flex-wrap gap-2">
                <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FilePlus2 className="mr-2 h-4 w-4" />
                      {receiptReady ? "Actualizar remito" : "Generar remito"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Confirmar remito</DialogTitle>
                      <DialogDescription>
                        Ajusta las cantidades a enviar. Si algún producto no tiene stock, ingresa 0.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      {order.items.map((item, index) => {
                        const key = item.orderItemId || item.productId || `item-${index}`;
                        const value = receiptQuantities[key] ?? item.deliveredQuantity ?? item.quantity;
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between gap-3 rounded-lg border border-(--neutral-200) bg-(--surface) p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                Pedido: {item.quantity}
                                {item.unit ? ` ${item.unit}` : ""}{" "}
                                {item.deliveredQuantity != null ? `· Último remito: ${item.deliveredQuantity}` : ""}
                              </p>
                            </div>
                            <Input
                              type="number"
                              min={0}
                              max={item.quantity}
                              value={value}
                              onChange={(event) => updateReceiptQuantity(key, Number(event.target.value), item.quantity)}
                              className="w-24"
                              aria-label={`Cantidad a remitir para ${item.productName}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <DialogFooter className="gap-2 sm:justify-end">
                      <Button variant="ghost" onClick={() => setReceiptModalOpen(false)} disabled={generatingReceipt}>
                        Cancelar
                      </Button>
                      <Button onClick={handleGenerateReceipt} disabled={generatingReceipt}>
                        {generatingReceipt ? "Guardando..." : receiptReady ? "Actualizar remito" : "Generar remito"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button
                  variant={receiptReady ? "outline" : "ghost"}
                  size="sm"
                  onClick={downloadPdf}
                  disabled={!receiptReady || downloading}
                  className={!receiptReady ? "text-muted-foreground" : undefined}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {receiptReady ? (downloading ? "Generando..." : "Descargar remito") : "Remito no disponible"}
                </Button>
              </div>
              <div className="relative">
                <Button
                  size="sm"
                  onClick={save}
                  disabled={pending || !isDirty}
                  className="relative overflow-hidden"
                >
                  <span className="relative z-10 inline-flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    {pending ? "Guardando..." : "Guardar cambios"}
                  </span>
                  {isDirty && !pending ? (
                    <>
                      <motion.div
                        className="pointer-events-none absolute -inset-1 rounded-md blur-sm"
                        style={{
                          background: `linear-gradient(120deg, ${accent.trail.join(", ")})`,
                          opacity: 0.85,
                        }}
                        animate={{
                          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                          opacity: [0.55, 0.9, 0.55],
                        }}
                        transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
                      />
                      <motion.div
                        className="pointer-events-none absolute -inset-0.5 rounded-md"
                        style={{
                          boxShadow: `0 0 0 2px ${accent.trail[0]}, 0 0 18px ${accent.trail[0]}`,
                        }}
                        animate={{
                          boxShadow: accent.trail.map((color) => `0 0 0 2px ${color}, 0 0 18px ${color}`),
                        }}
                        transition={{ repeat: Infinity, duration: 2.8, repeatType: "mirror", ease: "easeInOut" }}
                      />
                    </>
                  ) : null}
                </Button>
              </div>
              <p className="w-full text-right text-[11px] text-muted-foreground">
                {receiptReadyAt
                  ? `Remito generado el ${new Date(receiptReadyAt).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}`
                  : "Remito pendiente de generar."}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="grid gap-2 md:grid-cols-2">
              <Card className="border-[color:var(--neutral-200)] bg-white shadow-none">
                <CardHeader className="gap-0 px-3 py-1">
                  <CardTitle className="text-[11px] uppercase tracking-wide text-muted-foreground leading-none">
                    Proveedor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5 px-3 pb-1 pt-1 text-[13px] text-muted-foreground">
                  <div className="font-semibold text-foreground">{order.provider.name}</div>
                  {order.provider.contact_email ? <div>{order.provider.contact_email}</div> : null}
                  {order.provider.contact_phone ? <div>{order.provider.contact_phone}</div> : null}
                </CardContent>
              </Card>

              <Card className="border-[color:var(--neutral-200)] bg-white shadow-none">
                <CardHeader className="gap-0 px-3 py-1">
                  <CardTitle className="text-[11px] uppercase tracking-wide text-muted-foreground leading-none">
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5 px-3 pb-1 pt-1 text-[13px] text-muted-foreground">
                  <div className="font-semibold text-foreground">{order.client.name}</div>
                  {order.client.contact_name ? <div>Contacto: {order.client.contact_name}</div> : null}
                  {order.client.contact_phone ? <div>Teléfono: {order.client.contact_phone}</div> : null}
                  {order.client.address ? <div>Dirección: {order.client.address}</div> : null}
                </CardContent>
              </Card>
            </div>

        <Card className="border-[color:var(--neutral-200)] bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Entrega programada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {order.deliveryDate ? (
              <>
                <div className="font-semibold text-foreground">
                      {new Date(order.deliveryDate).toLocaleDateString("es-AR", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[11px]">
                    {new Date(order.deliveryDate).toLocaleDateString("es-AR", { weekday: "short" })}
                  </Badge>
                  {order.deliveryZoneName ? (
                    <Badge variant="secondary" className="text-[11px]">
                      Zona {order.deliveryZoneName}
                    </Badge>
                  ) : null}
                </div>
                <div>Ventana asignada automáticamente al crear el pedido.</div>
              </>
            ) : (
              <div className="text-destructive">Sin fecha asignada. Configura reglas de entrega en el catálogo.</div>
            )}
          </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <div className="flex flex-wrap gap-2">
                  {statusChoices.filter((option) => allowedNextStatuses.includes(option)).map((option) => {
                    const isActive = status === option;
                    return (
                      <Button
                        key={option}
                        type="button"
                        variant={isActive ? "secondary" : "outline"}
                        size="sm"
                        className="capitalize"
                        aria-pressed={isActive}
                        onClick={() => handleStatusChange(option)}
                      >
                        {ORDER_STATUS_LABEL[option]}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery">Entrega</Label>
                <Select
                  value={deliveryMethod || "none"}
                  onValueChange={(value) => setDeliveryMethod(value === "none" ? "" : value)}
                >
                  <SelectTrigger id="delivery">
                    <SelectValue placeholder="Selecciona entrega" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No especificado</SelectItem>
                    <SelectItem value="retiro">Retiro</SelectItem>
                    <SelectItem value="envio">Envío</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pago</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  {paymentMethod === "transferencia" ? (
                    <CreditCard className="h-3.5 w-3.5" />
                  ) : (
                    <Wallet className="h-3.5 w-3.5" />
                  )}
                  <button
                    type="button"
                    onClick={togglePaymentMethod}
                    className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-foreground transition hover:bg-muted"
                    aria-pressed={paymentMethod === "efectivo"}
                    aria-label="Cambiar método de pago"
                  >
                    {paymentMethodLabel}
                  </button>
                </Badge>
                <Badge
                  variant={paymentStatus === "subido" ? "secondary" : "outline"}
                  className={
                    paymentStatus === "pendiente"
                      ? "border-amber-400/60 text-amber-700 dark:text-amber-200"
                      : paymentStatus === "subido"
                        ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-200"
                        : ""
                  }
                >
                  {paymentStatusText(paymentMethod, paymentStatus)}
                </Badge>
                {order.paymentProofUrl ? (
                  <Button asChild size="sm" variant="ghost">
                    <a href={order.paymentProofUrl} target="_blank" rel="noreferrer">
                      Ver comprobante
                    </a>
                  </Button>
                ) : null}
              </div>
              {paymentMethod === "transferencia" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentStatus === "subido" ? "secondary" : "outline"}
                    onClick={() => setPaymentStatus("subido")}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Marcar comprobante recibido
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentStatus === "pendiente" ? "secondary" : "ghost"}
                    onClick={() => setPaymentStatus("pendiente")}
                  >
                    <Clock3 className="mr-1.5 h-4 w-4" />
                    Marcar pendiente
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentStatus === "subido" ? "secondary" : "outline"}
                    onClick={() => setPaymentStatus("subido")}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Efectivo recibido
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentStatus === "no_aplica" ? "secondary" : "ghost"}
                    onClick={() => setPaymentStatus("no_aplica")}
                  >
                    <Clock3 className="mr-1.5 h-4 w-4" />
                    Aún no cobrado
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Pago en efectivo al entregar. Marca recibido cuando cobres.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nombre de contacto</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="Persona que recibe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Teléfono</Label>
                <Input
                  id="contactPhone"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="+54 9 ..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Nota del pedido</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Notas especiales, referencias de entrega, etc."
                rows={4}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Detalle del pedido</p>
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Truck className="h-3.5 w-3.5" />
                  {deliveryMethod || "Entrega no definida"}
                </Badge>
              </div>
              <div className="overflow-hidden rounded-xl border border-[color:var(--neutral-200)] bg-card/60">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground sm:px-4">
                  <span>Producto</span>
                  <span className="text-right">Cant.</span>
                  <span className="text-right">P. unit</span>
                  <span className="text-right">Subtotal</span>
                </div>
                {order.items.map((item, index) => (
                  <motion.div
                    key={`${item.productId}-${index}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-3 py-2 text-sm sm:px-4"
                  >
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.unit ?? "Sin unidad"}</p>
                    </div>
                    <div className="text-right">
                      <p>{item.deliveredQuantity ?? item.quantity}</p>
                      {item.deliveredQuantity != null && item.deliveredQuantity !== item.quantity ? (
                        <p className="text-[11px] text-amber-600">Pedido: {item.quantity}</p>
                      ) : null}
                    </div>
                    <p className="text-right">{formatCurrency(item.unitPrice)}</p>
                    <p className="text-right font-semibold">{formatCurrency(item.subtotal)}</p>
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-6 text-sm font-semibold">
                <div className="text-muted-foreground">Subtotal: {formatCurrency(totals.subtotal)}</div>
                <div>Total: {formatCurrency(totals.total)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
