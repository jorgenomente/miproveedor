import { DeletedOrdersPageContent } from "@/app/app/subscription/deleted-orders/deleted-orders-page";

type PageProps = {
  params: Promise<{ providerSlug: string }>;
  searchParams?: Promise<{ provider?: string }>;
};

export default async function ProviderDeletedOrdersPage(props: PageProps) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const resolvedSearch = searchParams ?? {};

  return (
    <DeletedOrdersPageContent
      providerSlug={params.providerSlug}
      searchParams={{ ...resolvedSearch, provider: params.providerSlug }}
    />
  );
}
