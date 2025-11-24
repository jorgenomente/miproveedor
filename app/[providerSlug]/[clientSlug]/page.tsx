import { createClient } from "@supabase/supabase-js";
import { getDemoData } from "@/lib/demo-data";
import { type DeliveryRule } from "@/lib/delivery-windows";
import { ClientOrder, type Client, type PaymentSettings, type Product, type Provider, type PublicOrderHistory } from "./client-order";

export const dynamic = "force-dynamic";

type LoadedData =
  | {
      provider: Provider;
      client: Client;
      products: Product[];
      paymentSettings: PaymentSettings;
      history: PublicOrderHistory[];
      deliveryRules: DeliveryRule[];
      error?: undefined;
    }
  | {
      provider?: undefined;
      client?: undefined;
      products?: undefined;
      paymentSettings?: undefined;
      history?: undefined;
      deliveryRules?: undefined;
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
    const paymentSettings: PaymentSettings = {
      cashEnabled: true,
      transferEnabled: true,
      transferAlias: "ALIAS.DEMO",
      transferCbu: "0000000000000000000000",
      transferNotes: "Envía tu comprobante por WhatsApp o súbelo al enviar el pedido.",
    };

    const history: PublicOrderHistory[] = demo.orders
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
          order.items.map((item) => ({
            productName: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
          })),
      }));

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
      products: demo.products.map((product) => {
        const basePrice = Number(product.price ?? 0);
        const discount = Number(product.discount_percent ?? 0);
        const finalPrice = Number((basePrice * (1 - Math.max(0, Math.min(100, discount)) / 100)).toFixed(2));
        return {
          id: product.id,
          name: product.name,
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
    deliveryRules,
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
      "id, name, description, price, unit, image_url, discount_percent, is_active, category, tags, is_new, is_out_of_stock",
    )
    .eq("provider_id", provider.id)
    .eq("is_active", true)
    .order("name");

  if (productsError) {
    return {
      error: `Error cargando productos: ${productsError.message}`,
    };
  }

  const { data: paymentSettingsRow } = await supabase
    .from("provider_payment_settings")
    .select("cash_enabled, transfer_enabled, transfer_alias, transfer_cbu, transfer_notes")
    .eq("provider_id", provider.id)
    .maybeSingle();

  const paymentSettings: PaymentSettings = {
    cashEnabled: paymentSettingsRow?.cash_enabled ?? true,
    transferEnabled: paymentSettingsRow?.transfer_enabled ?? true,
    transferAlias: paymentSettingsRow?.transfer_alias ?? null,
    transferCbu: paymentSettingsRow?.transfer_cbu ?? null,
    transferNotes: paymentSettingsRow?.transfer_notes ?? null,
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

      const total = items.reduce((acc, item) => acc + item.subtotal, 0);

      return {
        id: order.id,
        status: order.status,
        paymentMethod: (order as { payment_method?: string }).payment_method ?? null,
        paymentProofStatus: (order as { payment_proof_status?: string }).payment_proof_status ?? null,
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
      history={data.history as PublicOrderHistory[]}
    />
  );
}
