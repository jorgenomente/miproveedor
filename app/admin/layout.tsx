import { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAuth({ next: "/admin/providers", mustBeAdmin: true });
  return <>{children}</>;
}
