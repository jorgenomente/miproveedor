import { createClient } from "@supabase/supabase-js";
import { getDemoData } from "@/lib/demo-data";
import { fetchRecentDemoOrders } from "@/lib/demo-orders";
import { type DeliveryRule } from "@/lib/delivery-windows";
import { ClientOrder, type Client, type PaymentSettings, type Product, type Provider, type PublicOrderHistory, type DeliveryZone, type DraftState } from "./client-order";

export const dynamic = "force-dynamic";

type LoadedData =
  | {
      provider: Provider;
      client: Client;
      products: Product[];
      paymentSettings: PaymentSettings;
      history: PublicOrderHistory[];
      deliveryRules: DeliveryRule[];
      deliveryZones: DeliveryZone[];
      drafts: DraftState[];
      error?: undefined;
    }
  | {
      provider?: undefined;
      client?: undefined;
      products?: undefined;
      paymentSettings?: undefined;
      history?: undefined;
      deliveryRules?: undefined;
      deliveryZones?: undefined;
      drafts?: undefined;
      error: string;
    };

async function fetchData(params: { providerSlug: string; clientSlug: string }): Promise<LoadedData> {
  if (params.providerSlug === "demo") {
    const demo = getDemoData();
    const provider: Provider = {
      id: demo.provider.id,
      name: demo.provider.name,
      slug: demo.provider.slug,
      contact_phone: demo.provider.contact_phone,
    };
    const client = demo.clients.find((item) => item.slug === params.clientSlug);
    if (!client) {
      return { error: "Tienda demo no encontrada." };
    }
    const demoDeliveryRules: DeliveryRule[] = [
      { id: "demo-rule-1", cutoffWeekday: 2, cutoffTimeMinutes: 20 * 60, deliveryWeekday: 5, deliveryTimeMinutes: 10 * 60 },
      { id: "demo-rule-2", cutoffWeekday: 6, cutoffTimeMinutes: 20 * 60, deliveryWeekday: 2, deliveryTimeMinutes: 10 * 60 },
    ];
    const demoDeliveryZones: DeliveryZone[] = [
      { id: "demo-zone-1", name: "CABA", price: 1200, isActive: true },
      { id: "demo-zone-2", name: "GBA", price: 1800, isActive: true },
    ];
    const paymentSettings: PaymentSettings = {
      cashEnabled: true,
      transferEnabled: true,
      transferNotes: "Envía tu comprobante por WhatsApp o súbelo al enviar el pedido.",
      transferProfiles: [
        {
          id: "demo-transfer-1",
          label: "Cuenta principal",
          alias: "ALIAS.DEMO",
          cbu: "0000000000000000000000",
          isActive: true,
        },
      ],
    };

    const storedOrders = await fetchRecentDemoOrders({
      providerSlug: demo.provider.slug,
      clientSlug: params.clientSlug,
    });
    const storedHistory: PublicOrderHistory[] = storedOrders.map((order) => ({
      id: order.id,
      status: order.status,
      paymentMethod: order.payment_method ?? "efectivo",
      paymentProofStatus: order.payment_proof_status ?? "no_aplica",
      total: order.total,
      createdAt: order.created_at,
      items: order.items.map((item) => ({
        productName: item.name,
        unit: item.unit ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal ?? item.unitPrice * item.quantity,
      })),
    }));

    const seededHistory: PublicOrderHistory[] = demo.orders
      .filter((order) => order.clientSlug === params.clientSlug)
      .map((order) => ({
        id: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod ?? "efectivo",
        paymentProofStatus: order.paymentProofStatus ?? "no_aplica",
        total: order.total,
        createdAt: order.createdAt,
        items:
          order.displayItems ??
          order.items.map((item) => {
            const product = demo.products.find((p) => p.id === item.productId);
            const unitPrice = (item as { unitPrice?: number }).unitPrice ?? Number(product?.price ?? 0);
            const unit = (item as { unit?: string | null }).unit ?? product?.unit ?? null;
            const name = (item as { name?: string }).name ?? product?.name ?? "Producto";
            return {
              productName: name,
              unit,
              quantity: item.quantity,
              unitPrice,
              subtotal: unitPrice * item.quantity,
            };
          }),
      }));

    const history = [...storedHistory, ...seededHistory].sort((a, b) => {
      const aDate = new Date(a.createdAt ?? "").getTime();
      const bDate = new Date(b.createdAt ?? "").getTime();
      return Number.isNaN(bDate) ? -1 : bDate - aDate;
    });

    return {
      provider,
      client: {
        id: client.id,
        name: client.name,
        slug: client.slug,
        contactName: client.contact_name ?? undefined,
        contactPhone: client.contact_phone ?? undefined,
        address: client.address ?? undefined,
      },
      deliveryRules: demoDeliveryRules,
      deliveryZones: demoDeliveryZones,
      drafts: [],
    products: demo.products.map((product) => {
      const basePrice = Number(product.price ?? 0);
      const discount = Number(product.discount_percent ?? 0);
      const finalPrice = Number((basePrice * (1 - Math.max(0, Math.min(100, discount)) / 100)).toFixed(2));
      return {
        id: product.id,
        name: product.name,
        brand: (product as { brand?: string | null }).brand ?? null,
        description: product.description,
        price: finalPrice,
        basePrice,
        discountPercent: discount,
        unit: product.unit,
          image_url: product.image_url ?? undefined,
          category: product.category ?? undefined,
          tags: product.tags ?? [],
          is_new: product.is_new ?? false,
          is_out_of_stock: product.is_out_of_stock ?? false,
        };
      }),
      paymentSettings,
      history,
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { error: "Faltan credenciales de Supabase en el servidor." };
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, name, slug, contact_phone, is_active, subscription_status")
    .eq("slug", params.providerSlug)
    .maybeSingle();

  if (
    providerError ||
    !provider ||
    provider.is_active === false ||
    (provider.subscription_status && provider.subscription_status !== "active")
  ) {
    return {
      error:
        providerError?.message ||
        "No se encontró el proveedor o está inactivo (suscripción pausada).",
    };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, slug, contact_name, contact_phone, address, is_active")
    .eq("provider_id", provider.id)
    .eq("slug", params.clientSlug)
    .maybeSingle();

  if (clientError || !client || client.is_active === false) {
    return {
      error: clientError?.message || "La tienda no existe o está inactiva.",
    };
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      "id, name, brand, description, price, unit, image_url, discount_percent, is_active, category, tags, is_new, is_out_of_stock",
    )
    .eq("provider_id", provider.id)
    .eq("is_active", true)
    .order("name");

  if (productsError) {
    return {
      error: `Error cargando productos: ${productsError.message}`,
    };
  }

  const [{ data: paymentSettingsRow, error: paymentSettingsError }, { data: transferProfiles, error: profilesError }] =
    await Promise.all([
      supabase
        .from("provider_payment_settings")
        .select("cash_enabled, transfer_enabled, transfer_notes")
        .eq("provider_id", provider.id)
        .maybeSingle(),
      supabase
        .from("provider_transfer_profiles")
        .select("id, label, alias, cbu, extra_info, is_active")
        .eq("provider_id", provider.id)
        .order("created_at", { ascending: true }),
    ]);

  if (paymentSettingsError) {
    return { error: `No pudimos cargar los métodos de pago: ${paymentSettingsError.message}` };
  }

  if (profilesError) {
    return { error: `No pudimos cargar las cuentas de transferencia: ${profilesError.message}` };
  }

  const paymentSettings: PaymentSettings = {
    cashEnabled: paymentSettingsRow?.cash_enabled ?? true,
    transferEnabled: paymentSettingsRow?.transfer_enabled ?? true,
    transferNotes: paymentSettingsRow?.transfer_notes ?? null,
    transferProfiles:
      transferProfiles?.map((profile) => ({
        id: profile.id,
        label: profile.label ?? null,
        alias: profile.alias ?? null,
        cbu: profile.cbu ?? null,
        extraInfo: profile.extra_info ?? null,
        isActive: profile.is_active ?? true,
      })) ?? [],
  };

  const { data: deliveryRows, error: deliveryError } = await supabase
    .from("delivery_windows")
    .select("id, cutoff_weekday, cutoff_time_minutes, delivery_weekday, delivery_time_minutes")
    .eq("provider_id", provider.id)
    .order("cutoff_weekday", { ascending: true })
    .order("cutoff_time_minutes", { ascending: true });

  if (deliveryError) {
    return { error: `No pudimos cargar las reglas de entrega: ${deliveryError.message}` };
  }

  const deliveryRules: DeliveryRule[] =
    deliveryRows?.map((row) => ({
      id: row.id,
      cutoffWeekday: row.cutoff_weekday ?? 0,
      cutoffTimeMinutes: row.cutoff_time_minutes ?? 0,
      deliveryWeekday: row.delivery_weekday ?? 0,
      deliveryTimeMinutes: row.delivery_time_minutes ?? 10 * 60,
    })) ?? [];

  const { data: deliveryZonesRows, error: deliveryZonesError } = await supabase
    .from("delivery_zones")
    .select("id, name, price, is_active")
    .eq("provider_id", provider.id)
    .order("name", { ascending: true });

  if (deliveryZonesError) {
    return { error: `No pudimos cargar los costos de envío: ${deliveryZonesError.message}` };
  }

  const deliveryZones: DeliveryZone[] =
    deliveryZonesRows?.filter((row) => row.is_active !== false).map((row) => ({
      id: row.id,
      name: row.name ?? "Zona",
      price: Number(row.price ?? 0),
      isActive: row.is_active ?? true,
    })) ?? [];

  const { data: draftRows, error: draftsError } = await supabase
    .from("client_order_drafts")
    .select("id, payload, created_at")
    .eq("provider_id", provider.id)
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const missingDraftTable =
    draftsError?.message?.toLowerCase().includes("could not find the table") &&
    draftsError.message.includes("client_order_drafts");

  if (draftsError && !missingDraftTable) {
    return { error: `No pudimos cargar los borradores: ${draftsError.message}` };
  }

  const drafts: DraftState[] =
    draftRows?.map((row) => ({
      id: row.id,
      label: new Date(row.created_at ?? "").toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }),
      createdAt: row.created_at ?? new Date().toISOString(),
      data: {
        quantities: ((row.payload as any)?.quantities ?? {}) as Record<string, number>,
        contactName: (row.payload as any)?.contactName ?? "",
        contactPhone: (row.payload as any)?.contactPhone ?? "",
        deliveryMethod: (row.payload as any)?.deliveryMethod ?? null,
        deliveryZoneId: (row.payload as any)?.deliveryZoneId ?? null,
        paymentMethod: (row.payload as any)?.paymentMethod ?? "",
        note: (row.payload as any)?.note ?? "",
      },
    })) ?? [];

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
        id,
        status,
        payment_method,
        payment_proof_status,
        payment_proof_url,
        delivery_date,
        delivery_rule_id,
        created_at,
        order_items(
          quantity,
          unit_price,
          product:products(name, unit)
        )
      `,
    )
    .eq("provider_id", provider.id)
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const history: PublicOrderHistory[] =
    orders?.map((order) => {
      const items =
        order.order_items?.map((item) => {
          const productEntry =
            Array.isArray(item.product) && item.product.length > 0 ? item.product[0] : (item as any).product;
          const unitPrice = Number(item.unit_price ?? 0);
          return {
            productName: productEntry?.name ?? "Producto",
            unit: productEntry?.unit ?? null,
            quantity: item.quantity,
            unitPrice,
            subtotal: unitPrice * item.quantity,
          };
        }) ?? [];

      const shippingCost = Number((order as { shipping_cost?: number | null }).shipping_cost ?? 0);
      const total = items.reduce((acc, item) => acc + item.subtotal, 0) + shippingCost;

      const rawPaymentMethod = (order as { payment_method?: string | null }).payment_method ?? null;
      const paymentMethod =
        rawPaymentMethod === "transferencia"
          ? "transferencia"
          : rawPaymentMethod === "efectivo"
            ? "efectivo"
            : null;
      const rawProofStatus = (order as { payment_proof_status?: string | null }).payment_proof_status ?? null;
      const paymentProofStatus =
        rawProofStatus === "pendiente"
          ? "pendiente"
          : rawProofStatus === "subido"
            ? "subido"
            : rawProofStatus === "no_aplica"
              ? "no_aplica"
              : null;

      return {
        id: order.id,
        status: order.status,
        paymentMethod,
        paymentProofStatus,
        paymentProofUrl: (order as { payment_proof_url?: string | null }).payment_proof_url ?? null,
        total,
        createdAt: order.created_at,
        deliveryDate: (order as { delivery_date?: string | null }).delivery_date ?? null,
        deliveryRuleId: (order as { delivery_rule_id?: string | null }).delivery_rule_id ?? null,
        items,
      };
    }) ?? [];

  return {
    provider,
    client: {
      id: client.id,
      name: client.name,
      slug: client.slug,
      contactName: client.contact_name ?? undefined,
      contactPhone: client.contact_phone ?? undefined,
      address: client.address ?? undefined,
    },
    products: (products ?? []).map((product) => {
      const basePrice = Number(product.price ?? 0);
      const discount = Number(product.discount_percent ?? 0);
      const finalPrice = Number((basePrice * (1 - Math.max(0, Math.min(100, discount)) / 100)).toFixed(2));
      return {
        id: product.id,
        name: product.name,
        brand: (product as { brand?: string | null }).brand ?? null,
        description: product.description,
        price: finalPrice,
        basePrice,
        discountPercent: discount,
        unit: product.unit,
        image_url: product.image_url ?? undefined,
        category: product.category ?? undefined,
        tags: Array.isArray(product.tags) ? product.tags : [],
        is_new: Boolean(product.is_new),
        is_out_of_stock: Boolean(product.is_out_of_stock),
      };
    }),
      paymentSettings,
      deliveryRules,
      deliveryZones,
      drafts,
      history,
    };
}

export default async function ClientOrderPage({
  params,
}: {
  params: Promise<{ providerSlug: string; clientSlug: string }>;
}) {
  const resolvedParams = await params;
  const data = await fetchData(resolvedParams);

  if ("error" in data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-xl font-semibold">No se pudo cargar este link de pedidos.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.error}
        </p>
      </div>
    );
  }

  return (
    <ClientOrder
      provider={data.provider as Provider}
      client={data.client as Client}
      products={data.products as Product[]}
      paymentSettings={data.paymentSettings as PaymentSettings}
      deliveryRules={data.deliveryRules as DeliveryRule[]}
      deliveryZones={data.deliveryZones as DeliveryZone[]}
      drafts={data.drafts as DraftState[]}
      history={data.history as PublicOrderHistory[]}
    />
  );
}
