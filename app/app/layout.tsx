import { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireAuth({ next: "/app" });
  return <>{children}</>;
}
