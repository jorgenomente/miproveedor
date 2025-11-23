import { redirect } from "next/navigation";
import { getProviderScope, type ProviderScope } from "./provider-scope";

type RequireAuthOptions = {
  next?: string;
  mustBeAdmin?: boolean;
  providerSlug?: string;
};

export async function requireAuth(options: RequireAuthOptions = {}): Promise<ProviderScope> {
  const nextPath = options.next ?? "/app";
  const { scope, error } = await getProviderScope();

  if (!scope) {
    const login = `/auth/login?next=${encodeURIComponent(nextPath)}`;
    redirect(login);
  }

  if (options.mustBeAdmin && scope.role !== "admin") {
    // Redirige al dashboard propio del proveedor si intenta acceder a admin.
    if (scope.role === "provider") {
      redirect(`/app/${scope.provider.slug}`);
    }
    redirect("/app");
  }

  if (options.providerSlug && scope.role === "provider" && scope.provider.slug !== options.providerSlug) {
    // Si un proveedor intenta acceder al dashboard de otro, lo devolvemos al suyo.
    redirect(`/app/${scope.provider.slug}`);
  }

  return scope;
}
