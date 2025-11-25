import { AccountsClient } from "../../accounts/accounts-client";

type PageProps = {
  params: Promise<{ providerSlug: string }>;
};

export default async function ProviderAccountsPage(props: PageProps) {
  const params = await props.params;
  return <AccountsClient initialProviderSlug={params.providerSlug} />;
}
