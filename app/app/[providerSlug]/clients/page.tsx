import ClientsPage from "../../clients/page";

type PageProps = {
  params: Promise<{ providerSlug: string }>;
};

export default async function ProviderClientsPage(props: PageProps) {
  const params = await props.params;
  return <ClientsPage initialProviderSlug={params.providerSlug} />;
}
