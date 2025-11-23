import { createClient } from "@supabase/supabase-js";
import { getDemoData } from "@/lib/demo-data";
import { ClientOrder, type Client, type Product, type Provider } from "./client-order";

export const dynamic = "force-dynamic";

type LoadedData =
  | {
      provider: Provider;
      client: Client;
  products: Product[];
      error?: undefined;
    }
  | { provider?: undefined; client?: undefined; products?: undefined; error: string };

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

  return <ClientOrder provider={data.provider as Provider} client={data.client as Client} products={data.products as Product[]} />;
}
