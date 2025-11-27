import { DeletedOrdersPageContent } from "./deleted-orders-page";

export default async function DeletedOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ provider?: string }>;
}) {
  const resolvedSearch = (await searchParams) ?? undefined;
  return <DeletedOrdersPageContent searchParams={resolvedSearch} />;
}
