import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getProviderScope, type ProviderScope } from "@/lib/provider-scope";
import LogoutButton from "@/components/logout-button";

export const metadata: Metadata = {
  title: "MiProveedor · Panel B2B simple",
  description: "Gestiona proveedores, tiendas y pedidos en un panel simple, mobile-first.",
};

function renderUserChip(scope?: ProviderScope) {
  if (!scope) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className="rounded-full border border-border/60 bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/60 hover:text-primary"
        >
          No has iniciado sesión · Entrar
        </Link>
      </div>
    );
  }

  const chip =
    scope.role === "admin" ? (
      <Link
        href="/admin/providers"
        className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
      >
        Admin
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
          Todos los proveedores
        </span>
      </Link>
    ) : (
      <Link
        href={`/app/${scope.provider.slug}`}
        className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
      >
        Proveedor
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          {scope.provider.name}
        </span>
      </Link>
    );

  return (
    <div className="flex items-center gap-2">
      {chip}
      <LogoutButton />
    </div>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const scopeResult = await getProviderScope().catch(() => ({ scope: undefined }));
  const scope = scopeResult?.scope;

  return (
    <html lang="es">
      <body className="antialiased">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-secondary/50 text-sm font-semibold text-muted-foreground">
                Logo
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">MiProveedor</p>
                <p className="text-xs text-muted-foreground">Pedidos B2B simples y móviles</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">{renderUserChip(scope)}</div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
