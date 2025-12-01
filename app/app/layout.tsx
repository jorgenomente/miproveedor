import { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";
import { AppShell } from "@/components/app/app-shell";
import { getAdminSelectedProviderSlug } from "./actions/admin-provider";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const scope = await requireAuth({ next: "/app" });
  const adminStoredSlug = scope.role === "admin" ? await getAdminSelectedProviderSlug() : undefined;
  const providerSlug = scope.role === "provider" ? scope.provider.slug : adminStoredSlug ?? undefined;
  let providerId: string | undefined = scope.role === "provider" ? scope.provider.id : undefined;

  if (!providerId && providerSlug && scope.role === "admin") {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data } = await supabase.from("providers").select("id").eq("slug", providerSlug).maybeSingle();
      providerId = data?.id ?? undefined;
    }
  }

  return <AppShell providerSlug={providerSlug} providerId={providerId} role={scope.role}>{children}</AppShell>;
}
