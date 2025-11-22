"use server";

import { z } from "zod";
import { getDemoData } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getProviderScope } from "@/lib/provider-scope";

const createSchema = z.object({
  providerSlug: z.string().min(2),
  name: z.string().min(2),
  price: z.number().positive(),
  unit: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

const activeSchema = z.object({
  providerSlug: z.string().min(2),
  productId: z.string().uuid(),
  isActive: z.boolean(),
});

export type ProductRow = {
  id: string;
  name: string;
  price: number;
  unit: string | null;
  is_active: boolean | null;
  category: string | null;
  description: string | null;
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
    .select("id, name, price, unit, is_active, category, description, created_at")
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
    products: (data ?? []).map((item) => ({ ...item, price: Number(item.price ?? 0) })),
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

  const { data, error: insertError } = await supabase
    .from("products")
    .insert({
      provider_id: provider.id,
      name: parsed.data.name,
      price: parsed.data.price,
      unit: parsed.data.unit ?? null,
      description: parsed.data.description ?? null,
      category: parsed.data.category ?? null,
      is_active: true,
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
