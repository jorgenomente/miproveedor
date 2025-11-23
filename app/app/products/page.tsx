"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ImagePlus, Loader2, Plus, RefreshCcw, Tag, ToggleLeft, Trash2, X } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/whatsapp";
import {
  createProduct,
  listProducts,
  toggleProductActive,
  updateProduct,
  type CreateProductResult,
  type ProductRow,
  type UpdateProductResult,
} from "./actions";

export type ProductsPageProps = { initialProviderSlug?: string };

const MAX_IMAGE_SIDE = 720;
const MAX_IMAGE_BYTES = 900 * 1024; // mantener <1MB para evitar límites de body
const TARGET_CROP_ASPECT = 4 / 3;

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
  const providerSlug = initialProviderSlug ?? "";
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateProductResult | UpdateProductResult | null>(null);
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
  const [editPrice, setEditPrice] = useState<number | "">("");
  const [editUnit, setEditUnit] = useState("");
  const [editCategory, setEditCategory] = useState("");
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
    startCreate(async () => {
      const response = await createProduct({
        providerSlug,
        name: (formData.get("name") as string) ?? "",
        price: priceValue,
        discountPercent: discountValue,
        unit: (formData.get("unit") as string) ?? "",
        description: (formData.get("description") as string) ?? "",
        category: categoryValue,
        tags,
        isNew,
        isOutOfStock,
        imageBase64: imageDataUrl,
      });
      setResult(response);
      if (response.success) {
        (event.target as HTMLFormElement).reset();
        clearImage();
        setDiscount("");
        setCategoryInput("");
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
        unit: editUnit || "",
        description: editDescription || "",
        category: editCategory || "",
        tags: editTags,
        isNew: editIsNew,
        isOutOfStock: editIsOutOfStock,
        imageBase64: editImageDataUrl,
        removeImage: removeEditImage && !editImageDataUrl,
      });
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
          Usa la ruta /app/[providerSlug]/products para gestionar el catálogo de un proveedor.
        </p>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/50 px-4 pb-12 pt-6 sm:px-8">
      <main className="mx-auto flex max-w-5xl flex-col gap-6">
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
            <Button
              size="icon"
              variant="outline"
              onClick={() => void loadProducts(providerSlug)}
              aria-label="Refrescar productos"
              disabled={loadingProducts}
            >
              <RefreshCcw className={`h-4 w-4 ${loadingProducts ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Catálogo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Activa / desactiva productos y revisa su precio final para los pedidos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{providerSlug || "Sin proveedor"}</Badge>
              <Badge variant="secondary">{products.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {productsError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {productsError}
              </div>
            ) : null}

            {loadingProducts ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="rounded-xl border border-border/60 bg-secondary/30 p-4">
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
              <div className="rounded-xl border border-dashed border-border/70 bg-secondary/30 p-4 text-sm text-muted-foreground">
                Aún no hay productos para este proveedor.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 items-start gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border/60 bg-secondary/40">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={`Imagen de ${product.name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] uppercase text-muted-foreground">
                        Sin foto
                      </div>
                    )}
                  </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{product.name}</p>
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
                        <Badge variant={product.is_active ? "secondary" : "outline"}>
                          {product.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {product.description || "Sin descripción"}
                      </p>
                    {product.discount_percent && product.discount_percent > 0 ? (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="line-through">{formatCurrency(product.price)}</span>
                        <Badge variant="secondary" className="text-[11px]">
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
                          <Badge key={`${product.id}-${tag}`} variant="outline" className="rounded-full px-2 py-0 text-[11px]">
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

        <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Agregar producto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Los productos activos aparecen en el link público de la tienda.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" required placeholder="Ej: Granola premium" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="5500"
                  />
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidad</Label>
                  <Input id="unit" name="unit" placeholder="kg, unidad, caja x12" />
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
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold">Marcar como nuevo</p>
                    <p className="text-xs text-muted-foreground">Destaca el producto con una etiqueta.</p>
                  </div>
                  <Switch checked={isNew} onCheckedChange={setIsNew} aria-label="Marcar producto como nuevo" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
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
                <div className="space-y-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex flex-1 items-center gap-2">
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
                      />
                      <Button type="button" variant="secondary" size="sm" onClick={() => addTag(tagInput)}>
                        <Plus className="mr-1 h-4 w-4" />
                        Añadir
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sirven para filtrar rápido en el link público. Max 14 etiquetas.
                    </p>
                  </div>
                  {tags.length ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          #{tag}
                          <button
                            type="button"
                            className="rounded-full p-0.5 hover:bg-background"
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
                <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border/60 bg-secondary/30 p-3">
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
                    <div className="flex items-center gap-2">
                      <Input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageInput}
                        disabled={pendingCreate || optimizingImage}
                        className="cursor-pointer"
                      />
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
                  {imageStatus ? <p className="text-xs text-emerald-600 dark:text-emerald-400">{imageStatus}</p> : null}
                  {imageError ? <p className="text-xs text-destructive">{imageError}</p> : null}
                  {imagePreview ? (
                    <div className="flex items-center gap-3">
                      <div className="relative h-24 w-32 overflow-hidden rounded-lg border border-border/60 bg-background/60">
                        <img src={imagePreview} alt="Previsualización del producto" className="h-full w-full object-cover" />
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
            {result ? (
              result.success ? (
                <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 text-sm">
                  {result.message}
                </div>
              ) : (
                <div className="rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                  {result.errors.join("\n")}
                </div>
              )
            ) : null}
          </CardContent>
        </Card>
      </main>

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
              <div className="grid gap-4 sm:grid-cols-2">
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
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
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
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
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
                <div className="space-y-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
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
                            className="rounded-full p-0.5 hover:bg-background"
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
                <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border/60 bg-secondary/30 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Reemplaza o recorta</p>
                      <p className="text-xs text-muted-foreground">
                        Mantén el recorte 4:3 y optimizamos a {MAX_IMAGE_SIDE}px (&lt;1MB).
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageInput}
                        disabled={pendingEdit || editOptimizingImage}
                        className="cursor-pointer"
                      />
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
                  {removeEditImage ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">Se eliminará la imagen actual.</p>
                  ) : null}
                  {editImageStatus ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{editImageStatus}</p>
                  ) : null}
                  {editImageError ? <p className="text-xs text-destructive">{editImageError}</p> : null}
                  {editImagePreview || editingProduct.image_url ? (
                    <div className="flex items-center gap-3">
                      <div className="relative h-24 w-32 overflow-hidden rounded-lg border border-border/60 bg-background/60">
                        <img
                          src={editImagePreview ?? editingProduct.image_url ?? ""}
                          alt="Previsualización del producto"
                          className="h-full w-full object-cover"
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
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border/60 bg-secondary/30">
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
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border/60 bg-secondary/30">
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
