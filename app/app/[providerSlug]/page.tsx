export const dynamic = "force-dynamic";
export const revalidate = 0;

import AppDashboard from "../page";

type PageProps = {
  params: Promise<{ providerSlug: string }>;
  searchParams?: Promise<{ debug?: string }>;
};

export default async function ProviderDashboard(props: PageProps) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const resolvedSearch = searchParams ?? {};
  return (
    <AppDashboard searchParams={Promise.resolve({ provider: params.providerSlug, debug: resolvedSearch.debug })} />
  );
}
