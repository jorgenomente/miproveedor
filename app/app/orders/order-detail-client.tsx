"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Save, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/whatsapp";
import { ORDER_STATUS, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { updateOrder, type OrderDetail } from "./actions";

type Props = {
  order: OrderDetail;
  backHref: string;
};

const statusChoices: OrderStatus[] = ["nuevo", "preparando", "entregado"];

export function OrderDetailClient({ order, backHref }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [contactName, setContactName] = useState(order.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(order.contactPhone ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState(order.deliveryMethod ?? "");
  const [note, setNote] = useState(order.note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);

  const allowedNextStatuses = useMemo(() => statusChoices, []);

  const totals = useMemo(() => {
    const subtotal = order.items.reduce((acc, item) => acc + item.subtotal, 0);
    return { subtotal, total: order.total ?? subtotal };
  }, [order.items, order.total]);

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
        note: note.trim(),
      });

      if (response.success) {
        setMessage(response.message);
        router.refresh();
      } else {
        setError(response.errors.join("\n"));
      }
    });
  };

  const downloadPdf = async () => {
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
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/50 px-4 pb-12 pt-6 sm:px-8">
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

        <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
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
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={downloadPdf} disabled={downloading}>
                <Download className="mr-2 h-4 w-4" />
                {downloading ? "Generando..." : "Descargar remito"}
              </Button>
              <Button size="sm" onClick={save} disabled={pending}>
                <Save className="mr-2 h-4 w-4" />
                {pending ? "Guardando..." : "Guardar cambios"}
              </Button>
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

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/60 bg-card/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Proveedor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <div className="font-semibold text-foreground">{order.provider.name}</div>
                  {order.provider.contact_email ? <div>{order.provider.contact_email}</div> : null}
                  {order.provider.contact_phone ? <div>{order.provider.contact_phone}</div> : null}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <div className="font-semibold text-foreground">{order.client.name}</div>
                  {order.client.contact_name ? <div>Contacto: {order.client.contact_name}</div> : null}
                  {order.client.contact_phone ? <div>Teléfono: {order.client.contact_phone}</div> : null}
                  {order.client.address ? <div>Dirección: {order.client.address}</div> : null}
                </CardContent>
              </Card>
            </div>

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
                        onClick={() => setStatus(option)}
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
              <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60">
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
                    <p className="text-right">{item.quantity}</p>
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
