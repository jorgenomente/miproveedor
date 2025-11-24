import PaymentsPage from "../../payments/page";

type PageProps = {
  params: Promise<{ providerSlug: string }>;
};

export default async function ProviderPaymentsPage({ params }: PageProps) {
  const resolved = await params;
  return <PaymentsPage searchParams={Promise.resolve({ provider: resolved.providerSlug })} />;
}
