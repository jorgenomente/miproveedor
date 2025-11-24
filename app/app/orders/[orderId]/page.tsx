export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import { OrderDetailClient } from "../order-detail-client";
import { getOrderDetail } from "../actions";

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ provider?: string }>;
};

export default async function OrderDetailPage(props: PageProps) {
  const params = await props.params;
  const orderId = params.orderId;
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const providerSlug = searchParams?.provider;

  const detail = await getOrderDetail(orderId);
  if (!detail.success) {
    if (detail.errors.some((error) => /no encontrado/i.test(error))) return notFound();
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-xl font-semibold">No se pudo cargar el pedido.</p>
        <p className="mt-2 text-sm text-muted-foreground">{detail.errors.join(" · ")}</p>
      </div>
    );
  }

  const backHref = providerSlug ? `/app/orders?provider=${providerSlug}` : "/app/orders";

  return <OrderDetailClient order={detail.order} backHref={backHref} />;
}
