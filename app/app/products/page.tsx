"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Clock4,
  ChevronDown,
  CheckCircle2,
  Download,
  LayoutGrid,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCcw,
  Rows,
  Tag,
  Truck,
  ToggleLeft,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";
import { useProviderContext } from "@/components/app/provider-context";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/whatsapp";
import {
  createProduct,
  listProducts,
  toggleProductActive,
  updateProduct,
  bulkUpsertProducts,
  exportProductsTemplate,
  type CreateProductResult,
  type BulkUpsertSummary,
  type ProductRow,
  type UpdateProductResult,
  listDeliveryRules,
  saveDeliveryRules,
  type DeliveryRuleInput,
  type DeliveryRuleRow,
  listDeliveryZones,
  createDeliveryZone,
  deleteDeliveryZone,
  type DeliveryZone,
} from "./actions";
import {
  WEEKDAYS,
  describeWindow,
  minutesToTimeString,
  sortRules,
  timeStringToMinutes,
  type DeliveryRule,
} from "@/lib/delivery-windows";

const MotionTableRow = motion(TableRow);

export type ProductsPageProps = { initialProviderSlug?: string };

const MAX_IMAGE_SIDE = 720;
const MAX_IMAGE_BYTES = 900 * 1024; // mantener <1MB para evitar límites de body
const TARGET_CROP_ASPECT = 4 / 3;
const MAX_BULK_ROWS = 500;

type OptimizedImage = {
  dataUrl: string;
  size: number;
  originalSize: number;
  width: number;
  height: number;
};

type LoadedImage = {
  dataUrl: string;
  width: number;
  height: number;
  size: number;
};

type BulkRowPreview = {
  tempId: string;
  productId?: string;
  name: string;
  brand?: string | null;
  price: number;
  discountPercent?: number;
  unit?: string | null;
  category?: string | null;
  description?: string | null;
  tags: string[];
  isActive?: boolean;
  isNew?: boolean;
  isOutOfStock?: boolean;
  imageUrl?: string;
  errors: string[];
};

const makeTempId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `temp-${Math.random().toString(36).slice(2)}`;

const readFileAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });

const loadImageFromDataUrl = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
    image.src = dataUrl;
  });

async function cropAndOptimizeImage(
  raw: LoadedImage,
  cropXPercent: number,
  cropYPercent: number,
): Promise<OptimizedImage> {
  const image = await loadImageFromDataUrl(raw.dataUrl);

  const cropWidth = Math.min(image.width, image.height * TARGET_CROP_ASPECT);
  const cropHeight = cropWidth / TARGET_CROP_ASPECT;
  const maxOffsetX = Math.max(0, image.width - cropWidth);
  const maxOffsetY = Math.max(0, image.height - cropHeight);
  const offsetX = Math.min(maxOffsetX, Math.max(0, maxOffsetX * cropXPercent));
  const offsetY = Math.min(maxOffsetY, Math.max(0, maxOffsetY * cropYPercent));

  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(cropWidth, cropHeight));
  const destWidth = Math.max(1, Math.round(cropWidth * scale));
  const destHeight = Math.max(1, Math.round(cropHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = destWidth;
  canvas.height = destHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el canvas.");
  ctx.drawImage(image, offsetX, offsetY, cropWidth, cropHeight, 0, 0, destWidth, destHeight);

  const toBlobWithQuality = (source: HTMLCanvasElement, quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      source.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("No se pudo optimizar la imagen."));
      }, "image/webp", quality);
    });

  let blob: Blob = await toBlobWithQuality(canvas, 0.72);

  if (blob.size > MAX_IMAGE_BYTES) {
    const shrink = Math.sqrt(MAX_IMAGE_BYTES / blob.size);
    const shrinkWidth = Math.max(1, Math.round(destWidth * shrink * 0.95));
    const shrinkHeight = Math.max(1, Math.round(destHeight * shrink * 0.95));
    const smaller = document.createElement("canvas");
    smaller.width = shrinkWidth;
    smaller.height = shrinkHeight;
    const smallerCtx = smaller.getContext("2d");
    if (!smallerCtx) throw new Error("No se pudo crear el canvas reducido.");
    smallerCtx.drawImage(canvas, 0, 0, shrinkWidth, shrinkHeight);
    blob = await toBlobWithQuality(smaller, 0.68);
  }

  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error("La imagen sigue siendo pesada luego de recortar y optimizar. Prueba con otra foto.");
  }

  const optimizedDataUrl = await readFileAsDataUrl(blob);

  return {
    dataUrl: optimizedDataUrl,
    size: blob.size,
    originalSize: raw.size,
    width: destWidth,
    height: destHeight,
  };
}

const formatKb = (bytes: number) => Math.max(1, Math.round(bytes / 1024));

export default function ProductsPage({ initialProviderSlug }: ProductsPageProps) {
  const { providerSlug: selectedProviderSlug, setProviderSlug } = useProviderContext();
  const providerSlug = selectedProviderSlug ?? "";
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productView, setProductView] = useState<"cards" | "table">("cards");
  const [result, setResult] = useState<CreateProductResult | UpdateProductResult | null>(null);
  const [resultSource, setResultSource] = useState<"create" | "edit" | null>(null);
  const [pendingCreate, startCreate] = useTransition();
  const [pendingToggle, startToggle] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [optimizingImage, setOptimizingImage] = useState(false);
  const [discount, setDiscount] = useState<string>("");
  const [rawImage, setRawImage] = useState<LoadedImage | null>(null);
  const [cropX, setCropX] = useState(50);
  const [cropY, setCropY] = useState(50);
  const [showCropper, setShowCropper] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [editName, setEditName] = useState("");
  const [brandInput, setBrandInput] = useState("");
  const [editPrice, setEditPrice] = useState<number | "">("");
  const [editUnit, setEditUnit] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [pendingEdit, startEdit] = useTransition();
  const [editRawImage, setEditRawImage] = useState<LoadedImage | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageDataUrl, setEditImageDataUrl] = useState<string | null>(null);
  const [editImageStatus, setEditImageStatus] = useState<string | null>(null);
  const [editImageError, setEditImageError] = useState<string | null>(null);
  const [editOptimizingImage, setEditOptimizingImage] = useState(false);
  const [editCropX, setEditCropX] = useState(50);
  const [editCropY, setEditCropY] = useState(50);
  const [editShowCropper, setEditShowCropper] = useState(false);
  const [removeEditImage, setRemoveEditImage] = useState(false);
  const [editDiscount, setEditDiscount] = useState<string>("");
  const [categoryInput, setCategoryInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [isOutOfStock, setIsOutOfStock] = useState(false);
  const [editIsNew, setEditIsNew] = useState(false);
  const [editIsOutOfStock, setEditIsOutOfStock] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRowPreview[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkSummary, setBulkSummary] = useState<BulkUpsertSummary | null>(null);
  const [parsingBulk, setParsingBulk] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [applyingBulk, startApplyingBulk] = useTransition();
  const [showDeliveryRulesModal, setShowDeliveryRulesModal] = useState(false);
  const [deliveryRules, setDeliveryRules] = useState<DeliveryRuleInput[]>([]);
  const [deliveryRulesEnabled, setDeliveryRulesEnabled] = useState(true);
  const [deliveryRulesCollapsed, setDeliveryRulesCollapsed] = useState(false);
  const [deliveryAvailableEnabled, setDeliveryAvailableEnabled] = useState(false);
  const [deliveryAvailableCollapsed, setDeliveryAvailableCollapsed] = useState(true);
  const [deliveryAvailableConfig, setDeliveryAvailableConfig] = useState<Record<string, { days: number[]; cutoffTime: string }>>({});
  const [loadingRules, setLoadingRules] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [rulesMessage, setRulesMessage] = useState<string | null>(null);
  const [savingRules, startSavingRules] = useTransition();
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [zonePrice, setZonePrice] = useState<string>("");
  const [savingZone, startSavingZone] = useTransition();
  const [showDeliveryZonesModal, setShowDeliveryZonesModal] = useState(false);

  useEffect(() => {
    if (initialProviderSlug && initialProviderSlug !== providerSlug) {
      void setProviderSlug(initialProviderSlug, { lock: true });
    }
  }, [initialProviderSlug, providerSlug, setProviderSlug]);

  const loadProducts = useCallback(
    async (slug: string) => {
      if (!slug) return;
      setLoadingProducts(true);
      setProductsError(null);
      const response = await listProducts(slug);
      if (response.success) {
        setProducts(response.products);
      } else {
        setProductsError(response.errors.join("\n"));
      }
      setLoadingProducts(false);
    },
    [],
  );

  useEffect(() => {
    void loadProducts(providerSlug);
  }, [loadProducts, providerSlug]);

  const hydrateRules = useCallback((rows: DeliveryRuleRow[]) => {
    if (!rows.length) {
      setDeliveryRules([
        { id: makeTempId(), cutoffWeekday: 2, cutoffTime: "20:00", deliveryWeekday: 5 },
        { id: makeTempId(), cutoffWeekday: 6, cutoffTime: "20:00", deliveryWeekday: 2 },
      ]);
      setDeliveryRulesEnabled(false);
      return;
    }

    setDeliveryRules(
      rows.map((row) => ({
        id: row.id,
        cutoffWeekday: row.cutoffWeekday,
        cutoffTime: minutesToTimeString(row.cutoffTimeMinutes ?? 0),
        deliveryWeekday: row.deliveryWeekday,
      })),
    );
  }, []);

  const loadDeliveryRulesModal = useCallback(
    async (slug: string) => {
      if (!slug) return;
      setLoadingRules(true);
      setRulesError(null);
      const response = await listDeliveryRules(slug);
      if (response.success) {
        hydrateRules(response.rules);
        setDeliveryRulesEnabled(response.mode === "windows");
        setDeliveryRulesCollapsed(response.mode !== "windows");
        setDeliveryAvailableEnabled(response.mode === "available_days");
        setDeliveryAvailableCollapsed(response.mode !== "available_days");
        const availableMap: Record<string, { days: number[]; cutoffTime: string }> = {};
        response.availableRules.forEach((rule) => {
          availableMap[rule.zoneId] = {
            days: rule.deliveryWeekdays ?? [],
            cutoffTime: minutesToTimeString(rule.cutoffTimeMinutes ?? 0),
          };
        });
        setDeliveryAvailableConfig(availableMap);
        setRulesMessage(null);
      } else {
        setRulesError(response.errors.join("\n"));
      }
      setLoadingRules(false);
    },
    [hydrateRules],
  );

  const loadDeliveryZones = useCallback(
    async (slug: string) => {
      if (!slug) return;
      setLoadingZones(true);
      setZonesError(null);
      const response = await listDeliveryZones(slug);
      if (response.success) {
        setDeliveryZones(response.zones);
      } else {
      setZonesError(response.errors?.join("\n") ?? "No se pudieron cargar los costos de envío.");
    }
    setLoadingZones(false);
  },
    [],
  );

  useEffect(() => {
    void loadDeliveryZones(providerSlug);
  }, [loadDeliveryZones, providerSlug]);

  const ensureAvailableConfig = useCallback(
    (zones: DeliveryZone[]) => {
      setDeliveryAvailableConfig((prev) => {
        const next = { ...prev };
        let changed = false;
        zones.forEach((zone) => {
          if (zone.isActive === false) return;
          const existing = next[zone.id];
          if (!existing || !existing.cutoffTime) {
            next[zone.id] = {
              days: existing?.days ?? [],
              cutoffTime: existing?.cutoffTime ?? "20:00",
            };
            changed = true;
          }
        });
        Object.keys(next).forEach((zoneId) => {
          if (!zones.find((z) => z.id === zoneId && z.isActive !== false)) {
            delete next[zoneId];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    },
    [],
  );

  useEffect(() => {
    ensureAvailableConfig(deliveryZones);
  }, [deliveryZones, ensureAvailableConfig]);

  useEffect(() => {
    if (showDeliveryRulesModal) {
      void loadDeliveryRulesModal(providerSlug);
      setDeliveryRulesCollapsed(false);
      setDeliveryAvailableCollapsed(true);
      ensureAvailableConfig(deliveryZones);
    }
  }, [showDeliveryRulesModal, loadDeliveryRulesModal, providerSlug, ensureAvailableConfig, deliveryZones]);

  const addDeliveryRule = useCallback(() => {
    setRulesError(null);
    setRulesMessage(null);
    setDeliveryRules((prev) => [
      ...prev,
      {
        id: makeTempId(),
        cutoffWeekday: prev.length ? (prev[prev.length - 1]?.cutoffWeekday + 1) % 7 : 0,
        cutoffTime: "18:00",
        deliveryWeekday: prev.length ? (prev[prev.length - 1]?.deliveryWeekday + 1) % 7 : 1,
      },
    ]);
  }, []);

  const updateDeliveryRule = useCallback((index: number, patch: Partial<DeliveryRuleInput>) => {
    setRulesError(null);
    setRulesMessage(null);
    setDeliveryRules((prev) => prev.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patch } : rule)));
  }, []);

  const removeDeliveryRule = useCallback((index: number) => {
    setRulesError(null);
    setRulesMessage(null);
    setDeliveryRules((prev) => prev.filter((_, ruleIndex) => ruleIndex !== index));
  }, []);

  const deliveryRulesValidation = useMemo(() => {
    const normalized: DeliveryRule[] = [];
    const errors: string[] = [];
    const seen = new Set<string>();

    deliveryRules.forEach((rule, index) => {
      const cutoffMinutes = timeStringToMinutes(rule.cutoffTime);
      if (cutoffMinutes === null) {
        errors.push(`Hora inválida en la fila ${index + 1}. Usa HH:MM.`);
        return;
      }
      const key = `${rule.cutoffWeekday}-${cutoffMinutes}`;
      if (seen.has(key)) {
        errors.push("No repitas día y hora de corte, deja solo una fila por corte.");
        return;
      }
      seen.add(key);
      normalized.push({
        id: rule.id,
        cutoffWeekday: rule.cutoffWeekday,
        cutoffTimeMinutes: cutoffMinutes,
        deliveryWeekday: rule.deliveryWeekday,
        deliveryTimeMinutes: 10 * 60,
      });
    });

    const sorted = normalized.length ? sortRules(normalized) : [];
    const hasEmptyWindow = sorted.some((entry) => entry.windowEndMinute - entry.windowStartMinute <= 0);
    if (hasEmptyWindow) {
      errors.push("Hay ventanas sin cobertura. Ajusta los cortes para cubrir los 7 días.");
    }
    if (!normalized.length && deliveryRulesEnabled) {
      errors.push("Agrega al menos una regla de entrega.");
    }

    return { normalized, errors, sorted };
  }, [deliveryRules, deliveryRulesEnabled]);

  const deliveryWindowsPreview = useMemo(() => {
    if (!deliveryRulesValidation.sorted.length) return [];
    return deliveryRulesValidation.sorted.map((entry, index) => {
      return {
        id: entry.rule.id ?? `preview-${index}`,
        deliveryWeekday: entry.rule.deliveryWeekday,
        start: entry.windowStartMinute,
        end: entry.windowEndMinute,
      };
    });
  }, [deliveryRulesValidation.sorted]);

  const activeDeliveryZones = useMemo(() => deliveryZones.filter((zone) => zone.isActive !== false), [deliveryZones]);

  const deliveryAvailableComplete = useMemo(() => {
    if (!deliveryAvailableEnabled) return false;
    if (!activeDeliveryZones.length) return false;
    return activeDeliveryZones.every((zone) => {
      const config = deliveryAvailableConfig[zone.id];
      return config && config.days.length >= 1 && config.cutoffTime.trim().length >= 4;
    });
  }, [activeDeliveryZones, deliveryAvailableConfig, deliveryAvailableEnabled]);

  const missingAvailableZones = useMemo(() => {
    if (!deliveryAvailableEnabled) return [];
    return activeDeliveryZones
      .filter((zone) => {
        const config = deliveryAvailableConfig[zone.id];
        return !config || config.days.length === 0 || config.cutoffTime.trim().length < 4;
      })
      .map((zone) => zone.name);
  }, [activeDeliveryZones, deliveryAvailableConfig, deliveryAvailableEnabled]);

  const handleSaveDeliveryRules = useCallback(() => {
    startSavingRules(async () => {
      const mode: "windows" | "available_days" = deliveryAvailableEnabled ? "available_days" : "windows";
      const availablePayload =
        mode === "available_days"
          ? activeDeliveryZones.map((zone) => ({
              zoneId: zone.id,
              cutoffTime: deliveryAvailableConfig[zone.id]?.cutoffTime ?? "20:00",
              deliveryWeekdays: deliveryAvailableConfig[zone.id]?.days ?? [],
            }))
          : [];
      const missingFromPayload =
        mode === "available_days"
          ? availablePayload
              .filter((entry) => entry.deliveryWeekdays.length < 1 || entry.cutoffTime.trim().length < 4)
              .map((entry) => activeDeliveryZones.find((z) => z.id === entry.zoneId)?.name ?? "Zona")
          : [];
      if (mode === "windows" && deliveryRulesValidation.errors.length) {
        setRulesError(deliveryRulesValidation.errors.join("\n"));
        return;
      }
      if (mode === "available_days" && !deliveryAvailableComplete) {
        const missing =
          missingFromPayload.length > 0
            ? ` Faltan: ${missingFromPayload.join(", ")}.`
            : missingAvailableZones.length
              ? ` Faltan: ${missingAvailableZones.join(", ")}.`
              : "";
        setRulesError(`Configura días (checkboxes) y hora límite para todas las zonas activas.${missing}`);
        return;
      }
      if (!providerSlug) {
        setRulesError("Falta el identificador del proveedor.");
        return;
      }
      const response = await saveDeliveryRules({
        providerSlug,
        mode,
        rules: mode === "windows" ? deliveryRules : [],
        availableRules: mode === "available_days" ? availablePayload : [],
      });
      if (response.success) {
        setRulesMessage(response.message);
        setRulesError(null);
        if (mode === "available_days") {
          const map: Record<string, { days: number[]; cutoffTime: string }> = {};
          availablePayload.forEach((entry) => {
            map[entry.zoneId] = { days: entry.deliveryWeekdays, cutoffTime: entry.cutoffTime };
          });
          setDeliveryAvailableConfig(map);
          setDeliveryAvailableEnabled(true);
          setDeliveryRulesEnabled(false);
          setDeliveryRulesCollapsed(true);
          setDeliveryAvailableCollapsed(false);
        }
        await loadDeliveryRulesModal(providerSlug);
      } else {
        setRulesError(response.errors.join("\n"));
      }
    });
  }, [
    deliveryRulesEnabled,
    deliveryRulesValidation.errors,
    deliveryRules,
    providerSlug,
    loadDeliveryRulesModal,
    startSavingRules,
    activeDeliveryZones,
    deliveryAvailableConfig,
    deliveryAvailableEnabled,
  ]);

  const handleCreateZone = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      if (event) event.preventDefault();
      if (!providerSlug) return;
      setZonesError(null);
      startSavingZone(async () => {
        const response = await createDeliveryZone({
          providerSlug,
          name: zoneName.trim(),
          price: Number(zonePrice || 0),
        });
        if (response.success) {
          if (response.zone) {
            setDeliveryZones((prev) => [...prev, response.zone!].sort((a, b) => a.name.localeCompare(b.name)));
          } else {
            await loadDeliveryZones(providerSlug);
          }
          setZoneName("");
          setZonePrice("");
        } else {
          setZonesError(response.errors?.join("\n") ?? "No se pudo guardar el costo de envío.");
        }
      });
    },
    [providerSlug, zoneName, zonePrice, loadDeliveryZones, startSavingZone],
  );

  const handleDeleteZone = useCallback(
    async (zoneId: string) => {
      if (!providerSlug) return;
      setZonesError(null);
      const response = await deleteDeliveryZone(providerSlug, zoneId);
      if (response.success) {
        setDeliveryZones((prev) => prev.filter((zone) => zone.id !== zoneId));
      } else {
        setZonesError(response.errors?.join("\n") ?? "No se pudo eliminar el costo.");
      }
    },
    [providerSlug],
  );

  const handleImageInput = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setImageError(null);

    if (!file) {
      setRawImage(null);
      setImagePreview(null);
      setImageDataUrl(null);
      setImageStatus(null);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const image = await loadImageFromDataUrl(dataUrl);
      setRawImage({ dataUrl, width: image.width, height: image.height, size: file.size });
      setCropX(50);
      setCropY(50);
      setShowCropper(true);
      setImageStatus("Ajusta el recorte y guarda.");
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "No se pudo leer la imagen.");
    }
  }, []);

  const clearImage = () => {
    setImagePreview(null);
    setImageDataUrl(null);
    setImageStatus(null);
    setImageError(null);
    setRawImage(null);
  };

  const cropPreviewRect = useMemo(() => {
    if (!rawImage) return null;
    const cropWidth = Math.min(rawImage.width, rawImage.height * TARGET_CROP_ASPECT);
    const cropHeight = cropWidth / TARGET_CROP_ASPECT;
    const maxOffsetX = Math.max(0, rawImage.width - cropWidth);
    const maxOffsetY = Math.max(0, rawImage.height - cropHeight);
    const offsetX = (maxOffsetX * cropX) / 100;
    const offsetY = (maxOffsetY * cropY) / 100;
    return {
      width: (cropWidth / rawImage.width) * 100,
      height: (cropHeight / rawImage.height) * 100,
      left: (offsetX / rawImage.width) * 100,
      top: (offsetY / rawImage.height) * 100,
    };
  }, [cropX, cropY, rawImage]);

  const applyCrop = useCallback(async () => {
    if (!rawImage) return;
    setOptimizingImage(true);
    setImageError(null);
    try {
      const optimized = await cropAndOptimizeImage(rawImage, cropX / 100, cropY / 100);
      setImagePreview(optimized.dataUrl);
      setImageDataUrl(optimized.dataUrl);
      setImageStatus(
        `Recorte listo: ${optimized.width}x${optimized.height}, ${formatKb(optimized.size)} KB (antes ${formatKb(
          optimized.originalSize,
        )} KB)`,
      );
      setShowCropper(false);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "No se pudo optimizar la imagen.");
    } finally {
      setOptimizingImage(false);
    }
  }, [cropX, cropY, rawImage]);

  const liveEditPrice = useMemo(() => {
    const base = typeof editPrice === "number" ? editPrice : Number(editPrice || "0");
    const disc = Math.max(0, Math.min(100, Number(editDiscount || "0")));
    return Number((base * (1 - disc / 100)).toFixed(2));
  }, [editDiscount, editPrice]);

  const editCropPreviewRect = useMemo(() => {
    if (!editRawImage) return null;
    const cropWidth = Math.min(editRawImage.width, editRawImage.height * TARGET_CROP_ASPECT);
    const cropHeight = cropWidth / TARGET_CROP_ASPECT;
    const maxOffsetX = Math.max(0, editRawImage.width - cropWidth);
    const maxOffsetY = Math.max(0, editRawImage.height - cropHeight);
    const offsetX = (maxOffsetX * editCropX) / 100;
    const offsetY = (maxOffsetY * editCropY) / 100;
    return {
      width: (cropWidth / editRawImage.width) * 100,
      height: (cropHeight / editRawImage.height) * 100,
      left: (offsetX / editRawImage.width) * 100,
      top: (offsetY / editRawImage.height) * 100,
    };
  }, [editCropX, editCropY, editRawImage]);

  const handleEditImageInput = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setEditImageError(null);
    setRemoveEditImage(false);

    if (!file) {
      setEditRawImage(null);
      setEditImagePreview(editingProduct?.image_url ?? null);
      setEditImageDataUrl(null);
      setEditImageStatus(null);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const image = await loadImageFromDataUrl(dataUrl);
      setEditRawImage({ dataUrl, width: image.width, height: image.height, size: file.size });
      setEditCropX(50);
      setEditCropY(50);
      setEditShowCropper(true);
      setEditImageStatus("Ajusta el recorte y guarda.");
    } catch (error) {
      setEditImageError(error instanceof Error ? error.message : "No se pudo leer la imagen.");
    }
  }, [editingProduct?.image_url]);

  const applyEditCrop = useCallback(async () => {
    if (!editRawImage) return;
    setEditOptimizingImage(true);
    setEditImageError(null);
    try {
      const optimized = await cropAndOptimizeImage(editRawImage, editCropX / 100, editCropY / 100);
      setEditImagePreview(optimized.dataUrl);
      setEditImageDataUrl(optimized.dataUrl);
      setEditImageStatus(
        `Recorte listo: ${optimized.width}x${optimized.height}, ${formatKb(optimized.size)} KB (antes ${formatKb(
          optimized.originalSize,
        )} KB)`,
      );
      setEditShowCropper(false);
    } catch (error) {
      setEditImageError(error instanceof Error ? error.message : "No se pudo optimizar la imagen.");
    } finally {
      setEditOptimizingImage(false);
    }
  }, [editCropX, editCropY, editRawImage]);

  const clearEditImage = () => {
    setEditImagePreview(null);
    setEditImageDataUrl(null);
    setEditImageStatus(null);
    setEditImageError(null);
    setEditRawImage(null);
    setRemoveEditImage(true);
  };

  const liveAddPrice = useMemo(() => {
    if (typeof document === "undefined") return 0;
    const liveAddBasePrice = Number((document.getElementById("price") as HTMLInputElement | null)?.value || "0");
    const disc = Math.max(0, Math.min(100, Number(discount || "0")));
    return Number((liveAddBasePrice * (1 - disc / 100)).toFixed(2));
  }, [discount]);

  const availableCategories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((product) => {
      if (product.category) unique.add(product.category);
    });
    return Array.from(unique.values()).slice(0, 20);
  }, [products]);

  const availableTags = useMemo(() => {
    const unique = new Map<string, string>();
    products.forEach((product) => {
      (product.tags ?? []).forEach((tag) => {
        const key = tag.toLowerCase();
        if (!unique.has(key)) unique.set(key, tag);
      });
    });
    return Array.from(unique.values()).slice(0, 24);
  }, [products]);

  const validBulkCount = useMemo(() => bulkRows.filter((row) => row.errors.length === 0).length, [bulkRows]);

  const parseBooleanCell = useCallback((value: unknown): boolean | undefined => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    if (typeof value === "string") {
      const clean = value.trim().toLowerCase();
      if (["si", "sí", "yes", "y", "true", "1"].includes(clean)) return true;
      if (["no", "false", "0"].includes(clean)) return false;
    }
    return undefined;
  }, []);

  const parseTagsCell = useCallback((value: unknown): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((tag) => String(tag));
    if (typeof value === "string") {
      return value
        .split(/[;,]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 14);
    }
    return [];
  }, []);

  const parseStringCell = useCallback((value: unknown, max = 400) => {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, max);
  }, []);

  const parseNumberCell = useCallback((value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : NaN;
  }, []);

  const isValidUrl = useCallback((value?: string) => {
    if (!value) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, []);

  const addTag = useCallback((value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setTags((prev) => {
      if (prev.some((tag) => tag.toLowerCase() === clean.toLowerCase())) return prev;
      return [...prev, clean].slice(0, 14);
    });
    setTagInput("");
  }, []);

  const addEditTag = useCallback((value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setEditTags((prev) => {
      if (prev.some((tag) => tag.toLowerCase() === clean.toLowerCase())) return prev;
      return [...prev, clean].slice(0, 14);
    });
    setEditTagInput("");
  }, []);

  const removeTag = (value: string) => {
    setTags((prev) => prev.filter((tag) => tag !== value));
  };

  const removeEditTag = (value: string) => {
    setEditTags((prev) => prev.filter((tag) => tag !== value));
  };

  const handleDownloadTemplate = useCallback(async () => {
    if (!providerSlug) return;
    setDownloadingTemplate(true);
    setBulkErrors([]);
    try {
      const response = await exportProductsTemplate(providerSlug);
      if (!response.success) {
        setBulkErrors(response.errors);
        return;
      }
      const binary = atob(response.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = response.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setBulkErrors([error instanceof Error ? error.message : "No se pudo descargar la plantilla."]);
    } finally {
      setDownloadingTemplate(false);
    }
  }, [providerSlug]);

  const handleBulkFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      setBulkErrors([]);
      setBulkSummary(null);
      setBulkRows([]);
      if (!file) return;
      if (!providerSlug) {
        setBulkErrors(["Falta el slug del proveedor."]);
        return;
      }

      setParsingBulk(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("El archivo está vacío.");
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, { header: 1, defval: "" });
        if (!rows.length) throw new Error("No encontramos datos en la hoja.");
        const headerIndex = rows.findIndex(
          (row) => Array.isArray(row) && row.some((cell) => String(cell ?? "").trim().toLowerCase() === "name"),
        );
        if (headerIndex === -1) throw new Error("No encontramos la fila de encabezados (name, price...).");
        const header = (rows[headerIndex] as unknown[]).map((cell) => String(cell ?? "").trim().toLowerCase());
        const getValue = (row: unknown[], key: string) => {
          const index = header.indexOf(key);
          if (index === -1) return "";
          return row[index] ?? "";
        };

        const previews: BulkRowPreview[] = [];
        const now = Date.now();
        for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
          const row = rows[rowIndex] as unknown[];
          if (!row || row.every((cell) => String(cell ?? "").trim() === "")) continue;
          if (previews.length >= MAX_BULK_ROWS) break;

          const name = parseStringCell(getValue(row, "name"), 160);
          const price = parseNumberCell(getValue(row, "price"));
          const discountPercent = parseNumberCell(getValue(row, "discount_percent"));
          const unit = parseStringCell(getValue(row, "unit"), 80);
          const brand = parseStringCell(getValue(row, "brand"), 120);
          const category = parseStringCell(getValue(row, "category"), 120);
          const description = parseStringCell(getValue(row, "description"), 400);
          const tags = parseTagsCell(getValue(row, "tags"));
          const isActive = parseBooleanCell(getValue(row, "is_active"));
          const isNewValue = parseBooleanCell(getValue(row, "is_new"));
          const isOutOfStock = parseBooleanCell(getValue(row, "is_out_of_stock"));
          const productId = parseStringCell(getValue(row, "product_id"));
          const imageUrl = parseStringCell(getValue(row, "image_url"), 800);

          const errors: string[] = [];
          if (!name) errors.push("Falta nombre");
          if (!Number.isFinite(price) || price <= 0) errors.push("Precio inválido");
          if (!Number.isNaN(discountPercent) && (discountPercent < 0 || discountPercent > 100)) {
            errors.push("Descuento fuera de rango");
          }
          if (tags.length > 14) errors.push("Máximo 14 etiquetas");
          if (imageUrl && !isValidUrl(imageUrl)) errors.push("URL de imagen inválida");

          previews.push({
            tempId: `${rowIndex}-${now}`,
            productId: productId || undefined,
            name,
            brand: brand || undefined,
            price: Number.isFinite(price) ? price : 0,
            discountPercent: Number.isNaN(discountPercent) ? 0 : discountPercent,
            unit: unit || undefined,
            category: category || undefined,
            description: description || undefined,
            tags,
            isActive,
            isNew: isNewValue,
            isOutOfStock,
            imageUrl: imageUrl || undefined,
            errors,
          });
        }

        if (!previews.length) {
          throw new Error("No se encontraron filas con datos.");
        }

        setBulkRows(previews);
      } catch (error) {
        setBulkRows([]);
        setBulkErrors([error instanceof Error ? error.message : "No se pudo leer el archivo."]);
      } finally {
        setParsingBulk(false);
      }
    },
    [parseBooleanCell, parseTagsCell, parseNumberCell, parseStringCell, isValidUrl, providerSlug],
  );

  const handleApplyBulk = () => {
    if (!providerSlug) return;
    const validRows = bulkRows.filter((row) => row.errors.length === 0);
    if (!validRows.length) {
      setBulkErrors(["Necesitas al menos una fila válida para importar."]);
      return;
    }
    startApplyingBulk(async () => {
      const response = await bulkUpsertProducts({
        providerSlug,
        rows: validRows.map((row) => ({
          id: row.productId,
          name: row.name,
          brand: row.brand ?? "",
          price: row.price,
          discountPercent: row.discountPercent ?? 0,
          unit: row.unit ?? "",
          category: row.category ?? "",
          description: row.description ?? "",
          tags: row.tags,
          isNew: row.isNew,
          isOutOfStock: row.isOutOfStock,
          isActive: row.isActive,
          imageUrl: row.imageUrl,
        })),
      });
      if (response.success) {
        setBulkSummary(response.summary);
        await loadProducts(providerSlug);
      } else {
        setBulkErrors(response.errors);
      }
    });
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!providerSlug) return;
    if (rawImage && !imageDataUrl) {
      setImageError("Aplica el recorte antes de guardar el producto.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    const priceValue = Number((formData.get("price") as string) ?? "0");
    const discountValue = Math.max(0, Math.min(100, Number(discount || "0")));
    const categoryValue = categoryInput.trim();
    const brandValue = brandInput.trim();
    startCreate(async () => {
      const response = await createProduct({
        providerSlug,
        name: (formData.get("name") as string) ?? "",
        price: priceValue,
        discountPercent: discountValue,
        brand: brandValue,
        unit: (formData.get("unit") as string) ?? "",
        description: (formData.get("description") as string) ?? "",
        category: categoryValue,
        tags,
        isNew,
        isOutOfStock,
        imageBase64: imageDataUrl,
      });
      setResultSource("create");
      setResult(response);
      if (response.success) {
        (event.target as HTMLFormElement).reset();
        clearImage();
        setDiscount("");
        setCategoryInput("");
        setBrandInput("");
        setTags([]);
        setTagInput("");
        setIsNew(false);
        setIsOutOfStock(false);
        await loadProducts(providerSlug);
      }
    });
  };

  const openEditModal = (product: ProductRow) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditBrand(product.brand ?? "");
    setEditPrice(product.price);
    setEditUnit(product.unit ?? "");
    setEditCategory(product.category ?? "");
    setEditDescription(product.description ?? "");
    setEditImagePreview(product.image_url ?? null);
    setEditImageDataUrl(null);
    setEditImageStatus(null);
    setEditImageError(null);
    setEditRawImage(null);
    setRemoveEditImage(false);
    setEditCropX(50);
    setEditCropY(50);
    setEditShowCropper(false);
    setEditDiscount(String(product.discount_percent ?? 0));
    setEditTags(product.tags ?? []);
    setEditTagInput("");
    setEditIsNew(Boolean(product.is_new));
    setEditIsOutOfStock(Boolean(product.is_out_of_stock));
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!providerSlug || !editingProduct) return;
    if (editRawImage && !editImageDataUrl) {
      setEditImageError("Aplica el recorte antes de guardar.");
      return;
    }
    const priceValue = typeof editPrice === "number" ? editPrice : Number(editPrice || "0");
    const discountValue = Math.max(0, Math.min(100, Number(editDiscount || "0")));
    startEdit(async () => {
      const response = await updateProduct({
        providerSlug,
        productId: editingProduct.id,
        name: editName,
        price: priceValue,
        discountPercent: discountValue,
        brand: editBrand,
        unit: editUnit || "",
        description: editDescription || "",
        category: editCategory || "",
        tags: editTags,
        isNew: editIsNew,
        isOutOfStock: editIsOutOfStock,
        imageBase64: editImageDataUrl,
        removeImage: removeEditImage && !editImageDataUrl,
      });
      setResultSource("edit");
      setResult(response);
      if (response.success) {
        setEditingProduct(null);
        await loadProducts(providerSlug);
      }
    });
  };

  const handleToggle = (productId: string, isActive: boolean) => {
    if (!providerSlug) return;
    startToggle(async () => {
      const response = await toggleProductActive({
        providerSlug,
        productId,
        isActive: !isActive,
      });
      if (response.success) {
        await loadProducts(providerSlug);
      } else {
        setProductsError(response.errors.join("\n"));
      }
    });
  };

  if (!providerSlug) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-xl font-semibold">Falta el slug de proveedor.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecciona un proveedor desde el selector superior para gestionar el catálogo.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <main className="flex w-full flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button asChild variant="ghost" size="sm">
              <Link href={providerSlug ? `/app/${providerSlug}` : "/app"}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <span>/</span>
            <Badge variant="secondary">Productos</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{providerSlug || "Proveedor"}</Badge>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar producto
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => void loadProducts(providerSlug)}
              aria-label="Refrescar productos"
              disabled={loadingProducts}
            >
              <RefreshCcw className={`h-4 w-4 ${loadingProducts ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={() => setShowBulkModal(true)} variant="secondary">
              <Upload className="mr-2 h-4 w-4" />
              Carga masiva
            </Button>
          </div>
        </div>

        {!showCreateModal && result ? (
          result.success ? (
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3 text-sm">
              {result.message}
            </div>
          ) : (
            <div className="rounded-xl border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
              {result.errors.join("\n")}
            </div>
          )
        ) : null}

        <Card className="border-[color:var(--border)] bg-card/95 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Catálogo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Activa / desactiva productos y revisa su precio final para los pedidos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => setShowDeliveryZonesModal(true)}
              >
                <Truck className="mr-2 h-4 w-4" />
                Costo de envío
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => setShowDeliveryRulesModal(true)}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Reglas de entrega
              </Button>
              <Badge variant="outline">{providerSlug || "Sin proveedor"}</Badge>
              <Badge variant="secondary">{products.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end sm:hidden">
              <Button variant="outline" size="sm" onClick={() => setShowDeliveryZonesModal(true)} className="mr-2">
                <Truck className="mr-2 h-4 w-4" />
                Costo de envío
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDeliveryRulesModal(true)}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Reglas de entrega
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-full border border-[color:var(--border)] bg-card/95 p-1 shadow-sm backdrop-blur">
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
              </div>
            </div>
            {productsError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {productsError}
              </div>
            ) : null}

            {loadingProducts ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--muted)] p-4 text-sm text-muted-foreground">
                Aún no hay productos para este proveedor.
              </div>
            ) : productView === "table" ? (
              <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-card/95 shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[color:var(--muted)]">
                        <TableHead className="min-w-[240px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Producto
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Precio final
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Estado
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Stock
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Categoría
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Tags
                        </TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product, index) => {
                        const finalPrice = product.price * (1 - (product.discount_percent ?? 0) / 100);
                        return (
                          <MotionTableRow
                            key={product.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-b border-[color:var(--border)] transition-colors hover:bg-[color:var(--muted)]/60 last:border-0"
                          >
                            <TableCell>
                              <div className="flex items-start gap-3">
                                <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)]">
                                  {product.image_url ? (
                                    <NextImage
                                      src={product.image_url}
                                      alt={`Imagen de ${product.name}`}
                                      fill
                                      sizes="64px"
                                      className="object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[11px] uppercase text-muted-foreground">
                                      Sin foto
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold">{product.name}</p>
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
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm font-semibold">
                                {product.discount_percent && product.discount_percent > 0 ? (
                                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <span className="line-through">{formatCurrency(product.price)}</span>
                                    <Badge variant="secondary" className="rounded-full px-2 py-0 text-[11px]">
                                      -{Math.round(product.discount_percent)}%
                                    </Badge>
                                  </div>
                                ) : null}
                                <div>
                                  {formatCurrency(finalPrice)}
                                  {product.unit ? (
                                    <span className="text-[11px] text-muted-foreground"> · {product.unit}</span>
                                  ) : null}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={product.is_active ? "secondary" : "outline"}
                                className={!product.is_active ? "border-destructive text-destructive" : undefined}
                              >
                                {product.is_active ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {product.is_out_of_stock ? (
                                <Badge variant="destructive" className="rounded-full px-2 py-0 text-[11px]">
                                  Sin stock
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="rounded-full px-2 py-0 text-[11px]">
                                  Disponible
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {product.category ?? "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {(product.tags ?? []).slice(0, 4).map((tag) => (
                                  <Badge
                                    key={`${product.id}-${tag}`}
                                    variant="outline"
                                    className="rounded-full px-2 py-0 text-[11px]"
                                  >
                                    #{tag}
                                  </Badge>
                                ))}
                                {!product.tags?.length ? <span className="text-xs text-muted-foreground">—</span> : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Alternar producto"
                                  disabled={pendingToggle}
                                  onClick={() => handleToggle(product.id, Boolean(product.is_active))}
                                >
                                  <ToggleLeft className="h-5 w-5" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openEditModal(product)}>
                                  Editar
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
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex flex-col gap-2 rounded-xl border border-[color:var(--border)] bg-card/95 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-1 items-start gap-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)]">
                          {product.image_url ? (
                            <NextImage
                              src={product.image_url}
                              alt={`Imagen de ${product.name}`}
                              fill
                              sizes="64px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[11px] uppercase text-muted-foreground">
                              Sin foto
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{product.name}</p>
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
                            {product.is_out_of_stock ? (
                              <Badge variant="destructive" className="rounded-full px-2 py-0 text-[11px]">
                                Sin stock
                              </Badge>
                            ) : null}
                        <Badge
                          variant={product.is_active ? "secondary" : "outline"}
                          className={!product.is_active ? "border-destructive text-destructive" : undefined}
                        >
                          {product.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{product.description || "Sin descripción"}</p>
                          {product.discount_percent && product.discount_percent > 0 ? (
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="line-through">{formatCurrency(product.price)}</span>
                              <Badge variant="secondary" className="rounded-full px-2 py-0 text-[11px]">
                                -{Math.round(product.discount_percent)}%
                              </Badge>
                            </div>
                          ) : null}
                          <div className="text-sm font-semibold">
                            {formatCurrency(product.price * (1 - (product.discount_percent ?? 0) / 100))}
                            {product.unit ? (
                              <span className="text-xs text-muted-foreground"> · {product.unit}</span>
                            ) : null}
                          </div>
                          {product.category ? (
                            <div className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                              <Tag className="h-3 w-3" />
                              {product.category}
                            </div>
                          ) : null}
                          {product.tags && product.tags.length ? (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {product.tags.slice(0, 6).map((tag) => (
                                <Badge
                                  key={`${product.id}-${tag}`}
                                  variant="outline"
                                  className="rounded-full px-2 py-0 text-[11px]"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Alternar producto"
                        disabled={pendingToggle}
                        onClick={() => handleToggle(product.id, Boolean(product.is_active))}
                      >
                        <ToggleLeft className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(product)}>
                        Editar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </main>

      <Dialog open={showDeliveryZonesModal} onOpenChange={setShowDeliveryZonesModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Costos de envío por localidad</DialogTitle>
            <DialogDescription>Define zonas y su precio fijo. Se mostrarán en el link público al elegir envío.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {zonesError ? (
              <div className="rounded-md border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                {zonesError}
              </div>
            ) : null}
            <form className="space-y-3" onSubmit={(event) => void handleCreateZone(event)}>
              <div className="grid gap-2">
                <Label htmlFor="zoneName">Localidad / zona</Label>
                <Input
                  id="zoneName"
                  value={zoneName}
                  onChange={(event) => setZoneName(event.target.value)}
                  placeholder="Ej: CABA, Zona Norte"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zonePrice">Precio</Label>
                <Input
                  id="zonePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={zonePrice}
                  onChange={(event) => setZonePrice(event.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!providerSlug || savingZone || !zoneName.trim()}>
                  {savingZone ? "Guardando..." : "Guardar costo"}
                </Button>
              </DialogFooter>
            </form>

            <div className="space-y-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Zonas creadas</p>
                <Badge variant="outline">{deliveryZones.length}</Badge>
              </div>
              {loadingZones ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((item) => (
                    <Skeleton key={item} className="h-10 w-full" />
                  ))}
                </div>
              ) : deliveryZones.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no cargaste costos de envío.</p>
              ) : (
                <div className="space-y-2">
                  {deliveryZones.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between rounded-md border border-[color:var(--border)] bg-card/95 px-3 py-2 shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-semibold">{zone.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(zone.price)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar ${zone.name}`}
                        onClick={() => void handleDeleteZone(zone.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeliveryRulesModal} onOpenChange={setShowDeliveryRulesModal}>
        <DialogContent className="max-w-3xl max-h-[86vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reglas de entrega</DialogTitle>
            <DialogDescription>
              Define hasta qué día y hora entra cada ventana de entrega. No dejes huecos: toda la semana debe quedar cubierta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-card/95 p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-base font-semibold">Entrega según dias de reparto</p>
                  <p className="text-xs text-muted-foreground">Define ventanas de corte y entrega (modo actual).</p>
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="delivery-toggle" className="text-sm font-medium text-muted-foreground">
                    Activar
                  </label>
                  <Switch
                    id="delivery-toggle"
                    checked={deliveryRulesEnabled}
                    onCheckedChange={(value) => {
                      setDeliveryRulesEnabled(value);
                      if (value) setDeliveryAvailableEnabled(false);
                      setRulesError(null);
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={deliveryRulesCollapsed ? "Expandir reglas" : "Contraer reglas"}
                    onClick={() => setDeliveryRulesCollapsed((prev) => !prev)}
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${deliveryRulesCollapsed ? "rotate-180" : ""}`} />
                  </Button>
                </div>
              </div>

              {!deliveryRulesCollapsed ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Clock4 className="mt-0.5 h-4 w-4 text-primary" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Ejemplo rápido</p>
                        <p>
                          Hasta martes 20:00 se entrega viernes. Hasta sábado 20:00 se entrega martes. Si llega después del corte, pasa automáticamente a la siguiente fecha.
                        </p>
                      </div>
                    </div>
                  </div>

                  {rulesError ? (
                    <div className="rounded-md border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                      {rulesError}
                    </div>
                  ) : null}
                  {rulesMessage ? (
                    <div className="rounded-md border border-emerald-600/50 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-300">
                      {rulesMessage}
                    </div>
                  ) : null}

                  {loadingRules ? (
                    <div className="space-y-2">
                      {[0, 1].map((index) => (
                        <div key={index} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3">
                          <Skeleton className="h-4 w-32" />
                          <div className="mt-2 grid gap-2 sm:grid-cols-3">
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deliveryRules.map((rule, index) => (
                        <div
                          key={rule.id ?? `${rule.cutoffWeekday}-${rule.cutoffTime}-${rule.deliveryWeekday}-${index}`}
                          className={`rounded-xl border border-[color:var(--border)] bg-card/95 p-3 shadow-sm ${!deliveryRulesEnabled ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="secondary" className="rounded-full px-2 py-0 text-[11px] uppercase">
                              Ventana {index + 1}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deliveryRules.length <= 1 || !deliveryRulesEnabled}
                              onClick={() => removeDeliveryRule(index)}
                              aria-label="Eliminar ventana"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div className="space-y-1">
                              <Label>Pedidos hasta</Label>
                              <Select
                                value={String(rule.cutoffWeekday)}
                                onValueChange={(value) => updateDeliveryRule(index, { cutoffWeekday: Number(value) })}
                                disabled={!deliveryRulesEnabled}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Día de corte" />
                                </SelectTrigger>
                                <SelectContent>
                                  {WEEKDAYS.map((day, weekday) => (
                                    <SelectItem key={`cutoff-${day}`} value={String(weekday)}>
                                      {day}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label>Hora límite</Label>
                              <Input
                                type="time"
                                value={rule.cutoffTime}
                                onChange={(event) => updateDeliveryRule(index, { cutoffTime: event.target.value })}
                                disabled={!deliveryRulesEnabled}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>Se entrega</Label>
                              <Select
                                value={String(rule.deliveryWeekday)}
                                onValueChange={(value) => updateDeliveryRule(index, { deliveryWeekday: Number(value) })}
                                disabled={!deliveryRulesEnabled}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Día de entrega" />
                                </SelectTrigger>
                                <SelectContent>
                                  {WEEKDAYS.map((day, weekday) => (
                                    <SelectItem key={`delivery-${day}`} value={String(weekday)}>
                                      {day}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Pedidos hasta <span className="font-semibold">{WEEKDAYS[rule.cutoffWeekday]}</span>{" "}
                            {rule.cutoffTime} se entregan el{" "}
                            <span className="font-semibold">{WEEKDAYS[rule.deliveryWeekday]}</span>.
                          </p>
                        </div>
                      ))}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={addDeliveryRule} disabled={!deliveryRulesEnabled}>
                          <Plus className="mr-2 h-4 w-4" />
                          Añadir ventana
                        </Button>
                        <Badge variant="outline" className="text-[11px]">
                          Cubre toda la semana sin huecos
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Cobertura semanal</p>
                    {!deliveryRulesEnabled ? (
                      <p className="text-xs text-muted-foreground">Activa las reglas para ver la cobertura semanal.</p>
                    ) : deliveryWindowsPreview.length ? (
                      <div className="space-y-2 text-sm">
                        {deliveryWindowsPreview.map((window) => {
                          const span = describeWindow(window.start, window.end);
                          return (
                            <div
                              key={window.id}
                              className="flex flex-col gap-1 rounded-md border border-[color:var(--border)] bg-card/95 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="font-semibold">
                                  {WEEKDAYS[span.startDay]} {span.startTime} → {WEEKDAYS[span.endDay]} {span.endTime}
                                </p>
                                <p className="text-xs text-muted-foreground">Pedidos en esta franja se entregan el {WEEKDAYS[window.deliveryWeekday]}.</p>
                              </div>
                              <Badge variant="secondary" className="w-fit">
                                Entrega {WEEKDAYS[window.deliveryWeekday]}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Completa al menos una regla para ver el calendario semanal.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-card/95 p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-base font-semibold">Entrega según zonas</p>
                  <p className="text-xs text-muted-foreground">
                    Selecciona zona, días de entrega y hora límite. Solo un modo puede estar activo a la vez.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="delivery-available-toggle" className="text-sm font-medium text-muted-foreground">
                    Activar
                  </label>
                  <Switch
                    id="delivery-available-toggle"
                    checked={deliveryAvailableEnabled}
                    onCheckedChange={(value) => {
                      setDeliveryAvailableEnabled(value);
                      setDeliveryAvailableCollapsed(false);
                      if (value) setDeliveryRulesEnabled(false);
                      setRulesError(null);
                      ensureAvailableConfig(activeDeliveryZones);
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={deliveryAvailableCollapsed ? "Expandir reglas por días disponibles" : "Contraer reglas por días disponibles"}
                    onClick={() => setDeliveryAvailableCollapsed((prev) => !prev)}
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${deliveryAvailableCollapsed ? "rotate-180" : ""}`} />
                  </Button>
                </div>
                </div>

              {!deliveryAvailableCollapsed ? (
                <div className={`space-y-3 ${!deliveryAvailableEnabled ? "opacity-60" : ""}`}>
                  {missingAvailableZones.length ? (
                    <div className="rounded-md border border-amber-400/60 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-300/40 dark:bg-amber-500/10 dark:text-amber-100">
                      Faltan días y hora límite para: {missingAvailableZones.join(", ")}.
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowDeliveryZonesModal(true)}
                      disabled={!deliveryAvailableEnabled}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar zona
                    </Button>
                    <Badge variant="outline" className="text-[11px]">
                      {activeDeliveryZones.length} zonas activas
                    </Badge>
                  </div>

                  {!deliveryZones.length ? (
                    <p className="text-sm text-muted-foreground">
                      Primero crea zonas de envío para asignar días.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activeDeliveryZones.map((zone) => {
                        const config = deliveryAvailableConfig[zone.id] ?? { days: [], cutoffTime: "20:00" };
                        return (
                          <div
                            key={zone.id}
                            className="space-y-2 rounded-xl border border-[color:var(--border)] bg-card/95 p-3 shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">{zone.name}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(zone.price)}</p>
                              </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">Hora límite</Label>
                              <Input
                                type="time"
                                value={config.cutoffTime}
                                onChange={(event) =>
                                  setDeliveryAvailableConfig((prev) => ({
                                    ...prev,
                                    [zone.id]: { ...config, cutoffTime: event.target.value },
                                  }))
                                }
                                className="w-32"
                                disabled={!deliveryAvailableEnabled}
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((day, weekday) => {
                        const checked = config.days.includes(weekday);
                        return (
                          <label
                            key={`${zone.id}-${day}`}
                                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${checked ? "border-primary/50 bg-primary/5" : "border-[color:var(--border)] bg-card/95"}`}
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(value) => {
                                        setDeliveryAvailableConfig((prev) => {
                                          const current = prev[zone.id] ?? { days: [], cutoffTime: config.cutoffTime };
                                          const nextDays = new Set(current.days);
                                          if (value === true) {
                                            nextDays.add(weekday);
                                          } else {
                                            nextDays.delete(weekday);
                                          }
                                          return {
                                            ...prev,
                                            [zone.id]: { ...current, days: Array.from(nextDays).sort() },
                                          };
                                        });
                                      }}
                                      disabled={!deliveryAvailableEnabled}
                                    />
                                    {day}
                                  </label>
                                );
                              })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              El cliente verá solo estos días al elegir la zona. Si llega después de la hora límite, saltará al siguiente día disponible.
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeliveryRulesModal(false)}>
              Cerrar
            </Button>
            <Button
              onClick={handleSaveDeliveryRules}
              disabled={
                savingRules ||
                loadingRules ||
                !providerSlug ||
                (!deliveryRulesEnabled && !deliveryAvailableEnabled)
              }
            >
              {savingRules ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar reglas"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar producto</DialogTitle>
            <DialogDescription>
              Los productos activos aparecen en el link público de la tienda. Carga, recorta y previsualiza antes de
              guardar.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" required placeholder="Ej: Granola premium" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio</Label>
                <Input id="price" name="price" type="number" step="0.01" min="0" required placeholder="5500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Descuento %</Label>
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  min="0"
                  max="90"
                  step="1"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Precio final: <span className="font-semibold">{formatCurrency(liveAddPrice)}</span>
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="unit">Unidad</Label>
                <Input id="unit" name="unit" placeholder="kg, unidad, caja x12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  name="brand"
                  placeholder="Ej: MiMarca"
                  value={brandInput}
                  onChange={(event) => setBrandInput(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <div className="space-y-2">
                  <Input
                    id="category"
                    name="category"
                    placeholder="Snacks, bebidas..."
                    value={categoryInput}
                    list="category-suggestions"
                    onChange={(event) => setCategoryInput(event.target.value)}
                  />
                  <datalist id="category-suggestions">
                    {availableCategories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                  {availableCategories.length ? (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wide">Rápidas:</span>
                      {availableCategories.slice(0, 4).map((category) => (
                        <Button
                          key={category}
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 rounded-full px-3 text-[11px]"
                          onClick={() => setCategoryInput(category)}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">Marcar como nuevo</p>
                  <p className="text-xs text-muted-foreground">Destaca el producto con una etiqueta.</p>
                </div>
                <Switch checked={isNew} onCheckedChange={setIsNew} aria-label="Marcar producto como nuevo" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">Sin stock</p>
                  <p className="text-xs text-muted-foreground">Bloquea el agregado en el link público.</p>
                </div>
                <Switch
                  checked={isOutOfStock}
                  onCheckedChange={setIsOutOfStock}
                  aria-label="Marcar producto sin stock"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex flex-1 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === ",") {
                          event.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      placeholder="Agrega etiquetas: sin tacc, vegano..."
                      className="w-full sm:flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => addTag(tagInput)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Añadir
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Escribe una palabra y aprieta "enter" o "," (coma). Sirven para filtrar rápido en el link público. Max 14 etiquetas.
                </p>
                {tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        #{tag}
                        <button
                          type="button"
                          className="rounded-full p-0.5 hover:bg-[color:var(--muted)]"
                          onClick={() => removeTag(tag)}
                          aria-label={`Quitar etiqueta ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin etiquetas todavía.</p>
                )}
                {availableTags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTags.slice(0, 6).map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-full px-3 text-[11px]"
                        onClick={() => addTag(tag)}
                      >
                        #{tag}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" rows={3} placeholder="Notas para el cliente" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Imagen (opcional)</Label>
              <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--muted)] p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <ImagePlus className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Carga y recorta</p>
                      <p className="text-xs text-muted-foreground">
                        Ajusta el encuadre (4:3) antes de guardar. Se optimiza a {MAX_IMAGE_SIDE}px máx (&lt;1MB).
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:max-w-xs">
                    <Input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageInput}
                      disabled={pendingCreate || optimizingImage}
                      className="cursor-pointer"
                    />
                    <div className="flex flex-wrap gap-2">
                      {rawImage ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCropper(true)}
                          disabled={optimizingImage}
                        >
                          Editar recorte
                        </Button>
                      ) : null}
                      {imagePreview ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={clearImage}
                          aria-label="Quitar imagen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
                {imageStatus ? <p className="text-xs text-emerald-600 dark:text-emerald-400">{imageStatus}</p> : null}
                {imageError ? <p className="text-xs text-destructive">{imageError}</p> : null}
                {imagePreview ? (
                  <div className="flex items-center gap-3">
                    <div className="relative h-24 w-32 overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)]">
                      <NextImage
                        src={imagePreview}
                        alt="Previsualización del producto"
                        fill
                        sizes="160px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Se guardará optimizada para que la página cargue rápido en mobile.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={pendingCreate || !providerSlug || optimizingImage}>
                {pendingCreate ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </span>
                ) : optimizingImage ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Optimiza imagen...
                  </span>
                ) : (
                  "Crear producto"
                )}
              </Button>
            </div>
          </form>
          <Separator className="my-4" />
          {resultSource === "create" && result ? (
            result.success ? (
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3 text-sm">
                {result.message}
              </div>
            ) : (
              <div className="rounded-xl border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                {result.errors.join("\n")}
              </div>
            )
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingProduct)} onOpenChange={(open) => (!open ? setEditingProduct(null) : null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
            <DialogDescription>Actualiza la info y ajusta el recorte de la imagen.</DialogDescription>
          </DialogHeader>
          {editingProduct ? (
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Precio</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPrice}
                    onChange={(event) => setEditPrice(event.target.value === "" ? "" : Number(event.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-discount">Descuento %</Label>
                  <Input
                    id="edit-discount"
                    type="number"
                    min="0"
                    max="90"
                    step="1"
                    value={editDiscount}
                    onChange={(event) => setEditDiscount(event.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Precio final: <span className="font-semibold">{formatCurrency(liveEditPrice)}</span>
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">Unidad</Label>
                  <Input
                    id="edit-unit"
                    value={editUnit}
                    onChange={(event) => setEditUnit(event.target.value)}
                    placeholder="kg, unidad, caja x12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-brand">Marca</Label>
                  <Input
                    id="edit-brand"
                    value={editBrand}
                    onChange={(event) => setEditBrand(event.target.value)}
                    placeholder="Ej: MiMarca"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Categoría</Label>
                  <div className="space-y-2">
                    <Input
                      id="edit-category"
                      value={editCategory}
                      onChange={(event) => setEditCategory(event.target.value)}
                      placeholder="Snacks, bebidas..."
                      list="category-suggestions"
                    />
                    <datalist id="category-suggestions">
                      {availableCategories.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                    {availableCategories.length ? (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-semibold uppercase tracking-wide">Rápidas:</span>
                        {availableCategories.slice(0, 4).map((category) => (
                          <Button
                            key={category}
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 rounded-full px-3 text-[11px]"
                            onClick={() => setEditCategory(category)}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold">Marcar como nuevo</p>
                    <p className="text-xs text-muted-foreground">Se muestra al lado del nombre.</p>
                  </div>
                  <Switch
                    checked={editIsNew}
                    onCheckedChange={setEditIsNew}
                    aria-label="Marcar producto como nuevo"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold">Sin stock</p>
                    <p className="text-xs text-muted-foreground">No se podrá agregar al carrito.</p>
                  </div>
                  <Switch
                    checked={editIsOutOfStock}
                    onCheckedChange={setEditIsOutOfStock}
                    aria-label="Marcar producto sin stock"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Etiquetas</Label>
                <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        id="edit-tags"
                        value={editTagInput}
                        onChange={(event) => setEditTagInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === ",") {
                            event.preventDefault();
                            addEditTag(editTagInput);
                          }
                        }}
                        placeholder="Marca, temporada, categoría rápida..."
                      />
                      <Button type="button" variant="secondary" size="sm" onClick={() => addEditTag(editTagInput)}>
                        <Plus className="mr-1 h-4 w-4" />
                        Añadir
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Mantén un set corto y claro.</p>
                  </div>
                  {editTags.length ? (
                    <div className="flex flex-wrap gap-2">
                      {editTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          #{tag}
                          <button
                            type="button"
                            className="rounded-full p-0.5 hover:bg-[color:var(--muted)]"
                            onClick={() => removeEditTag(tag)}
                            aria-label={`Quitar etiqueta ${tag}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin etiquetas asignadas.</p>
                  )}
                  {availableTags.length ? (
                    <div className="flex flex-wrap gap-2">
                      {availableTags.slice(0, 8).map((tag) => (
                        <Button
                          key={tag}
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-full px-3 text-[11px]"
                          onClick={() => addEditTag(tag)}
                        >
                          #{tag}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  rows={3}
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  placeholder="Notas para el cliente"
                />
              </div>

              <div className="space-y-2">
                <Label>Imagen</Label>
                <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--muted)] p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Reemplaza o recorta</p>
                      <p className="text-xs text-muted-foreground">
                        Mantén el recorte 4:3 y optimizamos a {MAX_IMAGE_SIDE}px (&lt;1MB).
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:max-w-xs">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageInput}
                        disabled={pendingEdit || editOptimizingImage}
                        className="cursor-pointer"
                      />
                      <div className="flex flex-wrap gap-2">
                        {editRawImage || editImagePreview ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditShowCropper(true)}
                            disabled={editOptimizingImage}
                          >
                            Editar recorte
                          </Button>
                        ) : null}
                        {editingProduct.image_url || editImagePreview ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={clearEditImage}
                            aria-label="Quitar imagen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {removeEditImage ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">Se eliminará la imagen actual.</p>
                  ) : null}
                  {editImageStatus ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{editImageStatus}</p>
                  ) : null}
                  {editImageError ? <p className="text-xs text-destructive">{editImageError}</p> : null}
                  {editImagePreview || editingProduct.image_url ? (
                    <div className="flex items-center gap-3">
                      <div className="relative h-24 w-32 overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)]">
                        <NextImage
                          src={editImagePreview ?? editingProduct.image_url ?? ""}
                          alt="Previsualización del producto"
                          fill
                          sizes="160px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Vista previa del recorte que se guardará.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditingProduct(null)} disabled={pendingEdit}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pendingEdit || editOptimizingImage || !providerSlug}>
                  {pendingEdit ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </span>
                  ) : editOptimizingImage ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando imagen...
                    </span>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carga masiva (Excel)</DialogTitle>
            <DialogDescription>
              Descarga la plantilla, complétala y súbela para crear o actualizar productos rápido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleDownloadTemplate}
                    disabled={downloadingTemplate || !providerSlug}
                  >
                    {downloadingTemplate ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Preparando...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Descargar plantilla
                      </span>
                    )}
                  </Button>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-2 text-sm shadow-sm">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span>{parsingBulk ? "Leyendo..." : "Subir XLSX"}</span>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleBulkFileChange}
                      disabled={parsingBulk || !providerSlug}
                      className="hidden"
                    />
                  </label>
                  <Badge variant="outline">Máx {MAX_BULK_ROWS} filas</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mantén las columnas de la plantilla. Usa URLs públicas para imágenes o deja vacío y súbelas luego
                  desde cada producto.
                </p>
              </div>
              <div className="space-y-3 rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--muted)] p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="font-semibold text-foreground">Consejo rápido</p>
                    <p>
                      Copia/pega tus productos en la plantilla y deja las celdas de ID para que creemos nuevos. Si
                      mantienes el ID, actualizamos ese producto.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                  <div>
                    <p className="font-semibold text-foreground">Imágenes</p>
                    <p>
                      Solo se importan si apuntas a una URL pública (png/jpg/webp/avif &lt;1.2MB). De lo contrario
                      puedes subirlas manualmente en cada producto.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {bulkErrors.length ? (
              <div className="rounded-xl border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                {bulkErrors.join("\n")}
              </div>
            ) : null}

            {bulkRows.length ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{validBulkCount} filas listas</Badge>
                    <Badge variant="outline">
                      {bulkRows.length - validBulkCount} con ajustes ({bulkRows.length} total)
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleApplyBulk}
                    disabled={applyingBulk || validBulkCount === 0 || !providerSlug}
                  >
                    {applyingBulk ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importando...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Aplicar importación
                      </span>
                    )}
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {bulkRows.slice(0, 6).map((row) => (
                    <div
                      key={row.tempId}
                      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3 text-xs text-muted-foreground"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{row.name || "Sin nombre"}</p>
                        <Badge variant={row.errors.length ? "outline" : "secondary"}>
                          {row.errors.length ? "Revisar" : "OK"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-foreground">
                        {Number.isFinite(row.price) ? formatCurrency(row.price) : "—"}
                        {row.unit ? <span className="text-xs text-muted-foreground"> · {row.unit}</span> : null}
                      </p>
                      {row.brand ? (
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{row.brand}</p>
                      ) : null}
                      <div className="mt-1 flex flex-wrap gap-2">
                        {row.tags.slice(0, 4).map((tag) => (
                          <Badge key={`${row.tempId}-${tag}`} variant="outline" className="rounded-full px-2 py-0">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      {row.errors.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-destructive">
                          {row.errors.slice(0, 3).map((issue) => (
                            <li key={`${row.tempId}-${issue}`}>{issue}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-[11px] uppercase text-muted-foreground">
                          {row.productId ? "Actualizaremos este producto" : "Crearemos producto nuevo"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {bulkRows.length > 6 ? (
                  <p className="text-xs text-muted-foreground">Vista previa de {bulkRows.length} filas (mostramos 6).</p>
                ) : null}
              </div>
            ) : null}

            {bulkSummary ? (
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)] p-3 text-sm">
                <p className="font-semibold text-foreground">Resultado de la importación</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <Badge variant="secondary">Creados: {bulkSummary.created}</Badge>
                  <Badge variant="secondary">Actualizados: {bulkSummary.updated}</Badge>
                  <Badge variant="outline">Saltados: {bulkSummary.skipped}</Badge>
                </div>
                {bulkSummary.warnings.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-600 dark:text-amber-400">
                    {bulkSummary.warnings.slice(0, 4).map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajustar recorte</DialogTitle>
            <DialogDescription>
              Mueve el encuadre para decidir qué parte se verá en el catálogo (proporción 4:3).
            </DialogDescription>
          </DialogHeader>
          {rawImage ? (
            <div className="space-y-4">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={rawImage.dataUrl} alt="Imagen original" className="h-full w-full object-contain" />
                {cropPreviewRect ? (
                  <div
                    className="pointer-events-none absolute border-2 border-primary/80 bg-primary/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] backdrop-blur-[1px]"
                    style={{
                      top: `${cropPreviewRect.top}%`,
                      left: `${cropPreviewRect.left}%`,
                      width: `${cropPreviewRect.width}%`,
                      height: `${cropPreviewRect.height}%`,
                      transition: "all 120ms ease",
                    }}
                  />
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cropX">Horizonte</Label>
                  <input
                    id="cropX"
                    type="range"
                    min={0}
                    max={100}
                    value={cropX}
                    onChange={(event) => setCropX(Number(event.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Mueve el recuadro a la izquierda/derecha.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cropY">Vertical</Label>
                  <input
                    id="cropY"
                    type="range"
                    min={0}
                    max={100}
                    value={cropY}
                    onChange={(event) => setCropY(Number(event.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Mueve el recuadro hacia arriba/abajo.</p>
                </div>
              </div>

              <DialogFooter className="flex flex-row items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Original: {rawImage.width}x{rawImage.height}px · {formatKb(rawImage.size)} KB
                </p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowCropper(false)} disabled={optimizingImage}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={applyCrop} disabled={optimizingImage}>
                    {optimizingImage ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Aplicando...
                      </span>
                    ) : (
                      "Aplicar recorte"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Carga una imagen para editar su recorte.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editShowCropper} onOpenChange={setEditShowCropper}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajustar recorte (edición)</DialogTitle>
            <DialogDescription>Aplica el encuadre 4:3 para la imagen editada.</DialogDescription>
          </DialogHeader>
          {editRawImage ? (
            <div className="space-y-4">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={editRawImage.dataUrl} alt="Imagen original" className="h-full w-full object-contain" />
                {editCropPreviewRect ? (
                  <div
                    className="pointer-events-none absolute border-2 border-primary/80 bg-primary/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] backdrop-blur-[1px]"
                    style={{
                      top: `${editCropPreviewRect.top}%`,
                      left: `${editCropPreviewRect.left}%`,
                      width: `${editCropPreviewRect.width}%`,
                      height: `${editCropPreviewRect.height}%`,
                      transition: "all 120ms ease",
                    }}
                  />
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-cropX">Horizonte</Label>
                  <input
                    id="edit-cropX"
                    type="range"
                    min={0}
                    max={100}
                    value={editCropX}
                    onChange={(event) => setEditCropX(Number(event.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Mueve el recuadro a la izquierda/derecha.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cropY">Vertical</Label>
                  <input
                    id="edit-cropY"
                    type="range"
                    min={0}
                    max={100}
                    value={editCropY}
                    onChange={(event) => setEditCropY(Number(event.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Mueve el recuadro hacia arriba/abajo.</p>
                </div>
              </div>
              <DialogFooter className="flex flex-row items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Original: {editRawImage.width}x{editRawImage.height}px · {formatKb(editRawImage.size)} KB
                </p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" onClick={() => setEditShowCropper(false)} disabled={editOptimizingImage}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={applyEditCrop} disabled={editOptimizingImage}>
                    {editOptimizingImage ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Aplicando...
                      </span>
                    ) : (
                      "Aplicar recorte"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Carga una imagen para editar su recorte.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
