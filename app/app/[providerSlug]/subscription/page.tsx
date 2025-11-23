import { SubscriptionPageContent } from "@/app/app/subscription/subscription-page";

type PageProps = {
  params: Promise<{ providerSlug: string }>;
  searchParams?: Promise<{ provider?: string }>;
};

export default async function ProviderSubscriptionPage(props: PageProps) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const resolvedSearch = searchParams ?? {};

  return (
    <SubscriptionPageContent
      providerSlug={params.providerSlug}
      searchParams={{ ...resolvedSearch, provider: params.providerSlug }}
    />
  );
}
