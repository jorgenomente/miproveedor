import OrdersPage from "../../orders/page";

type PageProps = {
  params: Promise<{ providerSlug: string }>;
};

export default async function ProviderOrdersPage(props: PageProps) {
  const params = await props.params;
  return <OrdersPage initialProviderSlug={params.providerSlug} />;
}
