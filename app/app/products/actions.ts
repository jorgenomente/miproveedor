"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDemoData } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getProviderScope } from "@/lib/provider-scope";

const PRODUCT_IMAGES_BUCKET = "product-images";
const MAX_IMAGE_SIZE_BYTES = 950 * 1024; // mantener <1MB para el body y subir rápido
const imageDataUrlRegex = /^data:image\/(png|jpe?g|webp|avif);base64,/i;

const createSchema = z.object({
  providerSlug: z.string().min(2),
  name: z.string().min(2),
  price: z.number().positive(),
  discountPercent: z.number().min(0).max(100).optional().default(0),
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

export type ProductRow = {
  id: string;
  name: string;
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
      "id, name, price, unit, is_active, category, description, image_url, discount_percent, tags, is_new, is_out_of_stock, created_at",
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
