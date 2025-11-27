import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProviderScope } from "@/lib/provider-scope";
import { listArchivedOrders } from "../../accounts/actions";
import { ArchivedOrdersClient } from "./archived-orders-client";

type PageProps = {
  providerSlug?: string;
  searchParams?: { provider?: string };
};

export async function DeletedOrdersPageContent({ providerSlug, searchParams }: PageProps) {
  const scopeResult = await getProviderScope();
  const scopedSlug = scopeResult.scope?.role === "provider" ? scopeResult.scope.provider.slug : undefined;
  const resolvedSlug = providerSlug ?? searchParams?.provider ?? scopedSlug;

  if (!resolvedSlug) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-16 text-center">
        <p className="text-2xl font-semibold">Selecciona un proveedor</p>
        <p className="text-sm text-muted-foreground">
          Entra desde <code>/app/tu-proveedor/subscription/deleted-orders</code> o usa el botón del dashboard.
        </p>
      </div>
    );
  }

  const result = await listArchivedOrders(resolvedSlug);
  if (!result.success) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">No se pudo cargar Pedidos eliminados</CardTitle>
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
    <ArchivedOrdersClient
      providerSlug={resolvedSlug}
      provider={result.provider}
      initialOrders={result.orders}
    />
  );
}
