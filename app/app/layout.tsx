import { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";
import { AppShell } from "@/components/app/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireAuth({ next: "/app" });
  return <AppShell>{children}</AppShell>;
}
