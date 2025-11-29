"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Eye,
  FilePlus2,
  Plus,
  Save,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listProducts, type ProductRow } from "../products/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/whatsapp";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { generateReceipt, updateDeliveryDate, updateOrder, type OrderDetail } from "./actions";

type Props = {
  order: OrderDetail;
  backHref: string;
  autoOpenReceipt?: boolean;
};

type PaymentMethod = "efectivo" | "transferencia";
type ReceiptExtra = { key: string; productId: string; name: string; unit: string | null };

const statusChoices: OrderStatus[] = ["nuevo", "preparando", "entregado"];

export function OrderDetailClient({ order, backHref, autoOpenReceipt }: Props) {
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
  const [deliveryDate, setDeliveryDate] = useState(order.deliveryDate ?? null);
  const [outOfStockMap, setOutOfStockMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    order.items.forEach((item) => {
      const key = item.orderItemId || item.productId;
      const qty = item.deliveredQuantity ?? item.quantity;
      if (qty === 0) initial[key] = true;
    });
    return initial;
  });
  const [newReceiptItems, setNewReceiptItems] = useState<ReceiptExtra[]>([]);
  const [catalog, setCatalog] = useState<ProductRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductQty, setSelectedProductQty] = useState(1);
  const [receiptModalOpen, setReceiptModalOpen] = useState(Boolean(autoOpenReceipt));
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState("");
  const [deliveryPopoverOpen, setDeliveryPopoverOpen] = useState(false);
  const [generatingReceipt, startGeneratingReceipt] = useTransition();
  const [updatingDelivery, startUpdatingDelivery] = useTransition();
  const [infoOpen, setInfoOpen] = useState(true);
  const quickViewRef = useRef<HTMLDivElement>(null);

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
    setDeliveryDate(order.deliveryDate ?? null);
    setReceiptQuantities(() => {
      const next: Record<string, number> = {};
      order.items.forEach((item) => {
        const key = item.orderItemId || item.productId;
        next[key] = item.deliveredQuantity ?? item.quantity;
      });
      return next;
    });
    setOutOfStockMap(() => {
      const next: Record<string, boolean> = {};
      order.items.forEach((item) => {
        const key = item.orderItemId || item.productId;
        const qty = item.deliveredQuantity ?? item.quantity;
        if (qty === 0) next[key] = true;
      });
      return next;
    });
    setNewReceiptItems([]);
    setCatalogError(null);
    setCatalog([]);
    setCatalogLoading(false);
    setSelectedProductId("");
    setSelectedProductQty(1);
    setProductSearch("");
    setReceiptModalOpen(Boolean(autoOpenReceipt));
    setReceiptSearch("");
  }, [autoOpenReceipt, order]);

  const ensureCatalogLoaded = useCallback(async () => {
    if (catalogLoading || catalog.length > 0) return;
    setCatalogLoading(true);
    setCatalogError(null);
    const result = await listProducts(order.provider.slug);
    if (result.success) {
      setCatalog(result.products.filter((product) => product.is_active !== false));
    } else {
      setCatalogError(result.errors.join(" · "));
    }
    setCatalogLoading(false);
  }, [catalog.length, catalogLoading, order.provider.slug]);

  useEffect(() => {
    if (receiptModalOpen) {
      void ensureCatalogLoaded();
    }
  }, [ensureCatalogLoaded, receiptModalOpen]);

  const allowedNextStatuses = useMemo(() => statusChoices, []);

  const findReceiptKeyByProduct = useCallback(
    (productId: string) => {
      const existing = order.items.find((item) => item.productId === productId);
      if (existing) return existing.orderItemId || existing.productId;
      const extra = newReceiptItems.find((item) => item.productId === productId);
      return extra?.key;
    },
    [newReceiptItems, order.items],
  );

  const filteredCatalog = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter((item) => item.name.toLowerCase().includes(query));
  }, [catalog, productSearch]);

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

  const quickViewTotals = useMemo(() => {
    const subtotal = order.items.reduce((acc, item) => {
      const base = Number(item.subtotal ?? item.unitPrice * item.quantity);
      return acc + (Number.isFinite(base) ? base : 0);
    }, 0);
    const total = Number.isFinite(order.total) ? order.total : subtotal;
    return { subtotal, total };
  }, [order.items, order.total]);

  const receiptItems = useMemo(() => {
    const base = order.items.map((item, index) => {
      const key = item.orderItemId || item.productId || `item-${index}`;
      const value = receiptQuantities[key] ?? item.deliveredQuantity ?? item.quantity;
      return {
        key,
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        orderedQuantity: item.quantity,
        lastDelivered: item.deliveredQuantity,
        value,
        isNew: false,
      };
    });

    const extras = newReceiptItems.map((item) => {
      const value = receiptQuantities[item.key] ?? 0;
      return {
        key: item.key,
        productId: item.productId,
        productName: item.name,
        unit: item.unit,
        orderedQuantity: null,
        lastDelivered: null,
        value,
        isNew: true,
      };
    });

    return [...base, ...extras];
  }, [newReceiptItems, order.items, receiptQuantities]);

  const visibleReceiptItems = useMemo(() => {
    const term = receiptSearch.trim().toLowerCase();
    if (!term) return receiptItems;
    return receiptItems.filter((item) => item.productName.toLowerCase().includes(term));
  }, [receiptItems, receiptSearch]);

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

  const updateReceiptQuantity = (itemId: string, value: number) => {
    const safe = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    setReceiptQuantities((prev) => ({ ...prev, [itemId]: safe }));
    setOutOfStockMap((prev) => {
      if (prev[itemId] && safe > 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return prev;
    });
  };

  const toggleOutOfStock = (itemId: string, checked: boolean) => {
    setOutOfStockMap((prev) => ({ ...prev, [itemId]: checked }));
    if (checked) {
      setReceiptQuantities((prev) => ({ ...prev, [itemId]: 0 }));
    }
  };

  const handleAddProductFromCatalog = () => {
    setCatalogError(null);
    const product = catalog.find((entry) => entry.id === selectedProductId);
    const qty = Number.isFinite(selectedProductQty) ? Math.max(0, Math.round(selectedProductQty)) : 0;

    if (!product) {
      setCatalogError("Selecciona un producto del catálogo.");
      return;
    }

    const existingKey = findReceiptKeyByProduct(product.id);
    if (existingKey) {
      setReceiptQuantities((prev) => ({
        ...prev,
        [existingKey]: (prev[existingKey] ?? 0) + qty,
      }));
      setOutOfStockMap((prev) => {
        const next = { ...prev };
        if (qty > 0) delete next[existingKey];
        return next;
      });
    } else {
      const key = `extra-${product.id}-${Date.now()}`;
      setNewReceiptItems((prev) => [...prev, { key, productId: product.id, name: product.name, unit: product.unit ?? null }]);
      setReceiptQuantities((prev) => ({ ...prev, [key]: qty }));
      setOutOfStockMap((prev) => {
        const next = { ...prev };
        if (qty === 0) next[key] = true;
        return next;
      });
    }

    setSelectedProductId("");
    setSelectedProductQty(1);
    setProductSelectorOpen(false);
  };

  const removeNewReceiptItem = (key: string) => {
    setNewReceiptItems((prev) => prev.filter((item) => item.key !== key));
    setReceiptQuantities((prev) => {
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
    setOutOfStockMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleGenerateReceipt = () => {
    setError(null);
    setMessage(null);
    const basePayload = order.items.map((item) => {
      const key = item.orderItemId || item.productId;
      const desired = receiptQuantities[key];
      const quantity = Math.max(0, Number.isFinite(desired) ? Math.round(desired) : item.quantity);
      return {
        orderItemId: item.orderItemId || undefined,
        productId: item.productId,
        quantity,
        outOfStock: Boolean(outOfStockMap[key]),
      };
    });

    const extrasPayload = newReceiptItems
      .map((item) => {
        const desired = receiptQuantities[item.key];
        const quantity = Math.max(0, Number.isFinite(desired) ? Math.round(desired) : 0);
        return {
          orderItemId: undefined,
          productId: item.productId,
          quantity,
          outOfStock: Boolean(outOfStockMap[item.key]),
        };
      })
      .filter((item) => item.quantity > 0 || item.outOfStock);

    const itemsPayload = [...basePayload, ...extrasPayload];

    if (itemsPayload.length === 0) {
      setError("Agrega al menos un producto al remito.");
      return;
    }

    startGeneratingReceipt(async () => {
      const response = await generateReceipt({ orderId: order.id, items: itemsPayload });
      if (response.success) {
        setReceiptReadyAt(response.receiptGeneratedAt);
        setMessage(response.message);
        setError(null);
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

  const formatDate = (value: string | null | undefined, withTime = true) => {
    if (!value) return "Fecha no disponible";
    try {
      return new Date(value).toLocaleString("es-AR", {
        dateStyle: "medium",
        timeStyle: withTime ? "short" : undefined,
      });
    } catch {
      return value;
    }
  };

  const downloadQuickViewPdf = () => {
    const createdAt = formatDate(order.createdAt);
    const delivery = formatDate(order.deliveryDate, false);
    const rows = order.items
      .map((item, index) => {
        const subtotal = item.subtotal ?? item.unitPrice * item.quantity;
        return `
          <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${index + 1}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${item.productName}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${item.quantity}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${item.unit ?? "-"}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(
              item.unitPrice ?? 0,
            )}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(
              subtotal ?? 0,
            )}</td>
          </tr>`;
      })
      .join("");

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Pedido ${order.id}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 24px; color: #111827; }
            h1 { margin: 0 0 4px; font-size: 20px; }
            .muted { color: #6b7280; font-size: 12px; margin: 0 0 8px; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
            .row { display: flex; flex-wrap: wrap; gap: 12px; }
            .pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: #f3f4f6; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { text-align: left; background: #f9fafb; font-size: 12px; color: #4b5563; padding: 8px; border-bottom: 1px solid #e5e7eb; }
            tfoot td { font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>Pedido #${order.id.slice(0, 8)}</h1>
          <p class="muted">${order.client.name} · Creado: ${createdAt} · Entrega: ${delivery}</p>
          <div class="card">
            <div class="row">
              <span class="pill">Cliente: ${order.client.name}</span>
              <span class="pill">Tel: ${order.contactPhone || "—"}</span>
              <span class="pill">Entrega: ${delivery}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Producto</th><th style="text-align:right;">Cant.</th><th style="text-align:right;">Unidad</th><th style="text-align:right;">Precio</th><th style="text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="5" style="padding:8px;text-align:right;">Total</td>
                  <td style="padding:8px;text-align:right;">${formatCurrency(quickViewTotals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p class="muted">Notas: ${order.note ? order.note : "—"}</p>
          <script>window.print();</script>
        </body>
      </html>`;

    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
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
                {formatDate(order.createdAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                {receiptReadyAt ? `Remito generado el ${formatDate(receiptReadyAt)}` : "Remito pendiente de generar."}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <div className="flex flex-wrap justify-end gap-2 sm:justify-start">
                <Dialog open={quickViewOpen} onOpenChange={setQuickViewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Ver pedido
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Pedido #{order.id.slice(0, 8)}</DialogTitle>
                      <DialogDescription>Vista rápida para imprimir y preparar el pedido.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] pr-2">
                      <div ref={quickViewRef} className="space-y-4 rounded-lg bg-[color:var(--surface)] p-2">
                        <div className="rounded-lg border border-muted/40 bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Cliente</p>
                              <p className="text-base font-semibold">{order.client.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Pedido</p>
                              <p className="text-base font-semibold">#{order.id.slice(0, 8)}</p>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Creado</p>
                              <p className="text-sm font-semibold text-foreground">{formatDate(order.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Entrega</p>
                              <p className="text-sm font-semibold text-foreground">
                                {order.deliveryDate ? formatDate(order.deliveryDate, false) : "Sin fecha"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-muted-foreground">Contacto</p>
                              <p className="text-sm font-semibold text-foreground">
                                {order.contactPhone || order.contactName || "Sin contacto"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-muted/40 bg-white p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">Artículos</p>
                            <Badge variant="secondary">{order.items.length} items</Badge>
                          </div>
                          <div className="mt-3 overflow-hidden rounded-lg border border-muted/40">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                                <tr>
                                  <th className="px-3 py-2 font-medium">Producto</th>
                                  <th className="px-2 py-2 text-right font-medium">Cant.</th>
                                  <th className="px-2 py-2 text-right font-medium">Unidad</th>
                                  <th className="px-2 py-2 text-right font-medium">Precio</th>
                                  <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-muted/40">
                                {order.items.map((item) => (
                                  <tr key={item.orderItemId || item.productId}>
                                    <td className="px-3 py-2 font-medium text-foreground">{item.productName}</td>
                                    <td className="px-2 py-2 text-right">{item.quantity}</td>
                                    <td className="px-2 py-2 text-right text-muted-foreground">{item.unit || "—"}</td>
                                    <td className="px-2 py-2 text-right text-muted-foreground">
                                      {formatCurrency(item.unitPrice ?? 0)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold">
                                      {formatCurrency(item.subtotal ?? item.unitPrice * item.quantity)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                            <span className="text-muted-foreground">Total</span>
                            <span className="text-base font-semibold">{formatCurrency(quickViewTotals.total)}</span>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Button variant="ghost" onClick={() => setQuickViewOpen(false)}>
                        Cerrar
                      </Button>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={downloadQuickViewPdf}>
                          <Download className="mr-2 h-4 w-4" />
                          Descargar PDF
                        </Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FilePlus2 className="mr-2 h-4 w-4" />
                        {receiptReady ? "Actualizar remito" : "Generar remito"}
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Confirmar remito</DialogTitle>
                      <DialogDescription>
                        Ajusta las cantidades a enviar, marca sin stock cuando corresponda y suma reemplazos del catálogo.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        placeholder="Buscar artículo en el remito"
                        value={receiptSearch}
                        onChange={(event) => setReceiptSearch(event.target.value)}
                        className="w-full sm:max-w-md"
                        aria-label="Buscar artículo en el remito"
                      />
                    </div>
                    <ScrollArea className="max-h-[60vh] pr-2">
                      <div className="space-y-3 pr-1">
                        {visibleReceiptItems.map((item, index) => {
                          const isOutOfStock = Boolean(outOfStockMap[item.key]);
                          return (
                            <motion.div
                              key={item.key}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className="space-y-2 rounded-lg border border-(--neutral-200) bg-(--surface) p-3"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 space-y-1">
                                  <p className="truncate font-semibold">{item.productName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.orderedQuantity != null ? (
                                      <>
                                        Pedido: {item.orderedQuantity}
                                        {item.unit ? ` ${item.unit}` : ""}{" "}
                                        {item.lastDelivered != null ? `· Último remito: ${item.lastDelivered}` : ""}
                                      </>
                                    ) : (
                                      "Agregado desde catálogo"
                                    )}
                                  </p>
                                  {isOutOfStock ? (
                                    <p className="text-[11px] font-medium text-amber-700">Marcado sin stock para este remito.</p>
                                  ) : null}
                                </div>
                                <div className="flex w-full flex-col items-end gap-2 sm:w-auto">
                                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:justify-end">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-9 w-9"
                                      onClick={() => updateReceiptQuantity(item.key, item.value - 1)}
                                      disabled={isOutOfStock}
                                      aria-label={`Disminuir cantidad de ${item.productName}`}
                                    >
                                      -
                                    </Button>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={item.value}
                                      onChange={(event) => updateReceiptQuantity(item.key, Number(event.target.value))}
                                      className="w-20 text-center"
                                      aria-label={`Cantidad a remitir para ${item.productName}`}
                                      disabled={isOutOfStock}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-9 w-9"
                                      onClick={() => updateReceiptQuantity(item.key, item.value + 1)}
                                      disabled={isOutOfStock}
                                      aria-label={`Aumentar cantidad de ${item.productName}`}
                                    >
                                      +
                                    </Button>
                                    {item.isNew ? (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        aria-label="Quitar producto agregado"
                                        onClick={() => removeNewReceiptItem(item.key)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    ) : null}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <label className="inline-flex items-center gap-2 font-medium text-amber-700">
                                      <Checkbox
                                        checked={isOutOfStock}
                                        onCheckedChange={(checked) => toggleOutOfStock(item.key, Boolean(checked))}
                                        aria-label={`Marcar ${item.productName} sin stock`}
                                      />
                                      Sin stock
                                    </label>
                                    {item.isNew ? (
                                      <Badge variant="secondary" className="text-[11px]">
                                        Agregado
                                      </Badge>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                        {visibleReceiptItems.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-muted/50 bg-muted/10 px-3 py-4 text-sm text-muted-foreground">
                            No hay artículos que coincidan con la búsqueda.
                          </div>
                        ) : null}
                        <div className="rounded-lg border border-dashed border-(--neutral-300) bg-(--surface) p-3">
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-semibold">Agregar artículo del catálogo</p>
                            <p className="text-xs text-muted-foreground">
                              Úsalo para reemplazos o extras de último momento.
                            </p>
                          </div>
                          {catalogError ? (
                            <p className="mt-2 text-xs font-semibold text-destructive">{catalogError}</p>
                          ) : null}
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                            <Popover open={productSelectorOpen} onOpenChange={setProductSelectorOpen}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-between sm:w-64" disabled={catalogLoading}>
                                  <span className="truncate text-left">
                                    {selectedProductId
                                      ? catalog.find((p) => p.id === selectedProductId)?.name ?? "Producto seleccionado"
                                      : catalogLoading
                                        ? "Cargando catálogo..."
                                        : "Elegí un producto"}
                                  </span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 p-0" align="start">
                                <div className="border-b p-3">
                                  <Input
                                    placeholder="Buscar producto"
                                    value={productSearch}
                                    onChange={(event) => setProductSearch(event.target.value)}
                                  />
                                </div>
                                <ScrollArea className="max-h-64">
                                  <div className="space-y-1 p-2">
                                    {catalogLoading ? (
                                      <p className="px-2 py-1 text-xs text-muted-foreground">Cargando...</p>
                                    ) : filteredCatalog.length === 0 ? (
                                      <p className="px-2 py-1 text-xs text-muted-foreground">Sin coincidencias.</p>
                                    ) : (
                                      filteredCatalog.map((product) => (
                                        <button
                                          key={product.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedProductId(product.id);
                                            setProductSelectorOpen(false);
                                          }}
                                          className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                                        >
                                          <p className="truncate font-medium">{product.name}</p>
                                          <p className="text-[11px] text-muted-foreground">
                                            {product.unit ?? "Sin unidad"} · {formatCurrency(product.price)}
                                          </p>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </ScrollArea>
                              </PopoverContent>
                            </Popover>
                            <div className="flex w-full items-center gap-1 sm:w-auto sm:gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => setSelectedProductQty((prev) => Math.max(0, Math.round(prev) - 1))}
                                aria-label="Disminuir cantidad de producto a agregar"
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min={0}
                                value={selectedProductQty}
                                onChange={(event) => setSelectedProductQty(Number(event.target.value))}
                                className="w-full min-w-0 sm:w-24 text-center"
                                aria-label="Cantidad para agregar desde catálogo"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => setSelectedProductQty((prev) => Math.max(0, Math.round(prev) + 1))}
                                aria-label="Aumentar cantidad de producto a agregar"
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              onClick={handleAddProductFromCatalog}
                              disabled={!selectedProductId || generatingReceipt}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Agregar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="ghost" onClick={() => setReceiptModalOpen(false)} disabled={generatingReceipt}>
                          Cerrar
                        </Button>
                        <Button onClick={handleGenerateReceipt} disabled={generatingReceipt}>
                          {generatingReceipt ? "Guardando..." : receiptReady ? "Actualizar remito" : "Generar remito"}
                        </Button>
                        {message ? (
                          <Badge variant="secondary" className="text-[11px]">
                            Actualizado
                          </Badge>
                        ) : null}
                      </div>
                      <Button
                        variant="outline"
                        onClick={downloadPdf}
                        disabled={!receiptReady || downloading}
                        className={!receiptReady ? "text-muted-foreground" : undefined}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {receiptReady ? (downloading ? "Generando..." : "Descargar remito") : "Remito no disponible"}
                      </Button>
                    </DialogFooter>
                    </DialogContent>
                  </Dialog>
              </div>
              <div className="relative flex justify-end sm:justify-start">
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

            <Card className="border-[color:var(--neutral-200)] bg-white shadow-none">
              <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
                <CardHeader className="flex flex-row items-center justify-between px-3 py-2">
                  <div>
                    <CardTitle className="text-sm">Información del cliente</CardTitle>
                    <p className="text-xs text-muted-foreground">Proveedor, contacto, entrega y pago.</p>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
                      {infoOpen ? "Ocultar" : "Mostrar"}
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent className="space-y-4 px-3 pb-4">
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

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entrega programada</Label>
                    <div className="flex flex-wrap items-center gap-3">
                      <Popover open={deliveryPopoverOpen} onOpenChange={setDeliveryPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Badge
                            variant="secondary"
                            className="flex cursor-pointer items-center gap-1 text-[12px]"
                            title="Reprogramar entrega"
                          >
                            <Truck className="h-4 w-4" />
                            {deliveryDate
                              ? new Date(deliveryDate).toLocaleDateString("es-AR", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })
                              : "Sin fecha"}
                            {order.deliveryZoneName ? ` · Zona ${order.deliveryZoneName}` : ""}
                          </Badge>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          <Calendar
                            mode="single"
                            selected={deliveryDate ? new Date(deliveryDate) : undefined}
                            onSelect={(date) => {
                              setDeliveryPopoverOpen(false);
                              startUpdatingDelivery(async () => {
                                const iso = date ? new Date(date).toISOString() : null;
                                const response = await updateDeliveryDate({
                                  providerSlug: order.provider.slug,
                                  orderId: order.id,
                                  deliveryDate: iso,
                                });
                                if (response.success) {
                                  setDeliveryDate(iso);
                                  setMessage(response.message);
                                  setError(null);
                                } else {
                                  setError(response.errors.join("\n"));
                                }
                              });
                            }}
                            initialFocus
                          />
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeliveryPopoverOpen(false);
                                startUpdatingDelivery(async () => {
                                  const response = await updateDeliveryDate({
                                    providerSlug: order.provider.slug,
                                    orderId: order.id,
                                    deliveryDate: null,
                                  });
                                  if (response.success) {
                                    setDeliveryDate(null);
                                    setMessage(response.message);
                                    setError(null);
                                  } else {
                                    setError(response.errors.join("\n"));
                                  }
                                });
                              }}
                              disabled={updatingDelivery}
                            >
                              {updatingDelivery ? "Guardando..." : "Limpiar"}
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => setDeliveryPopoverOpen(false)}>
                              Cerrar
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {deliveryDate ? (
                        <span className="text-xs text-muted-foreground">
                          Ventana asignada automáticamente al crear el pedido.
                        </span>
                      ) : (
                        <span className="text-xs text-destructive">Sin fecha asignada. Configura reglas de entrega en el catálogo.</span>
                      )}
                    </div>
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
                </CollapsibleContent>
              </Collapsible>
            </Card>

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
                <div className="grid grid-cols-[1fr_repeat(3,minmax(70px,auto))] gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground sm:px-4">
                  <span>Producto</span>
                  <span className="text-right pr-1">Cant.</span>
                  <span className="text-right pr-1">P. unit</span>
                  <span className="text-right pl-1">Subtotal</span>
                </div>
                {order.items.map((item, index) => (
                  <motion.div
                    key={`${item.productId}-${index}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="grid grid-cols-[1fr_repeat(3,minmax(70px,auto))] items-center gap-3 px-3 py-2 text-sm sm:px-4"
                  >
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.unit ?? "Sin unidad"}</p>
                    </div>
                    <div className="text-right pr-1">
                      <p>{item.deliveredQuantity ?? item.quantity}</p>
                      {item.deliveredQuantity === 0 ? (
                        <p className="text-[11px] font-semibold text-amber-700">Sin stock en este remito</p>
                      ) : item.deliveredQuantity != null && item.deliveredQuantity !== item.quantity ? (
                        <p className="text-[11px] text-amber-600">Pedido: {item.quantity}</p>
                      ) : null}
                    </div>
                    <p className="text-right pr-1">{formatCurrency(item.unitPrice)}</p>
                    <p className="text-right pl-1 font-semibold">{formatCurrency(item.subtotal)}</p>
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
