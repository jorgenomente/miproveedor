import { SubscriptionPageContent } from "./subscription-page";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams?: Promise<{ provider?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? undefined;

  return <SubscriptionPageContent searchParams={resolvedSearchParams} />;
}
