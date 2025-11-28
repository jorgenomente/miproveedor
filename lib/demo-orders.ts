import { z } from "zod";
import { getSupabaseAdmin } from "./supabase-admin";

const RETENTION_HOURS = 24;

const demoOrderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  unit: z.string().nullable().optional(),
  quantity: z.number().int().nonnegative(),
  unitPrice: z.number(),
});

const demoDeliveredItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().nonnegative(),
});

const demoOrderSchema = z.object({
  providerSlug: z.string().min(2),
  clientSlug: z.string().min(2),
  status: z.enum(["nuevo", "preparando", "enviado", "entregado", "cancelado"]).default("nuevo"),
  isArchived: z.boolean().default(false),
  contactName: z.string().min(1),
  contactPhone: z.string().min(1),
  deliveryMethod: z.string().nullable().optional(),
  deliveryZoneName: z.string().nullable().optional(),
  shippingCost: z.number().nonnegative().optional(),
  paymentMethod: z.enum(["efectivo", "transferencia"]),
  paymentProofStatus: z.enum(["no_aplica", "pendiente", "subido"]).default("pendiente"),
  paymentProofUrl: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  total: z.number(),
  deliveryDate: z.string().nullable().optional(),
  deliveryRuleId: z.string().nullable().optional(),
  cutoffDate: z.string().nullable().optional(),
  receiptGeneratedAt: z.string().nullable().optional(),
  deliveredItems: z.array(demoDeliveredItemSchema).optional(),
  items: z.array(demoOrderItemSchema),
});

export type DemoOrderItem = z.infer<typeof demoOrderItemSchema> & { subtotal?: number };
export type DemoOrderRecord = {
  id: string;
  provider_slug: string;
  client_slug: string;
  status: "nuevo" | "preparando" | "enviado" | "entregado" | "cancelado";
  is_archived?: boolean | null;
  contact_name: string | null;
  contact_phone: string | null;
  delivery_method: string | null;
  payment_method: "efectivo" | "transferencia" | null;
  payment_proof_status: "no_aplica" | "pendiente" | "subido" | null;
  payment_proof_url: string | null;
  note: string | null;
  total: number;
  delivery_zone_name?: string | null;
  shipping_cost?: number | null;
  delivery_date?: string | null;
  delivery_rule_id?: string | null;
  cutoff_date?: string | null;
  receipt_generated_at?: string | null;
  created_at: string;
  archived_at?: string | null;
  delivered_items?: { productId: string; quantity: number }[] | null;
  items: DemoOrderItem[];
};

const mapRecord = (row: any): DemoOrderRecord | null => {
  if (!row?.id) return null;
  const parsedItems = Array.isArray(row.items) ? row.items : [];
  return {
    id: row.id,
    provider_slug: row.provider_slug,
    client_slug: row.client_slug,
    status: (row.status as DemoOrderRecord["status"]) ?? "nuevo",
    contact_name: row.contact_name ?? null,
    contact_phone: row.contact_phone ?? null,
    is_archived: row.is_archived ?? false,
    archived_at: row.archived_at ?? null,
    delivery_method: row.delivery_method ?? null,
    payment_method: row.payment_method ?? null,
    payment_proof_status: row.payment_proof_status ?? null,
    payment_proof_url: row.payment_proof_url ?? null,
    note: row.note ?? null,
    total: Number(row.total ?? 0),
    delivery_zone_name: row.delivery_zone_name ?? null,
    shipping_cost: Number(row.shipping_cost ?? 0),
    delivery_date: row.delivery_date ?? null,
    delivery_rule_id: row.delivery_rule_id ?? null,
    cutoff_date: row.cutoff_date ?? null,
    receipt_generated_at: row.receipt_generated_at ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    items: parsedItems.map((item: any) => ({
      productId: item.productId ?? "",
      name: item.name ?? "Producto",
      unit: item.unit ?? null,
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      subtotal: Number(item.subtotal ?? Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0)),
    })),
    delivered_items: Array.isArray(row.delivered_items)
      ? row.delivered_items.map((item: any) => ({
          productId: item.productId ?? item.product_id ?? "",
          quantity: Number(item.quantity ?? 0),
        }))
      : null,
  };
};

export async function persistDemoOrder(input: z.infer<typeof demoOrderSchema>) {
  const parsed = demoOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { id: `demo-order-${Date.now()}`, createdAt: new Date().toISOString() };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { id: `demo-order-${Date.now()}`, createdAt: new Date().toISOString() };
  }

  const cutoffDate = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000).toISOString();

  await supabase.from("demo_orders").delete().lt("created_at", cutoffDate);

  const { data, error } = await supabase
    .from("demo_orders")
    .insert({
      provider_slug: parsed.data.providerSlug,
      client_slug: parsed.data.clientSlug,
      status: parsed.data.status,
      is_archived: parsed.data.isArchived ?? false,
      contact_name: parsed.data.contactName,
      contact_phone: parsed.data.contactPhone,
      delivery_method: parsed.data.deliveryMethod ?? null,
      payment_method: parsed.data.paymentMethod,
      payment_proof_status: parsed.data.paymentProofStatus,
      payment_proof_url: parsed.data.paymentProofUrl ?? null,
      note: parsed.data.note ?? null,
      total: parsed.data.total,
      delivery_zone_name: parsed.data.deliveryZoneName ?? null,
      shipping_cost: parsed.data.shippingCost ?? 0,
      delivery_date: parsed.data.deliveryDate ?? null,
      delivery_rule_id: parsed.data.deliveryRuleId ?? null,
      cutoff_date: parsed.data.cutoffDate ?? null,
      receipt_generated_at: parsed.data.receiptGeneratedAt ?? null,
      delivered_items: parsed.data.deliveredItems
        ? parsed.data.deliveredItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        : null,
      items: parsed.data.items.map((item) => ({
        ...item,
        subtotal: item.unitPrice * item.quantity,
      })),
    })
    .select("id, created_at")
    .maybeSingle();

  if (error || !data?.id) {
    return { id: `demo-order-${Date.now()}`, createdAt: new Date().toISOString() };
  }

  return { id: data.id, createdAt: data.created_at ?? new Date().toISOString() };
}

export async function fetchRecentDemoOrders(options?: { providerSlug?: string; clientSlug?: string; includeArchived?: boolean }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const cutoffDate = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000).toISOString();
  let query = supabase.from("demo_orders").select("*").gt("created_at", cutoffDate).order("created_at", {
    ascending: false,
  });

  if (options?.providerSlug) {
    query = query.eq("provider_slug", options.providerSlug);
  }
  if (options?.clientSlug) {
    query = query.eq("client_slug", options.clientSlug);
  }
  if (!options?.includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map(mapRecord).filter(Boolean) as DemoOrderRecord[];
}

export async function fetchDemoOrderById(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.from("demo_orders").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;

  return mapRecord(data);
}
