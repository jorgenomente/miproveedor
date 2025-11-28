"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import * as XLSX from "xlsx";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDemoData } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getProviderScope } from "@/lib/provider-scope";
import { sortRules, timeStringToMinutes, type DeliveryRule } from "@/lib/delivery-windows";

const PRODUCT_IMAGES_BUCKET = "product-images";
const MAX_IMAGE_SIZE_BYTES = 950 * 1024; // mantener <1MB para el body y subir rápido
const MAX_REMOTE_IMAGE_SIZE_BYTES = 1200 * 1024;
const MAX_BULK_ROWS = 500;
const ALLOWED_REMOTE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const imageDataUrlRegex = /^data:image\/(png|jpe?g|webp|avif);base64,/i;

const createSchema = z.object({
  providerSlug: z.string().min(2),
  name: z.string().min(2),
  price: z.number().positive(),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  brand: z.string().trim().max(120).optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
  isNew: z.boolean().optional(),
  isOutOfStock: z.boolean().optional(),
  imageBase64: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((value) => !value || imageDataUrlRegex.test(value), {
      message: "La imagen debe ser PNG, JPG, WEBP o AVIF.",
    }),
});

const deliveryZoneSchema = z.object({
  providerSlug: z.string().min(2, "Proveedor requerido"),
  name: z.string().trim().min(2, "Nombre requerido"),
  price: z.number().nonnegative("El costo debe ser mayor o igual a 0"),
});

const activeSchema = z.object({
  providerSlug: z.string().min(2),
  productId: z.string().uuid(),
  isActive: z.boolean(),
});

const updateSchema = z.object({
  providerSlug: z.string().min(2),
  productId: z.string().uuid(),
  name: z.string().min(2),
  price: z.number().positive(),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  brand: z.string().trim().max(120).optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
  isNew: z.boolean().optional(),
  isOutOfStock: z.boolean().optional(),
  imageBase64: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((value) => !value || imageDataUrlRegex.test(value), {
      message: "La imagen debe ser PNG, JPG, WEBP o AVIF.",
    }),
  removeImage: z.boolean().optional(),
});

const bulkRowSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(2).max(160),
  price: z.preprocess((value) => Number(value), z.number().positive()),
  discountPercent: z
    .preprocess(
      (value) => (value === undefined || value === null || value === "" ? 0 : Number(value)),
      z.number().min(0).max(100),
    )
    .optional()
    .default(0),
  brand: z.preprocess((value) => safeText(value, 120), z.string().max(120).optional().nullable()),
  unit: z.preprocess((value) => safeText(value, 80), z.string().max(80).optional().nullable()),
  category: z.preprocess((value) => safeText(value, 120), z.string().max(120).optional().nullable()),
  description: z.preprocess((value) => safeText(value, 400), z.string().max(400).optional().nullable()),
  tags: z
    .preprocess((value) => parseTagsFromCell(value), z.array(z.string().trim().min(1).max(40)).max(14))
    .optional()
    .default([]),
  isNew: z
    .preprocess(
      (value) => (value === undefined || value === null || value === "" ? undefined : parseBooleanInput(value, false)),
      z.boolean().optional(),
    )
    .optional(),
  isOutOfStock: z
    .preprocess(
      (value) => (value === undefined || value === null || value === "" ? undefined : parseBooleanInput(value, false)),
      z.boolean().optional(),
    )
    .optional(),
  isActive: z
    .preprocess(
      (value) => (value === undefined || value === null || value === "" ? undefined : parseBooleanInput(value, true)),
      z.boolean().optional(),
    )
    .optional(),
  imageUrl: z.string().url().optional().nullable(),
});

const bulkSchema = z.object({
  providerSlug: z.string().min(2),
  rows: z.array(bulkRowSchema).min(1).max(MAX_BULK_ROWS),
});

export type ProductRow = {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  unit: string | null;
  is_active: boolean | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  discount_percent: number | null;
  tags: string[] | null;
  is_new: boolean | null;
  is_out_of_stock: boolean | null;
  created_at: string | null;
};

export type ProviderRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean | null;
};

export type DeliveryRuleInput = {
  id?: string;
  cutoffWeekday: number;
  cutoffTime: string;
  deliveryWeekday: number;
};

export type DeliveryRuleRow = {
  id: string;
  cutoffWeekday: number;
  cutoffTimeMinutes: number;
  deliveryWeekday: number;
  deliveryTimeMinutes: number;
};

export type DeliveryZone = {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
};

export type DeliveryAvailableRow = {
  zoneId: string;
  deliveryWeekdays: number[];
  cutoffTimeMinutes: number;
};

export type ListDeliveryRulesResult =
  | { success: true; rules: DeliveryRuleRow[]; mode: "windows" | "available_days"; availableRules: DeliveryAvailableRow[] }
  | { success: false; errors: string[] };

export type SaveDeliveryRulesResult =
  | { success: true; message: string }
  | { success: false; errors: string[] };

export type ListProductsResult =
  | { success: true; products: ProductRow[]; provider: ProviderRow }
  | { success: false; errors: string[] };

export type CreateProductResult =
  | { success: true; message: string; productId: string }
  | { success: false; errors: string[] };

export type ToggleProductResult =
  | { success: true; message: string }
  | { success: false; errors: string[] };

export type UpdateProductResult =
  | { success: true; message: string }
  | { success: false; errors: string[] };

export type ExportProductsResult =
  | { success: true; fileName: string; base64: string }
  | { success: false; errors: string[] };

export type BulkUpsertDetail = {
  row: number;
  name: string;
  status: "created" | "updated" | "skipped" | "error";
  message?: string;
  productId?: string;
};

export type BulkUpsertSummary = {
  created: number;
  updated: number;
  skipped: number;
  warnings: string[];
  details: BulkUpsertDetail[];
};

export type BulkUpsertResult =
  | { success: true; summary: BulkUpsertSummary }
  | { success: false; errors: string[] };

export async function listProviders(): Promise<
  | { success: true; providers: ProviderRow[] }
  | { success: false; errors: string[] }
> {
  const demo = getDemoData();
  const demoProvider: ProviderRow = {
    id: demo.provider.id,
    name: demo.provider.name,
    slug: demo.provider.slug,
    is_active: true,
  };

  const scopeResult = await getProviderScope();
  const scope = scopeResult.scope;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: true, providers: [demoProvider] };
  }

  if (scopeResult.error && !scope) {
    return { success: true, providers: [demoProvider] };
  }

  if (scope && scope.role === "provider") {
    const { data, error } = await supabase
      .from("providers")
      .select("id, name, slug, is_active")
      .eq("id", scope.provider.id)
      .maybeSingle();

    if (error || !data) {
      return {
        success: false,
        errors: [
          error?.message ? `No se pudo cargar tu proveedor: ${error.message}` : "Proveedor no encontrado.",
        ],
      };
    }

    return { success: true, providers: [demoProvider, data] };
  }

  const { data, error } = await supabase
    .from("providers")
    .select("id, name, slug, is_active")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, errors: [`No se pudieron cargar proveedores: ${error.message}`] };
  }

  const providers = data ?? [];
  const merged =
    providers.some((provider) => provider.slug === demoProvider.slug)
      ? providers
      : [demoProvider, ...providers];

  return { success: true, providers: merged };
}

async function ensureProductBucketExists(supabase: SupabaseClient) {
  const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(PRODUCT_IMAGES_BUCKET);

  if (bucketData) return { ok: true as const };

  if (bucketError && !/not exist/i.test(bucketError.message)) {
    return { ok: false as const, error: `No se pudo validar el bucket: ${bucketError.message}` };
  }

  const { error: createError } = await supabase.storage.createBucket(PRODUCT_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: `${Math.ceil(MAX_IMAGE_SIZE_BYTES)}`,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/avif"],
  });

  if (createError) {
    return { ok: false as const, error: `No se pudo preparar el bucket de imágenes: ${createError.message}` };
  }

  return { ok: true as const };
}

function decodeBase64Image(dataUrl: string) {
  if (!imageDataUrlRegex.test(dataUrl)) return null;

  const [, mimeType] = dataUrl.match(imageDataUrlRegex) ?? [];
  const base64 = dataUrl.replace(imageDataUrlRegex, "");
  const buffer = Buffer.from(base64, "base64");

  if (!mimeType || Number.isNaN(buffer.byteLength)) return null;

  return { buffer, mimeType: `image/${mimeType.replace("image/", "")}` };
}

function normalizeTags(raw?: string[] | null) {
  if (!raw) return [];
  const dedup = new Map<string, string>();
  raw
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 15)
    .forEach((tag) => {
      const key = tag.toLowerCase();
      if (!dedup.has(key)) dedup.set(key, tag);
    });
  return Array.from(dedup.values());
}

function parseBooleanInput(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const clean = value.trim().toLowerCase();
    if (["si", "sí", "yes", "y", "true", "1"].includes(clean)) return true;
    if (["no", "false", "0"].includes(clean)) return false;
  }
  return fallback;
}

function parseTagsFromCell(value: unknown) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(/[;,]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function safeText(value: unknown, max = 400) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

async function uploadImageFromUrl(
  supabase: SupabaseClient,
  providerSlug: string,
  imageUrl: string,
): Promise<{ url?: string; error?: string }> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return { error: `No se pudo descargar la imagen (${response.status}).` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    const mimeType = ALLOWED_REMOTE_IMAGE_TYPES.find((allowed) => contentType.includes(allowed));
    if (!mimeType) {
      return { error: "La imagen debe ser PNG, JPG, WEBP o AVIF (url pública)." };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.byteLength > MAX_REMOTE_IMAGE_SIZE_BYTES) {
      return {
        error: `La imagen es muy pesada (${Math.round(buffer.byteLength / 1024)}KB). Máximo 1200KB.`,
      };
    }

    const bucketResult = await ensureProductBucketExists(supabase);
    if (!bucketResult.ok) {
      return { error: bucketResult.error ?? "No se pudo preparar el bucket de imágenes." };
    }

    const extension = mimeType.split("/")[1] ?? "jpg";
    const objectPath = `${providerSlug}/${Date.now()}-${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(objectPath, buffer, {
      contentType: mimeType,
      cacheControl: "31536000",
      upsert: false,
    });

    if (uploadError) {
      return { error: `No se pudo guardar la imagen: ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(objectPath);

    if (!publicUrlData?.publicUrl) {
      return { error: "La imagen se subió pero no pudimos obtener la URL pública." };
    }

    return { url: publicUrlData.publicUrl };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo descargar la imagen remota.",
    };
  }
}

async function getProviderBySlug(slug: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Faltan credenciales de Supabase (SERVICE_ROLE / URL)." };

  const { data, error } = await supabase
    .from("providers")
    .select("id, name, slug, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return { error: `Proveedor no disponible: ${error?.message ?? "no encontrado"}` };
  }

  return { provider: data };
}

export async function listProducts(providerSlug: string): Promise<ListProductsResult> {
  if (providerSlug === "demo") {
    const demo = getDemoData();
    return {
      success: true,
      products: demo.products.map(
        (product): ProductRow => ({
          id: product.id,
          name: product.name,
          brand: null,
          price: product.price,
          unit: product.unit ?? null,
          is_active: product.is_active ?? true,
          category: product.category ?? null,
          description: product.description ?? null,
          image_url: product.image_url ?? null,
          discount_percent: product.discount_percent ?? 0,
          tags: product.tags ?? [],
          is_new: product.is_new ?? false,
          is_out_of_stock: product.is_out_of_stock ?? false,
          created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        }),
      ),
      provider: {
        id: demo.provider.id,
        name: demo.provider.name,
        slug: demo.provider.slug,
        is_active: true,
      },
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."],
    };
  }

  const { provider, error } = await getProviderBySlug(providerSlug);
  if (error || !provider) {
    return { success: false, errors: [error ?? "Proveedor no encontrado."] };
  }

  const { data, error: productsError } = await supabase
    .from("products")
    .select(
      "id, name, brand, price, unit, is_active, category, description, image_url, discount_percent, tags, is_new, is_out_of_stock, created_at",
    )
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false });

  if (productsError) {
    return {
      success: false,
      errors: [`No se pudieron cargar productos: ${productsError.message}`],
    };
  }

  return {
    success: true,
    products: (data ?? []).map((item) => ({
      ...item,
      brand: item.brand ?? null,
      price: Number(item.price ?? 0),
      tags: Array.isArray(item.tags) ? item.tags : [],
      is_new: Boolean(item.is_new),
      is_out_of_stock: Boolean(item.is_out_of_stock),
    })),
    provider,
  };
}

export async function createProduct(
  payload: z.infer<typeof createSchema>,
): Promise<CreateProductResult> {
  if (payload.providerSlug === "demo") {
    return {
      success: true,
      message: "Modo demo: el producto no se guarda, es solo de muestra.",
      productId: "demo-product",
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== parsed.data.providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."],
    };
  }

  const { provider, error } = await getProviderBySlug(parsed.data.providerSlug);
  if (error || !provider) {
    return { success: false, errors: [error ?? "Proveedor no encontrado."] };
  }

  if (provider.is_active === false) {
    return { success: false, errors: ["El proveedor está inactivo."] };
  }

  const tags = normalizeTags(parsed.data.tags);
  let imageUrl: string | null = null;

  if (parsed.data.imageBase64) {
    const decoded = decodeBase64Image(parsed.data.imageBase64);
    if (!decoded) {
      return { success: false, errors: ["No pudimos leer la imagen optimizada."] };
    }

    if (decoded.buffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      return {
        success: false,
        errors: [
          `La imagen optimizada sigue siendo pesada (${Math.round(decoded.buffer.byteLength / 1024)}KB).`,
        ],
      };
    }

    const bucketResult = await ensureProductBucketExists(supabase);
    if (!bucketResult.ok) {
      return { success: false, errors: [bucketResult.error ?? "No se pudo preparar el bucket de imágenes."] };
    }

    const extension = decoded.mimeType.split("/")[1] ?? "jpg";
    const objectPath = `${provider.slug}/${Date.now()}-${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(objectPath, decoded.buffer, {
        contentType: decoded.mimeType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      return { success: false, errors: [`No se pudo guardar la imagen: ${uploadError.message}`] };
    }

    const { data: publicUrlData } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(objectPath);

    if (!publicUrlData?.publicUrl) {
      return { success: false, errors: ["La imagen se subió pero no pudimos obtener la URL pública."] };
    }

    imageUrl = publicUrlData.publicUrl;
  }

  const { data, error: insertError } = await supabase
    .from("products")
    .insert({
      provider_id: provider.id,
      name: parsed.data.name,
      brand: parsed.data.brand ?? null,
      price: parsed.data.price,
      discount_percent: parsed.data.discountPercent ?? 0,
      unit: parsed.data.unit ?? null,
      description: parsed.data.description ?? null,
      category: parsed.data.category ?? null,
      tags,
      is_new: Boolean(parsed.data.isNew),
      is_out_of_stock: Boolean(parsed.data.isOutOfStock),
      is_active: true,
      image_url: imageUrl,
    })
    .select("id")
    .single();

  if (insertError || !data?.id) {
    return {
      success: false,
      errors: [`No se pudo crear el producto: ${insertError?.message ?? "sin detalle"}`],
    };
  }

  return { success: true, message: "Producto creado.", productId: data.id };
}

export async function updateProduct(
  payload: z.infer<typeof updateSchema>,
): Promise<UpdateProductResult> {
  if (payload.providerSlug === "demo") {
    return {
      success: true,
      message: "Modo demo: el cambio no se guarda, es solo de muestra.",
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== parsed.data.providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."],
    };
  }

  const { provider, error } = await getProviderBySlug(parsed.data.providerSlug);
  if (error || !provider) {
    return { success: false, errors: [error ?? "Proveedor no encontrado."] };
  }

  if (provider.is_active === false) {
    return { success: false, errors: ["El proveedor está inactivo."] };
  }

  const { data: existing, error: existingError } = await supabase
    .from("products")
    .select("id")
    .eq("id", parsed.data.productId)
    .eq("provider_id", provider.id)
    .maybeSingle();

  if (existingError || !existing) {
    return { success: false, errors: ["Producto no encontrado para este proveedor."] };
  }

  const tags = parsed.data.tags ? normalizeTags(parsed.data.tags) : undefined;
  let imageUrl: string | undefined | null;

  if (parsed.data.imageBase64) {
    const decoded = decodeBase64Image(parsed.data.imageBase64);
    if (!decoded) {
      return { success: false, errors: ["No pudimos leer la imagen optimizada."] };
    }

    if (decoded.buffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      return {
        success: false,
        errors: [
          `La imagen optimizada sigue siendo pesada (${Math.round(decoded.buffer.byteLength / 1024)}KB).`,
        ],
      };
    }

    const bucketResult = await ensureProductBucketExists(supabase);
    if (!bucketResult.ok) {
      return { success: false, errors: [bucketResult.error ?? "No se pudo preparar el bucket de imágenes."] };
    }

    const extension = decoded.mimeType.split("/")[1] ?? "jpg";
    const objectPath = `${provider.slug}/${Date.now()}-${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(objectPath, decoded.buffer, {
        contentType: decoded.mimeType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      return { success: false, errors: [`No se pudo guardar la imagen: ${uploadError.message}`] };
    }

    const { data: publicUrlData } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(objectPath);

    if (!publicUrlData?.publicUrl) {
      return { success: false, errors: ["La imagen se subió pero no pudimos obtener la URL pública."] };
    }

    imageUrl = publicUrlData.publicUrl;
  } else if (parsed.data.removeImage) {
    imageUrl = null;
  }

  const updatePayload: Record<string, unknown> = {
    name: parsed.data.name,
    brand: parsed.data.brand ?? null,
    price: parsed.data.price,
    discount_percent: parsed.data.discountPercent ?? 0,
    unit: parsed.data.unit ?? null,
    description: parsed.data.description ?? null,
    category: parsed.data.category ?? null,
  };

  if (tags !== undefined) {
    updatePayload.tags = tags;
  }
  updatePayload.is_new = Boolean(parsed.data.isNew);
  updatePayload.is_out_of_stock = Boolean(parsed.data.isOutOfStock);

  if (imageUrl !== undefined) {
    updatePayload.image_url = imageUrl;
  }

  const { error: updateError } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", parsed.data.productId)
    .eq("provider_id", provider.id);

  if (updateError) {
    return { success: false, errors: [`No se pudo actualizar el producto: ${updateError.message}`] };
  }

  return { success: true, message: "Producto actualizado." };
}

export async function toggleProductActive(
  payload: z.infer<typeof activeSchema>,
): Promise<ToggleProductResult> {
  if (payload.providerSlug === "demo") {
    return {
      success: true,
      message: "Modo demo: el estado se actualiza solo para esta vista.",
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  const parsed = activeSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== parsed.data.providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."],
    };
  }

  const { provider, error } = await getProviderBySlug(parsed.data.providerSlug);
  if (error || !provider) {
    return { success: false, errors: [error ?? "Proveedor no encontrado."] };
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.productId)
    .eq("provider_id", provider.id);

  if (updateError) {
    return {
      success: false,
      errors: [`No se pudo actualizar el producto: ${updateError.message}`],
    };
  }

  return { success: true, message: "Producto actualizado." };
}

export async function exportProductsTemplate(providerSlug: string): Promise<ExportProductsResult> {
  if (!providerSlug) {
    return { success: false, errors: ["Falta el slug del proveedor."] };
  }

  if (providerSlug === "demo") {
    const demo = getDemoData();
    const header = [
      "product_id",
      "name",
      "brand",
      "price",
      "discount_percent",
      "unit",
      "category",
      "description",
      "tags",
      "is_active",
      "is_new",
      "is_out_of_stock",
      "image_url",
    ];
    const sheetRows = [
      ["Completa y reimporta. Obligatorios: name, price. Usa sí/no o 1/0 para booleanos."],
      header,
      [
        "",
        "Granola cacao",
        "MiMarca",
        5999.9,
        10,
        "caja x12",
        "Snacks",
        "Notas breves",
        "vegano, sin tacc",
        "sí",
        "no",
        "sí",
        "https://ejemplo.com/foto.webp",
      ],
      ...demo.products.map((product) => [
        product.id,
        product.name,
        product.brand ?? "",
        product.price,
        product.discount_percent ?? 0,
        product.unit ?? "",
        product.category ?? "",
        product.description ?? "",
        (product.tags ?? []).join(", "),
        (product.is_active ?? true) ? "sí" : "no",
        (product.is_new ?? false) ? "sí" : "no",
        (product.is_out_of_stock ?? false) ? "sí" : "no",
        product.image_url ?? "",
      ]),
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return {
      success: true,
      fileName: `productos-${demo.provider.slug}.xlsx`,
      base64: Buffer.isBuffer(buffer)
        ? buffer.toString("base64")
        : Buffer.from(buffer as ArrayBuffer).toString("base64"),
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."],
    };
  }

  const { provider, error } = await getProviderBySlug(providerSlug);
  if (error || !provider) {
    return { success: false, errors: [error ?? "Proveedor no encontrado."] };
  }

  const { data, error: productsError } = await supabase
    .from("products")
    .select(
      "id, name, brand, price, unit, category, description, image_url, discount_percent, tags, is_new, is_out_of_stock, is_active",
    )
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: true });

  if (productsError) {
    return {
      success: false,
      errors: [`No se pudieron exportar productos: ${productsError.message}`],
    };
  }

  const header = [
    "product_id",
    "name",
    "brand",
    "price",
    "discount_percent",
    "unit",
    "category",
    "description",
    "tags",
    "is_active",
    "is_new",
    "is_out_of_stock",
    "image_url",
  ];

  const sheetRows = [
    ["Completa y reimporta. Obligatorios: name, price. Usa sí/no o 1/0 para booleanos."],
    header,
    [
      "",
      "Granola cacao",
      "MiMarca",
      5999.9,
      10,
      "caja x12",
      "Snacks",
      "Notas breves",
      "vegano, sin tacc",
      "sí",
      "no",
      "sí",
      "https://ejemplo.com/foto.webp",
    ],
    ...(data ?? []).map((product) => [
      product.id,
      product.name,
      product.brand ?? "",
      Number(product.price ?? 0),
      product.discount_percent ?? 0,
      product.unit ?? "",
      product.category ?? "",
      product.description ?? "",
      Array.isArray(product.tags) ? product.tags.join(", ") : "",
      product.is_active ? "sí" : "no",
      product.is_new ? "sí" : "no",
      product.is_out_of_stock ? "sí" : "no",
      product.image_url ?? "",
    ]),
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return {
    success: true,
    fileName: `productos-${provider.slug}.xlsx`,
    base64: Buffer.isBuffer(buffer)
      ? buffer.toString("base64")
      : Buffer.from(buffer as ArrayBuffer).toString("base64"),
  };
}

export async function bulkUpsertProducts(payload: z.infer<typeof bulkSchema>): Promise<BulkUpsertResult> {
  const parsed = bulkSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  if (parsed.data.providerSlug === "demo") {
    return {
      success: true,
      summary: {
        created: parsed.data.rows.length,
        updated: 0,
        skipped: 0,
        warnings: ["Modo demo: no se guardan cambios, solo simulación."],
        details: parsed.data.rows.map((row, index) => ({
          row: index + 1,
          name: row.name,
          status: "created",
          message: "Simulado en demo.",
        })),
      },
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== parsed.data.providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."],
    };
  }

  const { provider, error } = await getProviderBySlug(parsed.data.providerSlug);
  if (error || !provider) {
    return { success: false, errors: [error ?? "Proveedor no encontrado."] };
  }

  if (provider.is_active === false) {
    return { success: false, errors: ["El proveedor está inactivo."] };
  }

  const summary: BulkUpsertSummary = {
    created: 0,
    updated: 0,
    skipped: 0,
    warnings: [],
    details: [],
  };

  for (let index = 0; index < parsed.data.rows.length; index += 1) {
    const row = parsed.data.rows[index];
    const rowNumber = index + 1;
    try {
      const tags = normalizeTags(row.tags);
      let imageUrl: string | undefined;

      if (row.imageUrl) {
        const upload = await uploadImageFromUrl(supabase, provider.slug, row.imageUrl);
        if (upload.error) {
          summary.warnings.push(`Fila ${rowNumber} (${row.name}): ${upload.error}`);
        } else if (upload.url) {
          imageUrl = upload.url;
        }
      }

      if (row.id) {
        const { data: existing, error: existingError } = await supabase
          .from("products")
          .select("id")
          .eq("id", row.id)
          .eq("provider_id", provider.id)
          .maybeSingle();

        if (existingError || !existing) {
          summary.details.push({
            row: rowNumber,
            name: row.name,
            status: "skipped",
            message: "No encontramos este producto para el proveedor.",
          });
          summary.skipped += 1;
          continue;
        }

        const updatePayload: Record<string, unknown> = {
          name: row.name,
          brand: row.brand ?? null,
          price: row.price,
          discount_percent: row.discountPercent ?? 0,
          unit: row.unit ?? null,
          category: row.category ?? null,
          description: row.description ?? null,
          tags,
        };

        if (row.isNew !== undefined) updatePayload.is_new = row.isNew;
        if (row.isOutOfStock !== undefined) updatePayload.is_out_of_stock = row.isOutOfStock;
        if (row.isActive !== undefined) updatePayload.is_active = row.isActive;
        if (imageUrl !== undefined) updatePayload.image_url = imageUrl;

        const { error: updateError } = await supabase
          .from("products")
          .update(updatePayload)
          .eq("id", row.id)
          .eq("provider_id", provider.id);

        if (updateError) {
          summary.details.push({
            row: rowNumber,
            name: row.name,
            status: "error",
            message: `No se pudo actualizar: ${updateError.message}`,
          });
          continue;
        }

        summary.details.push({
          row: rowNumber,
          name: row.name,
          status: "updated",
          productId: row.id,
        });
        summary.updated += 1;
      } else {
        const insertPayload = {
          provider_id: provider.id,
          name: row.name,
          brand: row.brand ?? null,
          price: row.price,
          discount_percent: row.discountPercent ?? 0,
          unit: row.unit ?? null,
          category: row.category ?? null,
          description: row.description ?? null,
          tags,
          is_new: row.isNew ?? false,
          is_out_of_stock: row.isOutOfStock ?? false,
          is_active: row.isActive ?? true,
          image_url: imageUrl ?? null,
        };

        const { data: created, error: insertError } = await supabase
          .from("products")
          .insert(insertPayload)
          .select("id")
          .single();

        if (insertError || !created?.id) {
          summary.details.push({
            row: rowNumber,
            name: row.name,
            status: "error",
            message: insertError?.message ?? "No se pudo crear.",
          });
          continue;
        }

        summary.details.push({
          row: rowNumber,
          name: row.name,
          status: "created",
          productId: created.id,
        });
        summary.created += 1;
      }
    } catch (error) {
      summary.details.push({
        row: rowNumber,
        name: row.name,
        status: "error",
        message: error instanceof Error ? error.message : "Error desconocido en la fila.",
      });
    }
  }

  return { success: true, summary };
}

const deliveryRuleSchema = z.object({
  id: z.string().uuid().optional(),
  cutoffWeekday: z.number().int().min(0).max(6),
  cutoffTime: z.string().trim().min(4),
  deliveryWeekday: z.number().int().min(0).max(6),
});

const deliveryAvailableSchema = z.object({
  zoneId: z.string().uuid(),
  cutoffTime: z.string().trim().min(4),
  deliveryWeekdays: z.array(z.number().int().min(0).max(6)).min(1),
});

const saveRulesSchema = z.object({
  providerSlug: z.string().min(2),
  mode: z.enum(["windows", "available_days"]).default("windows"),
  rules: z.array(deliveryRuleSchema).min(0),
  availableRules: z.array(deliveryAvailableSchema).min(0).default([]),
});

function normalizeRuleInputs(rules: DeliveryRuleInput[]): { rules: DeliveryRule[]; errors: string[] } {
  const errors: string[] = [];
  const normalized: DeliveryRule[] = [];
  const seen = new Set<string>();

  rules.forEach((rule, index) => {
    const cutoffMinutes = timeStringToMinutes(rule.cutoffTime);
    if (cutoffMinutes === null) {
      errors.push(`Hora inválida en la fila ${index + 1}. Usa formato HH:MM.`);
      return;
    }
    const key = `${rule.cutoffWeekday}-${cutoffMinutes}`;
    if (seen.has(key)) {
      errors.push("No puedes repetir un corte con el mismo día y hora.");
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

  const sorted = sortRules(normalized);
  const hasEmptyWindow = sorted.some((entry) => entry.windowEndMinute - entry.windowStartMinute <= 0);
  if (hasEmptyWindow) {
    errors.push("Revisa los cortes: hay ventanas de tiempo sin asignar.");
  }

  return { rules: normalized, errors };
}

function normalizeAvailableInputs(
  entries: { zoneId: string; cutoffTime: string; deliveryWeekdays: number[] }[],
): { rules: DeliveryAvailableRow[]; errors: string[] } {
  const errors: string[] = [];
  const normalized: DeliveryAvailableRow[] = [];

  entries.forEach((entry, index) => {
    const cutoffMinutes = timeStringToMinutes(entry.cutoffTime);
    if (cutoffMinutes === null) {
      errors.push(`Hora inválida en la fila ${index + 1}. Usa formato HH:MM.`);
      return;
    }
    const uniqueDays = Array.from(new Set(entry.deliveryWeekdays.filter((day) => day >= 0 && day <= 6))).sort();
    if (!uniqueDays.length) {
      errors.push(`Selecciona al menos un día en la fila ${index + 1}.`);
      return;
    }
    normalized.push({
      zoneId: entry.zoneId,
      cutoffTimeMinutes: cutoffMinutes,
      deliveryWeekdays: uniqueDays,
    });
  });

  return { rules: normalized, errors };
}

export async function listDeliveryRules(providerSlug: string): Promise<ListDeliveryRulesResult> {
  const demoRules: DeliveryRuleRow[] = [
    {
      id: "demo-1",
      cutoffWeekday: 2,
      cutoffTimeMinutes: 20 * 60,
      deliveryWeekday: 5,
      deliveryTimeMinutes: 10 * 60,
    },
    {
      id: "demo-2",
      cutoffWeekday: 6,
      cutoffTimeMinutes: 20 * 60,
      deliveryWeekday: 2,
      deliveryTimeMinutes: 10 * 60,
    },
  ];

  if (providerSlug === "demo") {
    return { success: true, rules: demoRules, mode: "windows", availableRules: [] };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };
  }

  const { provider, error: providerError } = await getProviderBySlug(providerSlug);
  if (providerError || !provider) {
    return { success: false, errors: [providerError ?? "Proveedor no encontrado."] };
  }

  const [{ data, error }, { data: settings }, { data: available, error: availableError }] = await Promise.all([
    supabase
      .from("delivery_windows")
      .select("id, cutoff_weekday, cutoff_time_minutes, delivery_weekday, delivery_time_minutes")
      .eq("provider_id", provider.id)
      .order("cutoff_weekday", { ascending: true })
      .order("cutoff_time_minutes", { ascending: true }),
    supabase
      .from("provider_delivery_settings")
      .select("mode")
      .eq("provider_id", provider.id)
      .maybeSingle(),
    supabase
      .from("delivery_zone_available_days")
      .select("zone_id, delivery_weekday, cutoff_time_minutes")
      .eq("provider_id", provider.id)
      .order("zone_id")
      .order("delivery_weekday"),
  ]);

  if (error) {
    return { success: false, errors: [`No se pudieron cargar las reglas: ${error.message}`] };
  }
  if (availableError) {
    return { success: false, errors: [`No se pudieron cargar las reglas por días: ${availableError.message}`] };
  }

  const rules =
    data?.map((row) => ({
      id: row.id,
      cutoffWeekday: row.cutoff_weekday ?? 0,
      cutoffTimeMinutes: row.cutoff_time_minutes ?? 0,
      deliveryWeekday: row.delivery_weekday ?? 0,
      deliveryTimeMinutes: row.delivery_time_minutes ?? 10 * 60,
    })) ?? [];

  const availableRules: DeliveryAvailableRow[] = [];
  const grouped = new Map<string, { cutoff: number; days: number[] }>();
  (available ?? []).forEach((row) => {
    const cutoff = row.cutoff_time_minutes ?? 0;
    const entry = grouped.get(row.zone_id) ?? { cutoff, days: [] };
    entry.cutoff = cutoff;
    entry.days.push(row.delivery_weekday ?? 0);
    grouped.set(row.zone_id, entry);
  });
  grouped.forEach((value, zoneId) => {
    availableRules.push({
      zoneId,
      cutoffTimeMinutes: value.cutoff,
      deliveryWeekdays: Array.from(new Set(value.days)).sort(),
    });
  });

  const mode: "windows" | "available_days" = settings?.mode === "available_days" ? "available_days" : "windows";

  return {
    success: true,
    rules: rules.length ? rules : demoRules.map((rule) => ({ ...rule, id: randomUUID() })),
    mode,
    availableRules,
  };
}

export async function saveDeliveryRules(payload: {
  providerSlug: string;
  mode: "windows" | "available_days";
  rules: DeliveryRuleInput[];
  availableRules: { zoneId: string; cutoffTime: string; deliveryWeekdays: number[] }[];
}): Promise<SaveDeliveryRulesResult> {
  if (payload.providerSlug === "demo") {
    return {
      success: true,
      message: "Modo demo: no se guardan cambios, pero la lógica queda configurada.",
    };
  }

  const parsed = saveRulesSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== parsed.data.providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const normalized = normalizeRuleInputs(parsed.data.rules);
  const normalizedAvailable = normalizeAvailableInputs(parsed.data.availableRules);
  const errors = [...normalized.errors, ...normalizedAvailable.errors];
  if (errors.length) {
    return { success: false, errors };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };
  }

  const { provider, error: providerError } = await getProviderBySlug(parsed.data.providerSlug);
  if (providerError || !provider) {
    return { success: false, errors: [providerError ?? "Proveedor no encontrado."] };
  }

  const { data: zonesData, error: zonesError } = await supabase
    .from("delivery_zones")
    .select("id, is_active")
    .eq("provider_id", provider.id);

  if (zonesError) {
    return { success: false, errors: [`No se pudieron validar las zonas: ${zonesError.message}`] };
  }

  const activeZones = (zonesData ?? []).filter((z) => z.is_active !== false);

  if (parsed.data.mode === "available_days") {
    if (!activeZones.length) {
      return { success: false, errors: ["Carga al menos una zona de entrega para usar este modo."] };
    }
    const missingZones = activeZones.filter(
      (zone) => !normalizedAvailable.rules.find((rule) => rule.zoneId === zone.id && rule.deliveryWeekdays.length),
    );
    if (missingZones.length) {
      return { success: false, errors: ["Configura días para todas las zonas activas antes de guardar."] };
    }
  } else if (!normalized.rules.length) {
    return { success: false, errors: ["Agrega al menos una regla de entrega."] };
  }

  const upsertSettings = await supabase
    .from("provider_delivery_settings")
    .upsert({ provider_id: provider.id, mode: parsed.data.mode, updated_at: new Date().toISOString() }, { onConflict: "provider_id" });
  if (upsertSettings.error) {
    return { success: false, errors: [`No se pudo actualizar el modo de entrega: ${upsertSettings.error.message}`] };
  }

  if (parsed.data.mode === "available_days") {
    await supabase.from("delivery_zone_available_days").delete().eq("provider_id", provider.id);
    await supabase.from("delivery_windows").delete().eq("provider_id", provider.id);
    const records = normalizedAvailable.rules.flatMap((entry) =>
      entry.deliveryWeekdays.map((day) => ({
        id: randomUUID(),
        provider_id: provider.id,
        zone_id: entry.zoneId,
        delivery_weekday: day,
        cutoff_time_minutes: entry.cutoffTimeMinutes,
      })),
    );
    const { error: insertAvailableError } = await supabase.from("delivery_zone_available_days").insert(records);
    if (insertAvailableError) {
      return { success: false, errors: [`No se pudieron guardar los días disponibles: ${insertAvailableError.message}`] };
    }
    return { success: true, message: "Reglas de entrega por días actualizadas." };
  }

  // modo windows
  const { error: deleteError } = await supabase.from("delivery_windows").delete().eq("provider_id", provider.id);
  if (deleteError) {
    return { success: false, errors: [`No se pudieron limpiar las reglas previas: ${deleteError.message}`] };
  }

  const rows = normalized.rules.map((rule) => ({
    id: rule.id ?? randomUUID(),
    provider_id: provider.id,
    cutoff_weekday: rule.cutoffWeekday,
    cutoff_time_minutes: rule.cutoffTimeMinutes,
    delivery_weekday: rule.deliveryWeekday,
    delivery_time_minutes: rule.deliveryTimeMinutes ?? 10 * 60,
  }));

  const { error: insertError } = await supabase.from("delivery_windows").insert(rows);
  if (insertError) {
    return { success: false, errors: [`No se pudieron guardar las reglas: ${insertError.message}`] };
  }

  await supabase.from("delivery_zone_available_days").delete().eq("provider_id", provider.id);

  return { success: true, message: "Reglas de entrega actualizadas." };
}

export async function listDeliveryZones(providerSlug: string): Promise<{ success: boolean; zones: DeliveryZone[]; errors?: string[] }> {
  const demoZones: DeliveryZone[] = [
    { id: "demo-zone-1", name: "CABA", price: 1200, isActive: true },
    { id: "demo-zone-2", name: "GBA Norte", price: 1800, isActive: true },
    { id: "demo-zone-3", name: "GBA Oeste", price: 2100, isActive: true },
  ];

  if (providerSlug === "demo") return { success: true, zones: demoZones };

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, zones: [], errors: [scopeResult.error] };

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== providerSlug) {
    return { success: false, zones: [], errors: ["No tienes acceso a este proveedor."] };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, zones: [], errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { provider, error: providerError } = await getProviderBySlug(providerSlug);
  if (providerError || !provider) return { success: false, zones: [], errors: [providerError ?? "Proveedor no encontrado."] };

  const { data, error } = await supabase
    .from("delivery_zones")
    .select("id, name, price, is_active")
    .eq("provider_id", provider.id)
    .order("name", { ascending: true });

  if (error) return { success: false, zones: [], errors: [`No se pudieron cargar los costos: ${error.message}`] };

  const zones =
    data?.map((row) => ({
      id: row.id,
      name: row.name ?? "Zona",
      price: Number(row.price ?? 0),
      isActive: row.is_active ?? true,
    })) ?? [];

  return { success: true, zones };
}

export async function createDeliveryZone(payload: z.infer<typeof deliveryZoneSchema>): Promise<{ success: boolean; message?: string; errors?: string[]; zone?: DeliveryZone }> {
  if (payload.providerSlug === "demo") {
    const zone: DeliveryZone = {
      id: randomUUID(),
      name: payload.name,
      price: payload.price,
      isActive: true,
    };
    return { success: true, message: "Modo demo: no se guarda en base, pero se simula el alta.", zone };
  }

  const parsed = deliveryZoneSchema.safeParse(payload);
  if (!parsed.success) return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };
  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== parsed.data.providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { provider, error: providerError } = await getProviderBySlug(parsed.data.providerSlug);
  if (providerError || !provider) return { success: false, errors: [providerError ?? "Proveedor no encontrado."] };

  const { data, error } = await supabase
    .from("delivery_zones")
    .insert({
      provider_id: provider.id,
      name: parsed.data.name,
      price: parsed.data.price,
      is_active: true,
    })
    .select("id, name, price, is_active")
    .single();

  if (error || !data) return { success: false, errors: [`No se pudo guardar el costo: ${error?.message ?? "sin detalle"}`] };

  return {
    success: true,
    message: "Costo de envío guardado.",
    zone: {
      id: data.id,
      name: data.name ?? "Zona",
      price: Number(data.price ?? 0),
      isActive: data.is_active ?? true,
    },
  };
}

export async function deleteDeliveryZone(providerSlug: string, zoneId: string): Promise<{ success: boolean; errors?: string[] }> {
  if (providerSlug === "demo") return { success: true };

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };
  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { provider, error: providerError } = await getProviderBySlug(providerSlug);
  if (providerError || !provider) return { success: false, errors: [providerError ?? "Proveedor no encontrado."] };

  const { error } = await supabase
    .from("delivery_zones")
    .delete()
    .eq("provider_id", provider.id)
    .eq("id", zoneId);

  if (error) return { success: false, errors: [`No se pudo eliminar: ${error.message}`] };

  return { success: true };
}
