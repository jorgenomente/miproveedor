import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
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

  const extractAccessToken = () => {
    const match = url.match(/https?:\/\/([^./]+)\.supabase\.(co|in)/i);
    const projectRef = match?.[1];
    if (!projectRef) return null;
    const cookieName = `sb-${projectRef}-auth-token`;
    const raw = cookieStore.get(cookieName)?.value;
    if (!raw) return null;
    try {
      const decoded = decodeURIComponent(raw);
      const parsed = JSON.parse(decoded);
      return (
        parsed?.currentSession?.access_token ??
        parsed?.access_token ??
        parsed?.accessToken ??
        null
      );
    } catch {
      return null;
    }
  };

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Next.js solo permite mutar cookies en Server Actions o Route Handlers.
          console.warn("No se pudo setear la cookie en este contexto", error);
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch (error) {
          console.warn("No se pudo eliminar la cookie en este contexto", error);
        }
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  let resolvedUser = user;

  if ((userError || !user) && !resolvedUser) {
    const accessToken = extractAccessToken();
    if (accessToken) {
      const fallbackClient = createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: tokenData } = await fallbackClient.auth.getUser(accessToken);
      resolvedUser = tokenData?.user ?? null;
    }
  }

  if (userError || !resolvedUser) {
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
    .eq("id", resolvedUser.id)
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
