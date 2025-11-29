import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProviderScope } from "@/lib/provider-scope";
import { PaymentsClient } from "./payments-client";
import { getPaymentSettings } from "./actions";
import { getAdminSelectedProviderSlug } from "../actions/admin-provider";

type PageProps = {
  searchParams?: Promise<{ provider?: string }>;
};

export default async function PaymentsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? undefined;
  const scopeResult = await getProviderScope();
  const scopedSlug = scopeResult.scope?.role === "provider" ? scopeResult.scope.provider.slug : undefined;
  const adminStoredSlug =
    scopeResult.scope?.role === "admin" ? await getAdminSelectedProviderSlug() : undefined;
  const providerSlug = resolvedSearchParams?.provider ?? adminStoredSlug ?? scopedSlug;

  if (!providerSlug) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card className="border-[color:var(--neutral-200)] bg-white shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Selecciona un proveedor</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Ingresa desde <code>/app/tu-proveedor/payments</code> o usa el botón del dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = await getPaymentSettings(providerSlug);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">No se pudo cargar Mis alias y pagos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-destructive">
            {result.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PaymentsClient
      providerSlug={providerSlug}
      provider={result.provider}
      initialSettings={result.settings}
    />
  );
}
