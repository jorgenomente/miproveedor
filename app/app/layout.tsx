import { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";
import { AppShell } from "@/components/app/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const scope = await requireAuth({ next: "/app" });
  const providerSlug = scope.role === "provider" ? scope.provider.slug : undefined;

  return <AppShell providerSlug={providerSlug}>{children}</AppShell>;
}
