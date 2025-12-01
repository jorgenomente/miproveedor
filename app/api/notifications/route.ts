"use server";

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_ITEMS = 6;

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const providerId = search.get("providerId");
  const providerSlug = search.get("providerSlug");

  if (!providerId && !providerSlug) {
    return NextResponse.json({ error: "Falta providerId o providerSlug." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Faltan credenciales de Supabase." }, { status: 500 });
  }

  let resolvedProviderId = providerId ?? undefined;

  if (!resolvedProviderId && providerSlug) {
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("slug", providerSlug)
      .maybeSingle();
    resolvedProviderId = provider?.id ?? undefined;
  }

  if (!resolvedProviderId) {
    return NextResponse.json({ error: "Proveedor no encontrado." }, { status: 404 });
  }

  const [{ data: recentOrders, error: ordersError }, { data: proofOrders, error: proofError }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, created_at, client:clients(name)")
      .eq("provider_id", resolvedProviderId)
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS),
    supabase
      .from("orders")
      .select("id, updated_at, created_at, payment_proof_status, client:clients(name)")
      .eq("provider_id", resolvedProviderId)
      .eq("payment_proof_status", "subido")
      .order("updated_at", { ascending: false })
      .limit(MAX_ITEMS),
  ]);

  if (ordersError || proofError) {
    return NextResponse.json(
      { error: ordersError?.message ?? proofError?.message ?? "No se pudieron cargar notificaciones." },
      { status: 500 },
    );
  }

  const items: { id: string; orderId?: string; type: "order" | "payment_proof"; createdAt?: string | null; clientName?: string | null }[] = [];

  (recentOrders ?? []).forEach((row) => {
    const id = row.id ?? `order-${row.created_at ?? ""}`;
    items.push({
      id: `order-${id}`,
      orderId: row.id,
      type: "order",
      createdAt: row.created_at ?? null,
      clientName: (row as { client?: { name?: string | null } }).client?.name ?? null,
    });
  });

  (proofOrders ?? []).forEach((row) => {
    const status = (row as { payment_proof_status?: string | null }).payment_proof_status;
    if (status !== "subido") return;
    const id = row.id ?? `proof-${row.updated_at ?? row.created_at ?? ""}`;
    items.push({
      id: `proof-${id}`,
      orderId: row.id,
      type: "payment_proof",
      createdAt: row.updated_at ?? row.created_at ?? null,
      clientName: (row as { client?: { name?: string | null } }).client?.name ?? null,
    });
  });

  const deduped: typeof items = [];
  const seen = new Set<string>();

  items
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .forEach((item) => {
      if (seen.has(item.id)) return;
      seen.add(item.id);
      deduped.push(item);
    });

  return NextResponse.json({ events: deduped.slice(0, MAX_ITEMS) });
}
