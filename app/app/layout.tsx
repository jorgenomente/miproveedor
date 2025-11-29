import { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";
import { AppShell } from "@/components/app/app-shell";
import { getAdminSelectedProviderSlug } from "./actions/admin-provider";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const scope = await requireAuth({ next: "/app" });
  const adminStoredSlug = scope.role === "admin" ? await getAdminSelectedProviderSlug() : undefined;
  const providerSlug = scope.role === "provider" ? scope.provider.slug : adminStoredSlug ?? undefined;

  return <AppShell providerSlug={providerSlug} role={scope.role}>{children}</AppShell>;
}
