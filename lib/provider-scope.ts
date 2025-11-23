import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "./supabase-admin";

export type ProviderScope =
  | { role: "admin" }
  | {
      role: "provider";
      provider: { id: string; name: string; slug: string; is_active: boolean | null };
    };

async function resolveDevFallbackScope() {
  const allowBypass = process.env.ALLOW_DEV_AUTH_BYPASS === "true";

  if (!allowBypass) return null;

  // Prefer admin scope by default to permitir navegar todos los proveedores en dev.
  const desiredProviderSlug = process.env.DEV_PROVIDER_SLUG;
  if (!desiredProviderSlug) return { role: "admin" } satisfies ProviderScope;

  const adminClient = getSupabaseAdmin();
  if (!adminClient) return { role: "admin" } satisfies ProviderScope;

  const { data: provider } = await adminClient
    .from("providers")
    .select("id, name, slug, is_active")
    .eq("slug", desiredProviderSlug)
    .maybeSingle();

  if (!provider?.id) return { role: "admin" } satisfies ProviderScope;

  return {
    role: "provider",
    provider: {
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      is_active: provider.is_active ?? null,
    },
  } satisfies ProviderScope;
}

export async function getProviderScope(): Promise<{ scope?: ProviderScope; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { error: "Faltan credenciales públicas de Supabase." };
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const fallbackScope = await resolveDevFallbackScope();
    if (fallbackScope) {
      return { scope: fallbackScope };
    }
    return { error: "Sesión no encontrada. Vuelve a iniciar sesión." };
  }

  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return { error: "Faltan credenciales de Supabase (SERVICE_ROLE / URL)." };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("users")
    .select("role, provider:providers(id, name, slug, is_active)")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: `No se pudo resolver el proveedor: ${profileError.message}` };
  }

  if (!profile) {
    return { error: "Usuario no encontrado en la tabla users." };
  }

  if (profile.role === "admin") {
    return { scope: { role: "admin" } };
  }

  const rawProvider =
    Array.isArray(profile.provider) && profile.provider.length > 0
      ? profile.provider[0]
      : profile.provider;

  const provider =
    rawProvider && typeof rawProvider === "object" && "id" in rawProvider
      ? (rawProvider as { id: string; name: string; slug: string; is_active: boolean | null })
      : null;

  if (!provider?.id) {
    return { error: "El usuario no tiene un proveedor asignado." };
  }

  return {
    scope: {
      role: "provider",
      provider: {
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        is_active: provider.is_active ?? null,
      },
    },
  };
}
