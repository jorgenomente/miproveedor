"use client";

import { type ComponentType, type ReactNode, type SVGProps, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Bell,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Users,
  X,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { cn } from "@/lib/utils";
import { ProviderContextProvider, useProviderContext } from "./provider-context";
import { listProviders, type ProviderRow } from "@/app/app/orders/actions";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

function buildNavItems(providerSlug?: string): NavItem[] {
  const base = providerSlug ? `/app/${providerSlug}` : "/app";
  const orders = providerSlug ? `${base}/orders` : "/app/orders";
  const clients = providerSlug ? `${base}/clients` : "/app/clients";
  const accounts = providerSlug ? `${base}/accounts` : "/app/accounts";
  const payments = providerSlug ? `${base}/payments` : "/app/payments";
  const products = providerSlug ? `${base}/products` : "/app/products";
  const subscription = providerSlug ? `${base}/subscription` : "/app/subscription";

  return [
    { label: "Dashboard", href: base, icon: LayoutDashboard },
    { label: "Pedidos", href: orders, icon: Package },
    { label: "Clientes", href: clients, icon: Users },
    { label: "Cuentas", href: accounts, icon: Wallet },
    { label: "Mis alias y pagos", href: payments, icon: CreditCard },
    { label: "Productos", href: products, icon: ShoppingBag },
    { label: "Configuración", href: subscription, icon: Settings },
  ];
}

function NavLinks({
  activePath,
  providerSlug,
  onNavigate,
}: {
  activePath: string;
  providerSlug?: string;
  onNavigate?: () => void;
}) {
  const navItems = useMemo(() => buildNavItems(providerSlug), [providerSlug]);

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePath === item.href || activePath.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
              isActive
                ? "bg-[color:var(--sidebar-accent)] text-[color:var(--sidebar-primary)] shadow-[var(--shadow-sm)]"
                : "text-[color:var(--sidebar-foreground)]/70 hover:bg-[color:var(--sidebar-accent)]/70 hover:text-[color:var(--sidebar-foreground)]",
            )}
          >
            {isActive ? (
              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-[color:var(--sidebar-primary)]" />
            ) : null}
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AdminProviderSelect() {
  const { role, providerSlug, setProviderSlug, isLocked } = useProviderContext();
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "admin") return;
    setLoading(true);
    setError(null);
    void listProviders()
      .then((response) => {
        if (response.success) {
          setProviders(response.providers);
          if (!providerSlug && response.providers.length > 0) {
            const firstActive =
              response.providers.find((provider) => provider.is_active !== false) ?? response.providers[0];
            if (firstActive?.slug) {
              void setProviderSlug(firstActive.slug);
            }
          }
        } else {
          setError(response.errors.join("\n"));
        }
      })
      .finally(() => setLoading(false));
  }, [providerSlug, role, setProviderSlug]);

  if (role !== "admin") return null;

  return (
    <div className="flex items-center gap-2">
      <Select value={providerSlug} onValueChange={(value) => void setProviderSlug(value)} disabled={loading || isLocked}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Selecciona proveedor" />
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => (
            <SelectItem key={provider.id} value={provider.slug}>
              {provider.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function AppShellContent({ children }: { children: ReactNode }) {
  const { providerSlug } = useProviderContext();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activePath = useMemo(() => pathname?.split("?")[0] ?? "", [pathname]);

  return (
    <div className="flex min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <aside className="hidden h-screen w-[240px] flex-none border-r border-[color:var(--sidebar-border)] bg-[color:var(--sidebar)] md:flex md:flex-col">
        <div className="border-b border-[color:var(--sidebar-border)] px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-accent)]">
              <Image
                src="/MiProveedor.png"
                alt="Logo de MiProveedor"
                fill
                className="object-contain p-1.5"
                sizes="40px"
                priority
              />
            </div>
            <div>
              <div className="text-[15px] font-semibold text-[color:var(--sidebar-primary)]">MiProveedor</div>
              <p className="text-xs text-[color:var(--sidebar-foreground)]/70">Panel B2B</p>
            </div>
          </div>
        </div>
        <div className="flex-1 px-4 py-6">
          <NavLinks activePath={activePath} providerSlug={providerSlug} />
        </div>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[260px] p-0 bg-[color:var(--sidebar)] text-[color:var(--sidebar-foreground)]">
          <SheetHeader className="px-6 pb-4 pt-6 text-left">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[color:var(--sidebar-border)] bg-[color:var(--sidebar-accent)]">
                <Image
                  src="/MiProveedor.png"
                  alt="Logo de MiProveedor"
                  fill
                  className="object-contain p-1.5"
                  sizes="40px"
                  priority
                />
              </div>
              <div>
                <SheetTitle className="text-[15px] text-[color:var(--sidebar-primary)]">MiProveedor</SheetTitle>
                <p className="text-xs text-[color:var(--sidebar-foreground)]/70">Panel B2B</p>
              </div>
            </div>
          </SheetHeader>
          <div className="px-4 pb-6">
            <NavLinks activePath={activePath} providerSlug={providerSlug} onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex flex-1 items-center gap-3">
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                onClick={() => setOpen(true)}
                aria-label="Abrir navegación"
              >
                {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <div className="relative hidden flex-1 items-center md:flex">
                <Input
                  placeholder="Buscar pedidos, clientes, productos..."
                  className="w-full bg-[color:var(--muted)]"
                  aria-label="Buscar"
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <AdminProviderSelect />
              <ThemeToggle />
              <Button variant="ghost" size="icon-sm" aria-label="Ayuda">
                <HelpCircle className="h-4 w-4 text-[color:var(--muted-foreground)]" />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Notificaciones" className="relative">
                <Bell className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[color:var(--error)] shadow-[0_0_0_6px_rgba(214,69,69,0.18)]" />
              </Button>
              <div className="relative ml-2 h-9 w-9 overflow-hidden rounded-full border border-[color:var(--border)] bg-[color:var(--muted)]">
                <Image
                  src="/MiProveedor.png"
                  alt="Logo de MiProveedor"
                  fill
                  className="object-contain p-1.5"
                  sizes="36px"
                  priority
                />
              </div>
            </div>
          </div>
          <Separator className="bg-[color:var(--border)]" />
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  providerSlug,
  role,
}: {
  children: ReactNode;
  providerSlug?: string;
  role: "admin" | "provider";
}) {
  return (
    <ProviderContextProvider role={role} initialProviderSlug={providerSlug} locked={role === "provider"}>
      <AppShellContent>{children}</AppShellContent>
    </ProviderContextProvider>
  );
}
