import { ReactNode } from "react";
import { requireAuth } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

export default async function ProviderLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: any;
}) {
  const slug = (await params)?.providerSlug ?? params?.providerSlug;
  await requireAuth({ next: `/app/${slug}`, providerSlug: slug });
  return <>{children}</>;
}
