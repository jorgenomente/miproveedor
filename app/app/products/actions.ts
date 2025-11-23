"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import * as XLSX from "xlsx";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDemoData } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getProviderScope } from "@/lib/provider-scope";

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
      products: demo.products.map((product) => ({
        ...product,
        brand: (product as ProductRow).brand ?? null,
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
      })),
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
        (product as ProductRow).brand ?? "",
        product.price,
        product.discount_percent ?? 0,
        product.unit ?? "",
        product.category ?? "",
        product.description ?? "",
        (product.tags ?? []).join(", "),
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
