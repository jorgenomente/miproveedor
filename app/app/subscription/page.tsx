import { SubscriptionPageContent } from "./subscription-page";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams?: { provider?: string };
}) {
  return <SubscriptionPageContent searchParams={searchParams} />;
}
