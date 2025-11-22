import ProductsPage from "../../products/page";

type PageProps = {
  params: Promise<{ providerSlug: string }>;
};

export default async function ProviderProductsPage(props: PageProps) {
  const params = await props.params;
  return <ProductsPage initialProviderSlug={params.providerSlug} />;
}
