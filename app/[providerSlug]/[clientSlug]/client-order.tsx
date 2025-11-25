"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, Eye, EyeOff, FileUp, LayoutGrid, Rows, Search, ShoppingBag, Wallet } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { buildWhatsAppLink, formatCurrency } from "@/lib/whatsapp";
import { WEEKDAYS, pickNextDelivery, type DeliveryRule } from "@/lib/delivery-windows";
import { createOrder, updatePaymentProof, type OrderSummaryItem } from "./actions";

const MotionTableRow = motion(TableRow);

export type Product = {
  id: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  price: number; // precio final con descuento aplicado
  basePrice?: number;
  discountPercent?: number | null;
  unit?: string | null;
  image_url?: string | null;
  category?: string | null;
  tags?: string[] | null;
  is_new?: boolean | null;
  is_out_of_stock?: boolean | null;
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

export type TransferProfile = {
  id: string;
  label?: string | null;
  alias?: string | null;
  cbu?: string | null;
  extraInfo?: string | null;
  isActive?: boolean | null;
};

export type PaymentSettings = {
  cashEnabled: boolean;
  transferEnabled: boolean;
  transferAlias?: string | null;
  transferCbu?: string | null;
  transferNotes?: string | null;
  transferProfiles?: TransferProfile[];
};

export type PublicOrderHistory = {
  id: string;
  status: string;
  paymentMethod?: "efectivo" | "transferencia" | null;
  paymentProofStatus?: "no_aplica" | "pendiente" | "subido" | null;
  paymentProofUrl?: string | null;
  total?: number | null;
  createdAt?: string | null;
  deliveryDate?: string | null;
  deliveryRuleId?: string | null;
  cutoffDate?: string | null;
  items?: {
    productName: string;
    unit?: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
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
  paymentSettings: PaymentSettings;
  deliveryRules: DeliveryRule[];
  history: PublicOrderHistory[];
};

export function ClientOrder({ provider, client, products, paymentSettings, history, deliveryRules }: Props) {
  const defaultPaymentMethod =
    paymentSettings.cashEnabled && !paymentSettings.transferEnabled
      ? "efectivo"
      : !paymentSettings.cashEnabled && paymentSettings.transferEnabled
        ? "transferencia"
        : paymentSettings.cashEnabled
          ? "efectivo"
          : "";

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [contactName, setContactName] = useState(() => client.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(() => client.contactPhone ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState<"retiro" | "envio" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia" | "">(defaultPaymentMethod as
    | "efectivo"
    | "transferencia"
    | "");
  const [paymentProofData, setPaymentProofData] = useState<{
    filename: string;
    contentType: string;
    base64: string;
    size: number;
  } | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [paymentProofError, setPaymentProofError] = useState<string | null>(null);
  const [uploadingProofFor, setUploadingProofFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [orderSent, setOrderSent] = useState(false);
  const [pendingOrder, startOrder] = useTransition();
  const [serverItems, setServerItems] = useState<OrderSummaryItem[] | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedDeliveryDate, setConfirmedDeliveryDate] = useState<string | null>(null);
  const [confirmedCutoffDate, setConfirmedCutoffDate] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [historyItems, setHistoryItems] = useState<PublicOrderHistory[]>(history);
  const [showSummary, setShowSummary] = useState(true);
  const [productView, setProductView] = useState<"cards" | "table">("cards");
  const [activeBrands, setActiveBrands] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const safeQuantities = useMemo(() => {
    const outIds = new Set(products.filter((product) => product.is_out_of_stock).map((p) => p.id));
    if (!outIds.size) return quantities;
    const next: Record<string, number> = {};
    Object.entries(quantities).forEach(([id, value]) => {
      if (outIds.has(id)) return;
      next[id] = value;
    });
    return next;
  }, [products, quantities]);

  const items = useMemo(
    () =>
      products
        .filter((product) => (safeQuantities[product.id] ?? 0) > 0)
        .map((product) => ({
          ...product,
          quantity: safeQuantities[product.id] ?? 0,
        })),
    [products, safeQuantities],
  );

  const availableCategories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      if (product.category) unique.add(product.category);
    });
    return Array.from(unique.values()).slice(0, 12);
  }, [products]);

  const availableBrands = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      if (product.brand) unique.add(product.brand);
    });
    return Array.from(unique.values()).slice(0, 12);
  }, [products]);

  const availableTags = useMemo(() => {
    const unique = new Map<string, string>();
    products.forEach((product) => {
      (product.tags ?? []).forEach((tag) => {
        const key = tag.toLowerCase();
        if (!unique.has(key)) unique.set(key, tag);
      });
    });
    return Array.from(unique.values()).slice(0, 18);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedCategories = new Set(activeCategories.map((c) => c.toLowerCase()));
    const normalizedTags = new Set(activeTags.map((t) => t.toLowerCase()));
    const normalizedBrands = new Set(activeBrands.map((b) => b.toLowerCase()));
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const searchReady = normalizedSearch.length >= 3;

    return products.filter((product) => {
      const matchesCategory =
        normalizedCategories.size === 0 ||
        (product.category ? normalizedCategories.has(product.category.toLowerCase()) : false);

      const matchesTag =
        normalizedTags.size === 0 ||
        (product.tags ?? []).some((tag) => normalizedTags.has(tag.toLowerCase()));

      const matchesBrand =
        normalizedBrands.size === 0 ||
        (product.brand ? normalizedBrands.has(product.brand.toLowerCase()) : false);

      const matchesSearch =
        !searchReady ||
        [product.name, product.description, product.brand, product.category, ...(product.tags ?? [])]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      return matchesCategory && matchesTag && matchesBrand && matchesSearch;
    });
  }, [activeBrands, activeCategories, activeTags, products, searchTerm]);

  const hasFilters = activeCategories.length > 0 || activeTags.length > 0 || activeBrands.length > 0;

  const availablePaymentMethods = useMemo(() => {
    const methods: ("efectivo" | "transferencia")[] = [];
    if (paymentSettings.cashEnabled) methods.push("efectivo");
    if (paymentSettings.transferEnabled) methods.push("transferencia");
    return methods;
  }, [paymentSettings]);

  const primaryTransferProfile = useMemo(
    () =>
      (paymentSettings.transferProfiles ?? []).find(
        (profile) => (profile.isActive ?? true) && (profile.alias || profile.cbu),
      ),
    [paymentSettings.transferProfiles],
  );

  const transferAlias = primaryTransferProfile?.alias ?? paymentSettings.transferAlias ?? null;
  const transferCbu = primaryTransferProfile?.cbu ?? paymentSettings.transferCbu ?? null;

  const paymentStatusLabel: Record<string, { label: string; tone: "muted" | "warn" | "ok" }> = {
    no_aplica: { label: "A pagar en la entrega", tone: "muted" },
    pendiente: { label: "Comprobante pendiente", tone: "warn" },
    subido: { label: "Comprobante cargado", tone: "ok" },
  };

  const statusBadge: Record<string, string> = {
    nuevo: "bg-[color:var(--info-light)] text-[color:var(--brand-deep)]",
    preparando: "bg-[color:var(--warning-light)] text-[color:var(--warning)]",
    enviado: "bg-[color:var(--info-light)] text-[color:var(--brand-deep)]",
    entregado: "bg-[color:var(--success-light)] text-[color:var(--success)]",
    cancelado: "bg-[color:var(--error-light)] text-[color:var(--error)]",
  };

  const deliverySlot = useMemo(() => {
    if (!deliveryRules.length) return null;
    return pickNextDelivery(deliveryRules, new Date(), "America/Argentina/Buenos_Aires");
  }, [deliveryRules]);

  const formatDayLabel = useCallback((value?: string | null | Date) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: "America/Argentina/Buenos_Aires",
    });
  }, []);

  const formatTimeLabel = useCallback((value?: string | null | Date) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    });
  }, []);

  const formatDateTime = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })
      : "Fecha no disponible";

  const isCompleted = (order: PublicOrderHistory) =>
    order.status === "entregado" &&
    (order.paymentMethod !== "transferencia" || order.paymentProofStatus === "subido");

  const pendingHistory = useMemo(
    () => historyItems.filter((item) => !isCompleted(item)),
    [historyItems],
  );
  const completedHistory = useMemo(
    () => historyItems.filter((item) => isCompleted(item)),
    [historyItems],
  );
  const historyAccordionDefaults = useMemo(() => ["pending"], []);

  const uploadHistoryProof = async (orderId: string, file?: File | null) => {
    if (!file) return;
    try {
      setUploadingProofFor(orderId);
      const { payload, preview } = await compressProofFile(file);
      const response = await updatePaymentProof({
        providerSlug: provider.slug,
        clientSlug: client.slug,
        orderId,
        paymentProof: payload,
      });

      if (!response.success) {
        setFormError(response.errors.join("\n"));
        return;
      }

      setHistoryItems((prev) =>
        prev.map((item) =>
          item.id === orderId
            ? {
                ...item,
                paymentProofStatus: response.paymentProofStatus,
                paymentProofUrl: response.paymentProofUrl ?? preview ?? item.paymentProofUrl ?? null,
              }
            : item,
        ),
      );
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setUploadingProofFor(null);
    }
  };

  const handleProofFile = async (file?: File | null) => {
    setPaymentProofError(null);
    if (!file) {
      setPaymentProofData(null);
      setPaymentProofPreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPaymentProofError("El comprobante no puede superar los 5MB.");
      setPaymentProofData(null);
      setPaymentProofPreview(null);
      return;
    }

    const allowedType =
      file.type?.startsWith("image/") || file.type === "application/pdf" || file.type?.includes("pdf");

    if (!allowedType) {
      setPaymentProofError("Sube una imagen o PDF.");
      setPaymentProofData(null);
      setPaymentProofPreview(null);
      return;
    }

    const compressImage = async (source: File): Promise<{ dataUrl: string; contentType: string }> => {
      if (!source.type.startsWith("image/")) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ dataUrl: typeof reader.result === "string" ? reader.result : "", contentType: source.type || "application/pdf" });
          reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
          reader.readAsDataURL(source);
        });
      }

      const imageDataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
        reader.readAsDataURL(source);
      });

      const img = document.createElement("img");
      img.src = imageDataUrl;

      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return { dataUrl: imageDataUrl, contentType: source.type || "image/jpeg" };

      const maxSize = 1400;
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL("image/webp", 0.55);
      return { dataUrl: compressed, contentType: "image/webp" };
    };

    const { dataUrl, contentType } = await compressImage(file);

    const [, base64Content] = dataUrl.split(",");
    const base64Clean = (base64Content || dataUrl || "").replace(/^data:[^,]+,/, "");

    setPaymentProofData({
      filename: file.name,
      contentType: contentType || file.type || "application/octet-stream",
      base64: base64Clean,
      size: file.size,
    });
    setPaymentProofPreview(contentType.startsWith("image/") ? dataUrl : null);
  };

  const compressProofFile = async (file: File) => {
    const allowedType =
      file.type?.startsWith("image/") || file.type === "application/pdf" || file.type?.includes("pdf");
    if (!allowedType) throw new Error("Sube una imagen o PDF.");
    if (file.size > 5 * 1024 * 1024) throw new Error("El comprobante no puede superar los 5MB.");

    const compressImage = async (source: File): Promise<{ dataUrl: string; contentType: string }> => {
      if (!source.type.startsWith("image/")) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({ dataUrl: typeof reader.result === "string" ? reader.result : "", contentType: source.type || "application/pdf" });
          reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
          reader.readAsDataURL(source);
        });
      }

      const imageDataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
        reader.readAsDataURL(source);
      });

      const img = document.createElement("img");
      img.src = imageDataUrl;

      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return { dataUrl: imageDataUrl, contentType: source.type || "image/jpeg" };

      const maxSize = 1400;
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL("image/webp", 0.55);
      return { dataUrl: compressed, contentType: "image/webp" };
    };

    const { dataUrl, contentType } = await compressImage(file);
    const [, base64Content] = dataUrl.split(",");
    const base64Clean = (base64Content || dataUrl || "").replace(/^data:[^,]+,/, "");

    return {
      payload: {
        filename: file.name,
        contentType: contentType || file.type || "application/octet-stream",
        base64: base64Clean,
        size: file.size,
      },
      preview: contentType.startsWith("image/") ? dataUrl : null,
    };
  };

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
    deliveryMethod: deliveryMethod ?? undefined,
    note,
    paymentMethod: (paymentMethod || undefined) as "efectivo" | "transferencia" | undefined,
    paymentProofStatus:
      paymentMethod === "transferencia"
        ? paymentProofData
          ? "subido"
          : "pendiente"
        : "no_aplica",
    items: summaryItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      unit: item.unit ?? undefined,
    })),
  })?.href;

  return (
    <div className="w-full bg-[color:var(--surface)]">
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
          className="flex flex-col gap-2 rounded-2xl border border-[color:var(--neutral-200)] bg-white p-5 shadow-sm backdrop-blur md:p-6"
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

        <section className={`grid gap-5 ${showSummary ? "md:grid-cols-[2fr_1fr]" : "md:grid-cols-1"}`}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
            className="flex flex-col gap-4"
          >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Catálogo</h2>
              <Badge variant="secondary">Mobile-first</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-full border border-[color:var(--neutral-200)] bg-white/70 p-1 shadow-sm backdrop-blur">
                <Button
                  type="button"
                  size="sm"
                  variant={productView === "cards" ? "secondary" : "ghost"}
                  className="gap-2 rounded-full px-3"
                  onClick={() => setProductView("cards")}
                  aria-pressed={productView === "cards"}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Tarjetas
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={productView === "table" ? "secondary" : "ghost"}
                  className="gap-2 rounded-full px-3"
                  onClick={() => setProductView("table")}
                  aria-pressed={productView === "table"}
                >
                  <Rows className="h-4 w-4" />
                  Tabla
                </Button>
              </div>
              {hasFilters ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setActiveCategories([]);
                    setActiveTags([]);
                    setActiveBrands([]);
                  }}
                >
                  Quitar filtros
                </Button>
              ) : null}
            </div>
          </div>

          <div>
            <Accordion type="single" collapsible className="rounded-xl border border-[color:var(--neutral-200)] bg-[color:var(--surface)] shadow-sm">
              <AccordionItem value="filters" className="border-0">
                <AccordionTrigger className="items-center px-3 py-2">
                  <div className="flex flex-col text-left">
                    <p className="text-sm font-semibold">Filtros</p>
                    <span className="text-xs text-muted-foreground">Categorías, hashtags y marcas</span>
                  </div>
                  {hasFilters ? (
                    <Badge variant="secondary">{activeCategories.length + activeTags.length + activeBrands.length} activos</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Opcional</span>
                  )}
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-0">
                  <div className="space-y-3">
                    <div className="rounded-xl border border-[color:var(--neutral-200)] bg-white p-3 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">Filtrar por categoría</p>
                          <span className="text-xs text-muted-foreground">Agrupa por familia</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveCategories(availableCategories)}
                            disabled={!availableCategories.length}
                          >
                            Todos
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveCategories([])}
                            disabled={!activeCategories.length}
                          >
                            Ninguno
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {availableCategories.length ? (
                          availableCategories.map((category) => {
                            const selected = activeCategories.includes(category);
                            return (
                              <Button
                                key={category}
                                type="button"
                                size="sm"
                                variant={selected ? "secondary" : "outline"}
                                className={`h-8 rounded-full px-3 text-xs transition-shadow ${selected ? "border-primary/60 shadow-[0_0_0_2px_rgba(59,130,246,0.4)]" : ""}`}
                                onClick={() =>
                                  setActiveCategories((prev) =>
                                    selected ? prev.filter((c) => c !== category) : [...prev, category],
                                  )
                                }
                                aria-pressed={selected}
                              >
                                {category}
                              </Button>
                            );
                          })
                        ) : (
                          <p className="text-xs text-muted-foreground">Aún no hay categorías cargadas.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[color:var(--neutral-200)] bg-white p-3 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">Filtrar por hashtag</p>
                          <span className="text-xs text-muted-foreground">Explora etiquetas</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTags(availableTags)}
                            disabled={!availableTags.length}
                          >
                            Todos
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTags([])}
                            disabled={!activeTags.length}
                          >
                            Ninguno
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {availableTags.length ? (
                          availableTags.map((tag) => {
                            const selected = activeTags.includes(tag);
                            return (
                              <Button
                                key={tag}
                                type="button"
                                size="sm"
                                variant={selected ? "secondary" : "outline"}
                                className={`h-8 rounded-full px-3 text-xs transition-shadow ${selected ? "border-primary/60 shadow-[0_0_0_2px_rgba(59,130,246,0.4)]" : ""}`}
                                onClick={() =>
                                  setActiveTags((prev) => (selected ? prev.filter((t) => t !== tag) : [...prev, tag]))
                                }
                                aria-pressed={selected}
                              >
                                #{tag}
                              </Button>
                            );
                          })
                        ) : (
                          <p className="text-xs text-muted-foreground">Aún no hay hashtags cargados.</p>
                        )}
                      </div>
                    </div>

                    {availableBrands.length ? (
                      <div className="rounded-xl border border-[color:var(--neutral-200)] bg-white p-3 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">Filtrar por marca</p>
                            <span className="text-xs text-muted-foreground">Explora proveedores</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveBrands(availableBrands)}
                              disabled={!availableBrands.length}
                            >
                              Todos
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveBrands([])}
                              disabled={!activeBrands.length}
                            >
                              Ninguno
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {availableBrands.map((brand) => {
                            const selected = activeBrands.includes(brand);
                            return (
                              <Button
                                key={brand}
                                type="button"
                                size="sm"
                                variant={selected ? "secondary" : "outline"}
                                className={`h-8 rounded-full px-3 text-xs transition-shadow ${selected ? "border-primary/60 shadow-[0_0_0_2px_rgba(59,130,246,0.4)]" : ""}`}
                                onClick={() =>
                                  setActiveBrands((prev) =>
                                    selected ? prev.filter((b) => b !== brand) : [...prev, brand],
                                  )
                                }
                                aria-pressed={selected}
                              >
                                {brand}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[color:var(--neutral-200)] bg-[color:var(--surface)] p-4 text-sm text-muted-foreground">
              Este proveedor aún no tiene productos activos.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="space-y-3 rounded-xl border border-dashed border-[color:var(--neutral-200)] bg-[color:var(--surface)] p-4 text-sm text-muted-foreground">
              <p>No hay productos que coincidan con los filtros aplicados.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => {
                  setActiveCategories([]);
                  setActiveTags([]);
                  setActiveBrands([]);
                }}
              >
                Ver todo el catálogo
              </Button>
            </div>
          ) : productView === "table" ? (
            <div className="overflow-hidden rounded-xl border border-[color:var(--neutral-200)] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[color:var(--surface)]">
                      <TableHead className="min-w-[220px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Producto
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Precio
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Unidad
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Categoría
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Estado
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Cantidad
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product, index) => {
                      const hasDiscount = (product.discountPercent ?? 0) > 0;
                      const outOfStock = Boolean(product.is_out_of_stock);
                      const quantity = safeQuantities[product.id] ?? 0;
                      return (
                        <MotionTableRow
                          key={product.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`transition-colors hover:bg-[color:var(--surface)]/60 ${
                            quantity > 0
                              ? "border border-primary/60 shadow-[0_0_0_2px_rgba(59,130,246,0.3)]"
                              : "border-b border-[color:var(--neutral-200)] last:border-0"
                          }`}
                        >
                          <TableCell className="align-middle">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 overflow-hidden rounded-lg border border-[color:var(--neutral-200)] bg-[color:var(--surface)] shadow-sm">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={`Imagen de ${product.name}`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-[color:var(--surface)] to-foreground/5 text-xs font-semibold text-foreground/70">
                                    {product.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold">{product.name}</span>
                                    {product.brand ? (
                                      <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                                        {product.brand}
                                      </Badge>
                                    ) : null}
                                    {product.is_new ? (
                                      <Badge variant="secondary" className="rounded-full px-2 py-0 text-[11px]">
                                        Nuevo
                                      </Badge>
                                    ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {product.description || "Sin descripción"}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  {product.category ? (
                                    <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                                      {product.category}
                                    </Badge>
                                  ) : null}
                                  {(product.tags ?? []).slice(0, 3).map((tag) => (
                                    <Badge key={`${product.id}-${tag}`} variant="secondary" className="rounded-full px-2 py-0 text-[11px]">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="space-y-1 text-sm font-semibold">
                              {hasDiscount ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="line-through">{formatCurrency(product.basePrice ?? product.price)}</span>
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                    -{Math.round(product.discountPercent ?? 0)}%
                                  </span>
                                </div>
                              ) : null}
                              <div>
                                {formatCurrency(product.price)}
                                {product.unit ? (
                                  <span className="text-[11px] text-muted-foreground"> · {product.unit}</span>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground align-middle">
                            {product.unit ?? "Unidad"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground align-middle">
                            {product.category ?? "Sin categoría"}
                          </TableCell>
                          <TableCell className="align-middle">
                            {outOfStock ? (
                              <Badge variant="destructive" className="rounded-full px-2 py-0 text-[11px]">
                                Sin stock
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                                Disponible
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            <div className="ml-auto flex w-fit items-center gap-2 rounded-full border border-[color:var(--neutral-200)] bg-secondary px-2 py-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={`Restar ${product.name}`}
                                disabled={outOfStock}
                                onClick={() =>
                                  setQuantities((prev) => ({
                                    ...prev,
                                    [product.id]: Math.max((prev[product.id] ?? 0) - 1, 0),
                                  }))
                                }
                              >
                                -
                              </Button>
                              <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={`Sumar ${product.name}`}
                                disabled={outOfStock}
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
                          </TableCell>
                        </MotionTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredProducts.map((product) => {
                const hasDiscount = (product.discountPercent ?? 0) > 0;
                const outOfStock = Boolean(product.is_out_of_stock);
                const quantity = safeQuantities[product.id] ?? 0;
                const isSelected = quantity > 0;
                return (
                  <Card
                    key={product.id}
                    className={`overflow-hidden border-[color:var(--neutral-200)] bg-white shadow-sm transition-shadow ${
                      isSelected ? "border-primary/60 shadow-[0_0_0_2px_rgba(59,130,246,0.35)]" : ""
                    }`}
                  >
                    {product.image_url ? (
                      <div className="h-40 w-full overflow-hidden bg-[color:var(--surface)]">
                        <img
                          src={product.image_url}
                          alt={`Imagen de ${product.name}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <CardHeader className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base font-semibold">{product.name}</CardTitle>
                        {product.brand ? (
                          <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                            {product.brand}
                          </Badge>
                        ) : null}
                        {product.is_new ? (
                          <Badge variant="default" className="rounded-full px-2 py-0 text-[11px]">
                            Nuevo
                          </Badge>
                        ) : null}
                        {outOfStock ? (
                          <Badge variant="destructive" className="rounded-full px-2 py-0 text-[11px]">
                            Sin stock
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.description || "Sin descripción"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {product.category ? (
                          <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                            {product.category}
                          </Badge>
                        ) : null}
                        {(product.tags ?? []).slice(0, 4).map((tag) => (
                          <Badge key={`${product.id}-${tag}`} variant="secondary" className="rounded-full px-2 py-0 text-[11px]">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between gap-3">
                      <div className="space-y-1">
                        {hasDiscount ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="line-through">{formatCurrency(product.basePrice ?? product.price)}</span>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                              -{Math.round(product.discountPercent ?? 0)}%
                            </span>
                          </div>
                        ) : null}
                        <div className="text-lg font-semibold">
                          {formatCurrency(product.price)}
                          {product.unit ? (
                            <span className="text-xs text-muted-foreground"> · {product.unit}</span>
                          ) : null}
                        </div>
                        {outOfStock ? (
                          <p className="text-xs text-destructive">No disponible para agregar.</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-[color:var(--neutral-200)] bg-secondary px-2 py-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Restar ${product.name}`}
                          disabled={outOfStock}
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
                          {safeQuantities[product.id] ?? 0}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Sumar ${product.name}`}
                          disabled={outOfStock}
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
                );
              })}
            </div>
          )}
        </motion.div>

          <AnimatePresence initial={false}>
            {showSummary ? (
              <motion.aside
                key="summary-panel"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="sticky top-4 h-fit space-y-4 rounded-2xl border border-[color:var(--neutral-200)] bg-white p-4 shadow-sm backdrop-blur md:p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Resumen</h2>
                    <Badge>{items.length} items</Badge>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Ocultar resumen"
                    onClick={() => setShowSummary(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </div>
                <Separator />
                <div className="space-y-1 rounded-xl border border-[color:var(--neutral-200)] bg-[color:var(--surface)] p-3">
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
                    if (!paymentMethod) {
                      setFormError("Selecciona un método de pago.");
                      return;
                    }
                    if (!availablePaymentMethods.includes(paymentMethod as "efectivo" | "transferencia")) {
                      setFormError("El proveedor desactivó este método de pago.");
                      return;
                    }
                    if (paymentProofError) {
                      setFormError(paymentProofError);
                      return;
                    }
                    if (!deliverySlot) {
                      setFormError("El proveedor todavía no configuró las ventanas de entrega.");
                      return;
                    }
                    setFormError(null);
                    startOrder(async () => {
                      const response = await createOrder({
                        providerSlug: provider.slug,
                        clientSlug: client.slug,
                        contactName,
                        contactPhone,
                        deliveryMethod: deliveryMethod ?? undefined,
                        paymentMethod: paymentMethod as "efectivo" | "transferencia",
                        paymentProof: paymentMethod === "transferencia" ? paymentProofData ?? undefined : undefined,
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
                        setConfirmedDeliveryDate(response.deliveryDate ?? null);
                        setConfirmedCutoffDate(response.cutoffDate ?? null);
                        setPaymentProofData(null);
                        setPaymentProofPreview(null);
                        setHistoryItems((prev) => [
                          {
                            id: response.orderId,
                            status: "nuevo",
                            paymentMethod: response.paymentMethod,
                            paymentProofStatus: response.paymentProofStatus,
                            paymentProofUrl: response.paymentProofUrl ?? null,
                            total: response.total,
                            deliveryDate: response.deliveryDate ?? null,
                            deliveryRuleId: response.deliveryRuleId ?? null,
                            cutoffDate: response.cutoffDate ?? null,
                            items: response.items.map((item) => ({
                              productName: item.name,
                              unit: item.unit,
                              quantity: item.quantity,
                              unitPrice: item.unitPrice,
                              subtotal: item.unitPrice * item.quantity,
                            })),
                            createdAt: new Date().toISOString(),
                          },
                          ...prev,
                        ]);
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
                    <Select
                      value={deliveryMethod ?? "none"}
                      onValueChange={(value) =>
                        setDeliveryMethod(value === "none" ? null : (value as "retiro" | "envio"))
                      }
                    >
                      <SelectTrigger id="deliveryMethod">
                        <SelectValue placeholder="Selecciona entrega" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin especificar</SelectItem>
                        <SelectItem value="retiro">Retiro</SelectItem>
                        <SelectItem value="envio">Envío</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Método de pago</Label>
                    <Select
                      value={paymentMethod || "none"}
                      onValueChange={(value) => {
                        const normalized = value === "none" ? "" : (value as "efectivo" | "transferencia");
                        setPaymentMethod(normalized);
                        if (normalized !== "transferencia") {
                          setPaymentProofData(null);
                          setPaymentProofPreview(null);
                          setPaymentProofError(null);
                        }
                      }}
                      disabled={availablePaymentMethods.length === 0}
                    >
                      <SelectTrigger id="paymentMethod">
                        <SelectValue
                          placeholder={
                            availablePaymentMethods.length === 0
                              ? "Sin métodos activos"
                              : "Selecciona pago"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePaymentMethods.length === 0 ? (
                          <SelectItem value="none" disabled>
                            El proveedor no tiene pagos activos
                          </SelectItem>
                        ) : null}
                        {paymentSettings.cashEnabled ? <SelectItem value="efectivo">Efectivo</SelectItem> : null}
                        {paymentSettings.transferEnabled ? (
                          <SelectItem value="transferencia">Transferencia</SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                    {paymentMethod === "efectivo" ? (
                      <p className="text-xs text-muted-foreground">
                        Marcaremos el pedido como <span className="font-semibold">“A pagar en la entrega”</span>.
                      </p>
                    ) : null}
                    {paymentMethod === "transferencia" ? (
                      <div className="space-y-3 rounded-lg border border-[color:var(--neutral-200)] bg-[color:var(--surface)] p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Datos de transferencia</p>
                          <Badge variant="outline" className="flex items-center gap-1 text-[11px]">
                            <CreditCard className="h-3.5 w-3.5" />
                            Transferencia
                          </Badge>
                        </div>
                        {primaryTransferProfile?.label ? (
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {primaryTransferProfile.label}
                          </p>
                        ) : null}
                        {transferAlias ? <p className="text-sm font-semibold">Alias: {transferAlias}</p> : null}
                        {transferCbu ? <p className="text-sm font-semibold">CBU/CVU: {transferCbu}</p> : null}
                        {!transferAlias && !transferCbu ? (
                          <p className="text-xs text-muted-foreground">El proveedor no cargó alias/CBU.</p>
                        ) : null}
                        {paymentSettings.transferNotes ? (
                          <p className="text-xs text-muted-foreground">{paymentSettings.transferNotes}</p>
                        ) : null}
                        <div className="space-y-2">
                          <Label htmlFor="paymentProof" className="text-xs">
                            Comprobante (opcional)
                          </Label>
                          <Input
                            id="paymentProof"
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(event) => void handleProofFile(event.target.files?.[0])}
                          />
                          {paymentProofPreview ? (
                            <div className="overflow-hidden rounded-lg border border-[color:var(--neutral-200)] bg-white">
                              <img src={paymentProofPreview} alt="Comprobante de pago" className="w-full object-cover" />
                            </div>
                          ) : paymentProofData ? (
                            <div className="flex items-center gap-2 rounded-md border border-[color:var(--neutral-200)] bg-white px-2 py-1 text-xs">
                              <FileUp className="h-4 w-4 text-primary" />
                              <span className="truncate">{paymentProofData.filename}</span>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Puedes subir la captura ahora o enviarla luego por WhatsApp.
                            </p>
                          )}
                          {paymentProofError ? (
                            <p className="text-xs text-destructive">{paymentProofError}</p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
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
                  <div className="space-y-3 rounded-lg border border-[color:var(--neutral-200)] bg-[color:var(--surface)] p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">Entrega estimada</p>
                      <Badge variant="outline" className="text-[11px]">
                        {deliverySlot ? WEEKDAYS[deliverySlot.deliveryDate.getDay()] : "Sin reglas"}
                      </Badge>
                    </div>
                    {deliverySlot ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-tight">
                          Entrega estimada {formatDayLabel(deliverySlot.deliveryDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hacé el pedido antes de {WEEKDAYS[deliverySlot.cutoffDate.getDay()]} {formatTimeLabel(deliverySlot.cutoffDate)}.
                        </p>
                        {confirmedDeliveryDate ? (
                          <p className="text-xs text-emerald-600 dark:text-emerald-300">
                            Tu pedido se guardó para {formatDayLabel(confirmedDeliveryDate)}.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-xs text-destructive">
                        El proveedor aún no configuró horarios de entrega, avísale o vuelve más tarde.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 rounded-lg border border-[color:var(--neutral-200)] bg-[color:var(--surface)] p-3">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">Pago seleccionado</p>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      {paymentMethod === "transferencia" ? (
                        <CreditCard className="h-4 w-4 text-primary" />
                      ) : paymentMethod === "efectivo" ? (
                        <Wallet className="h-4 w-4 text-primary" />
                      ) : null}
                      <span className="font-semibold">
                        {paymentMethod === "transferencia"
                          ? "Transferencia"
                          : paymentMethod === "efectivo"
                            ? "Efectivo"
                            : "Elegí un método de pago"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {paymentMethod === "transferencia"
                        ? "Podrás adjuntar o enviar luego el comprobante."
                        : paymentMethod === "efectivo"
                          ? "Marcaremos el pedido como a pagar al recibir."
                          : "Selecciona un método para continuar."}
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={items.length === 0 || !deliverySlot}>
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
            ) : null}
          </AnimatePresence>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          className="space-y-4 rounded-2xl border border-[color:var(--neutral-200)] bg-white p-4 shadow-sm backdrop-blur"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Historial de pedidos</h3>
              <p className="text-sm text-muted-foreground">
                Revisa estados anteriores y el estado del comprobante.
              </p>
            </div>
            <Badge variant="secondary">{historyItems.length} pedidos</Badge>
          </div>
          <Separator />
          {historyItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay pedidos registrados para esta tienda.
            </p>
          ) : (
            <div className="space-y-4">
              <Accordion
                type="multiple"
                defaultValue={historyAccordionDefaults}
                className="overflow-hidden rounded-xl border border-[color:var(--neutral-200)] bg-white"
              >
                <AccordionItem value="pending" className="border-b border-[color:var(--neutral-200)] last:border-0">
                  <AccordionTrigger className="items-center px-3 py-3 sm:px-4">
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="space-y-1 text-left">
                        <p className="text-sm font-semibold">Pendientes</p>
                        <p className="text-xs font-normal text-muted-foreground">
                          Pedidos por confirmar, preparar o enviar.
                        </p>
                      </div>
                      <Badge variant="outline">{pendingHistory.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 sm:px-3">
                    {pendingHistory.length === 0 ? (
                      <p className="px-2 pb-2 text-xs text-muted-foreground">Sin pedidos pendientes.</p>
                    ) : (
                      <div className="space-y-3 pb-3">
                        {pendingHistory.map((order, index) => {
                          const paymentStatus =
                            paymentStatusLabel[order.paymentProofStatus ?? "no_aplica"] ??
                            paymentStatusLabel.no_aplica;
                          const paymentLabel =
                            order.paymentMethod === "transferencia"
                              ? "Transferencia"
                              : order.paymentMethod === "efectivo"
                                ? "Efectivo"
                                : "Pago";
                          const statusText =
                            order.status === "entregado"
                              ? "Completado"
                              : ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status;
                          return (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className="space-y-2 rounded-xl border border-[color:var(--neutral-200)] bg-[color:var(--surface)] px-3 py-3"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold">
                                    Pedido #{order.id.slice(0, 8)} · {formatCurrency(order.total ?? 0)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[order.status] ?? "bg-border text-foreground"}`}
                                  >
                                    {statusText}
                                  </span>
                                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                    {order.paymentMethod === "transferencia" ? (
                                      <CreditCard className="h-3.5 w-3.5" />
                                    ) : (
                                      <Wallet className="h-3.5 w-3.5" />
                                    )}
                                    {paymentLabel}
                                  </Badge>
                                  <Badge
                                    variant={
                                      paymentStatus.tone === "ok"
                                        ? "secondary"
                                        : paymentStatus.tone === "warn"
                                          ? "outline"
                                          : "outline"
                                    }
                                    className={
                                      paymentStatus.tone === "warn"
                                        ? "border-amber-400/60 text-amber-700 dark:text-amber-200"
                                        : paymentStatus.tone === "ok"
                                          ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-200"
                                          : ""
                                    }
                                  >
                                    {paymentStatus.label}
                                  </Badge>
                                  {order.paymentProofUrl ? (
                                    <Button asChild size="sm" variant="ghost" className="text-xs">
                                      <a href={order.paymentProofUrl} target="_blank" rel="noreferrer">
                                        Ver comprobante
                                      </a>
                                    </Button>
                                  ) : null}
                                  <Button asChild size="sm" variant="outline" className="text-xs">
                                    <a
                                      href={`/${provider.slug}/${client.slug}/orders/${order.id}/receipt`}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Imprimir remito
                                    </a>
                                  </Button>
                                </div>
                              </div>
                              {order.items?.length ? (
                                <div className="overflow-hidden rounded-lg border border-[color:var(--neutral-200)] bg-white">
                                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-4">
                                    <span>Producto</span>
                                    <span className="text-right">Cant.</span>
                                    <span className="text-right">P. unit</span>
                                    <span className="text-right">Subtotal</span>
                                  </div>
                                  {order.items.map((item, idx) => (
                                    <motion.div
                                      key={`${order.id}-${idx}`}
                                      initial={{ opacity: 0, y: 6 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: idx * 0.02 }}
                                      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-3 py-2 text-sm sm:px-4"
                                    >
                                      <div>
                                        <p className="font-medium">{item.productName}</p>
                                        <p className="text-xs text-muted-foreground">{item.unit ?? "Unidad"}</p>
                                      </div>
                                      <p className="text-right">{item.quantity}</p>
                                      <p className="text-right">{formatCurrency(item.unitPrice)}</p>
                                      <p className="text-right font-semibold">{formatCurrency(item.subtotal)}</p>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">Sin detalle disponible.</p>
                              )}
                              {order.paymentMethod === "transferencia" && order.paymentProofStatus !== "subido" ? (
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <Label
                                    htmlFor={`proof-${order.id}`}
                                    className="flex cursor-pointer items-center gap-2 rounded-md border border-[color:var(--neutral-200)] bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-card/90"
                                  >
                                    <FileUp className="h-4 w-4 text-primary" />
                                    Cargar comprobante
                                  </Label>
                                  <input
                                    id={`proof-${order.id}`}
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={(event) => void uploadHistoryProof(order.id, event.target.files?.[0] ?? null)}
                                  />
                                  {uploadingProofFor === order.id ? (
                                    <span className="text-xs text-primary">Subiendo...</span>
                                  ) : (
                                    <span>Estado: {paymentStatus.label}</span>
                                  )}
                                </div>
                              ) : null}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="completed" className="border-b border-[color:var(--neutral-200)] last:border-0">
                  <AccordionTrigger className="items-center px-3 py-3 sm:px-4">
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="space-y-1 text-left">
                        <p className="text-sm font-semibold">Completados</p>
                        <p className="text-xs font-normal text-muted-foreground">
                          Pedidos entregados y con comprobante validado.
                        </p>
                      </div>
                      <Badge variant="outline">{completedHistory.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 sm:px-3">
                    {completedHistory.length === 0 ? (
                      <p className="px-2 pb-2 text-xs text-muted-foreground">Sin pedidos completados.</p>
                    ) : (
                      <div className="space-y-3 pb-3">
                        {completedHistory.map((order, index) => {
                          const paymentStatus =
                            paymentStatusLabel[order.paymentProofStatus ?? "no_aplica"] ??
                            paymentStatusLabel.no_aplica;
                          const paymentLabel =
                            order.paymentMethod === "transferencia"
                              ? "Transferencia"
                              : order.paymentMethod === "efectivo"
                                ? "Efectivo"
                                : "Pago";
                          const statusText =
                            order.status === "entregado"
                              ? "Completado"
                              : ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status;
                          return (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className="space-y-2 rounded-xl border border-[color:var(--neutral-200)] bg-[color:var(--surface)] px-3 py-3"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold">
                                    Pedido #{order.id.slice(0, 8)} · {formatCurrency(order.total ?? 0)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[order.status] ?? "bg-border text-foreground"}`}
                                  >
                                    {statusText}
                                  </span>
                                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                    {order.paymentMethod === "transferencia" ? (
                                      <CreditCard className="h-3.5 w-3.5" />
                                    ) : (
                                      <Wallet className="h-3.5 w-3.5" />
                                    )}
                                    {paymentLabel}
                                  </Badge>
                                  <Badge
                                    variant={
                                      paymentStatus.tone === "ok"
                                        ? "secondary"
                                        : paymentStatus.tone === "warn"
                                          ? "outline"
                                          : "outline"
                                    }
                                    className={
                                      paymentStatus.tone === "warn"
                                        ? "border-amber-400/60 text-amber-700 dark:text-amber-200"
                                        : paymentStatus.tone === "ok"
                                          ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-200"
                                          : ""
                                    }
                                  >
                                    {paymentStatus.label}
                                  </Badge>
                                  {order.paymentProofUrl ? (
                                    <Button asChild size="sm" variant="ghost" className="text-xs">
                                      <a href={order.paymentProofUrl} target="_blank" rel="noreferrer">
                                        Ver comprobante
                                      </a>
                                    </Button>
                                  ) : null}
                                  <Button asChild size="sm" variant="outline" className="text-xs">
                                    <a
                                      href={`/${provider.slug}/${client.slug}/orders/${order.id}/receipt`}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Imprimir remito
                                    </a>
                                  </Button>
                                </div>
                              </div>
                              {order.items?.length ? (
                                <div className="overflow-hidden rounded-lg border border-[color:var(--neutral-200)] bg-white">
                                  <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-4">
                                    <span>Producto</span>
                                    <span className="text-right">Cant.</span>
                                    <span className="text-right">P. unit</span>
                                    <span className="text-right">Subtotal</span>
                                  </div>
                                  {order.items.map((item, idx) => (
                                    <motion.div
                                      key={`${order.id}-${idx}`}
                                      initial={{ opacity: 0, y: 6 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: idx * 0.02 }}
                                      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-3 py-2 text-sm sm:px-4"
                                    >
                                      <div>
                                        <p className="font-medium">{item.productName}</p>
                                        <p className="text-xs text-muted-foreground">{item.unit ?? "Unidad"}</p>
                                      </div>
                                      <p className="text-right">{item.quantity}</p>
                                      <p className="text-right">{formatCurrency(item.unitPrice)}</p>
                                      <p className="text-right font-semibold">{formatCurrency(item.subtotal)}</p>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">Sin detalle disponible.</p>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </motion.section>
      </main>
      <AnimatePresence>
        <motion.div
          key="floating-actions"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6"
        >
          <div className="group/fab flex flex-col gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-full border-primary/40 bg-white/90 px-3 text-primary shadow-lg shadow-primary/20 backdrop-blur"
                  aria-label="Buscar artículo"
                >
                  <Search className="h-5 w-5" />
                  <span className="max-w-0 overflow-hidden whitespace-nowrap pl-2 text-sm font-medium opacity-0 transition-[max-width,opacity] duration-200 group-hover/fab:max-w-[140px] group-hover/fab:opacity-100 group-focus-visible/fab:max-w-[140px] group-focus-visible/fab:opacity-100 group-active/fab:max-w-[140px] group-active/fab:opacity-100">
                    Buscar artículo
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 space-y-2 rounded-xl border-[color:var(--neutral-200)] bg-white p-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Buscar producto</p>
                  <Badge variant="outline">3+ letras</Badge>
                </div>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Ej: arroz, marca, etiqueta"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Aplica cuando escribas al menos 3 letras. Se combina con los filtros activos.
                </p>
                {searchTerm ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setSearchTerm("")}
                  >
                    Limpiar búsqueda
                  </Button>
                ) : null}
              </PopoverContent>
            </Popover>

            <Button
              type="button"
              className="h-12 rounded-full bg-primary px-3 text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
              onClick={() => setShowSummary((prev) => !prev)}
              aria-label={showSummary ? "Ocultar resumen" : "Mostrar pedido"}
            >
              {showSummary ? <EyeOff className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
              <span className="max-w-0 overflow-hidden whitespace-nowrap pl-2 text-sm font-semibold opacity-0 transition-[max-width,opacity] duration-200 group-hover/fab:max-w-[160px] group-hover/fab:opacity-100 group-focus-visible/fab:max-w-[160px] group-focus-visible/fab:opacity-100 group-active/fab:max-w-[160px] group-active/fab:opacity-100">
                {showSummary ? "Ocultar resumen" : "Mostrar pedido"}
              </span>
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
