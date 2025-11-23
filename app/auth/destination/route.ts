import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return jsonError("Faltan credenciales públicas.", 500);

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

  if (userError || !user) return jsonError("Sin sesión.", 401);

  const adminClient = getSupabaseAdmin();
  if (!adminClient) return jsonError("Faltan credenciales de servicio.", 500);

  const { data: profile, error: profileError } = await adminClient
    .from("users")
    .select("role, provider:providers(slug)")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) return jsonError(profileError.message, 500);

  let destination = "/app";
  if (profile?.role === "admin") {
    destination = "/admin/providers";
  } else if (profile?.role === "provider") {
    const provider =
      Array.isArray(profile.provider) && profile.provider.length > 0
        ? profile.provider[0]
        : (profile.provider as { slug?: string } | null);
    if (provider?.slug) {
      destination = `/app/${provider.slug}`;
    }
  }

  return NextResponse.json({ destination });
}
