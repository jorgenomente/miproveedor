"use server";

import { z } from "zod";
import { getDemoData } from "@/lib/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getProviderScope } from "@/lib/provider-scope";

const createSchema = z.object({
  providerSlug: z.string().min(2, "El proveedor es requerido."),
  name: z.string().min(2, "Nombre requerido."),
  slug: z
    .string()
    .min(2, "Slug requerido.")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones."),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  address: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid("ID inválido."),
  providerSlug: z.string().min(2, "El proveedor es requerido."),
  name: z.string().min(2, "Nombre requerido.").optional(),
  slug: z
    .string()
    .min(2, "Slug requerido.")
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones.")
    .optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  address: z.string().optional(),
});

export type ProviderRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean | null;
};

export type ClientRow = {
  id: string;
  name: string;
  slug: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  created_at: string | null;
};

export type CreateClientResult =
  | {
      success: true;
      message: string;
      client: { id: string; slug: string; providerSlug: string };
    }
  | { success: false; errors: string[] };

export type UpdateClientResult =
  | { success: true; message: string; client: { id: string; slug: string; providerSlug: string } }
  | { success: false; errors: string[] };

export type ListClientsResult =
  | { success: true; clients: ClientRow[]; provider: ProviderRow | null }
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
    return {
      success: false,
      errors: [`No se pudieron cargar proveedores: ${error.message}`],
    };
  }

  const providers = data ?? [];
  const merged =
    providers.some((provider) => provider.slug === demoProvider.slug)
      ? providers
      : [demoProvider, ...providers];

  return { success: true, providers: merged };
}

export async function listClients(providerSlug: string): Promise<ListClientsResult> {
  if (providerSlug === "demo") {
    const demo = getDemoData();
    return {
      success: true,
      clients: demo.clients.map((client, index) => ({
        ...client,
        contact_name: client.contact_name ?? null,
        contact_phone: client.contact_phone ?? null,
        contact_email: client.contact_email ?? null,
        address: client.address ?? null,
        created_at: new Date(Date.now() - (index + 1) * 30 * 60 * 1000).toISOString(),
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
    return {
      success: false,
      errors: ["No tienes acceso a este proveedor."],
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."],
    };
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, name, slug, is_active")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError) {
    return {
      success: false,
      errors: [`No se pudo obtener el proveedor: ${providerError.message}`],
    };
  }

  if (!provider) {
    return {
      success: false,
      errors: ["Proveedor no encontrado."],
    };
  }

  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, name, slug, contact_name, contact_phone, contact_email, address, created_at",
    )
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      success: false,
      errors: [`No se pudieron cargar las tiendas: ${error.message}`],
    };
  }

  return {
    success: true,
    clients: data ?? [],
    provider,
  };
}

export async function createClient(
  payload: z.infer<typeof createSchema>,
): Promise<CreateClientResult> {
  if (payload.providerSlug === "demo") {
    const demo = getDemoData();
    return {
      success: true,
      message: "Modo demo: la tienda no se guarda, pero puedes explorar el flujo.",
      client: { id: "demo-client", slug: payload.slug, providerSlug: demo.provider.slug },
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
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

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug, is_active")
    .eq("slug", parsed.data.providerSlug)
    .maybeSingle();

  if (providerError) {
    return {
      success: false,
      errors: [`No se pudo obtener el proveedor: ${providerError.message}`],
    };
  }

  if (!provider) {
    return { success: false, errors: ["Proveedor no encontrado."] };
  }

  if (provider.is_active === false) {
    return { success: false, errors: ["El proveedor está inactivo."] };
  }

  const { data: existing, error: slugError } = await supabase
    .from("clients")
    .select("id")
    .eq("provider_id", provider.id)
    .eq("slug", parsed.data.slug)
    .maybeSingle();

  if (slugError) {
    return {
      success: false,
      errors: [`Error verificando slug: ${slugError.message}`],
    };
  }

  if (existing?.id) {
    return { success: false, errors: ["Ya existe una tienda con ese slug."] };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      provider_id: provider.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      contact_name: parsed.data.contactName ?? null,
      contact_phone: parsed.data.contactPhone ?? null,
      contact_email: parsed.data.contactEmail ?? null,
      address: parsed.data.address ?? null,
    })
    .select("id, slug")
    .single();

  if (error || !data?.id) {
    return {
      success: false,
      errors: [`No se pudo crear la tienda: ${error?.message ?? "sin detalle"}`],
    };
  }

  return {
    success: true,
    message: "Tienda creada correctamente.",
    client: { id: data.id, slug: data.slug, providerSlug: provider.slug },
  };
}

export async function updateClient(payload: z.infer<typeof updateSchema>): Promise<UpdateClientResult> {
  if (payload.providerSlug === "demo") {
    const demo = getDemoData();
    return {
      success: true,
      message: "Modo demo: los cambios no se persisten, pero puedes visualizar el flujo.",
      client: { id: payload.id, slug: payload.slug ?? "demo-client", providerSlug: demo.provider.slug },
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  const normalizedSlug = parsed.data.slug?.trim().toLowerCase();

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", parsed.data.providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return {
      success: false,
      errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`],
    };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, provider_id, slug")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (clientError || !client) {
    return { success: false, errors: [`Tienda no encontrada: ${clientError?.message ?? "sin detalle"}`] };
  }

  if (client.provider_id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a esta tienda."] };
  }

  if (normalizedSlug && normalizedSlug !== client.slug) {
    const { data: existing, error: slugError } = await supabase
      .from("clients")
      .select("id")
      .eq("provider_id", provider.id)
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (slugError) {
      return { success: false, errors: [`Error verificando slug: ${slugError.message}`] };
    }

    if (existing?.id && existing.id !== client.id) {
      return { success: false, errors: ["Ya existe una tienda con ese slug."] };
    }
  }

  const updates: Record<string, unknown> = {};
  if (typeof parsed.data.name === "string") updates.name = parsed.data.name;
  if (typeof parsed.data.slug === "string") updates.slug = normalizedSlug ?? parsed.data.slug;
  if ("contactName" in parsed.data) updates.contact_name = parsed.data.contactName ?? null;
  if ("contactPhone" in parsed.data) updates.contact_phone = parsed.data.contactPhone ?? null;
  if ("contactEmail" in parsed.data) updates.contact_email = parsed.data.contactEmail ?? null;
  if ("address" in parsed.data) updates.address = parsed.data.address ?? null;

  if (Object.keys(updates).length === 0) {
    return { success: true, message: "Sin cambios para guardar.", client: { id: client.id, slug: client.slug, providerSlug: provider.slug } };
  }

  const { error } = await supabase.from("clients").update(updates).eq("id", client.id);

  if (error) {
    return { success: false, errors: [`No se pudo actualizar la tienda: ${error.message}`] };
  }

  return {
    success: true,
    message: "Tienda actualizada.",
    client: { id: client.id, slug: (updates.slug as string) ?? client.slug, providerSlug: provider.slug },
  };
}
