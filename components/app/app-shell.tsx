"use client";

import {
  type ComponentType,
  type ReactNode,
  type SVGProps,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { cn } from "@/lib/utils";

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
              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
              isActive
                ? "bg-[color:var(--info-light)] text-[color:var(--brand-deep)]"
                : "text-[color:var(--neutral-500)] hover:bg-[color:var(--surface)] hover:text-[color:var(--neutral-900)]",
            )}
          >
            {isActive ? (
              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-[color:var(--brand-deep)]" />
            ) : null}
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children, providerSlug }: { children: ReactNode; providerSlug?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const activePath = useMemo(() => pathname?.split("?")[0] ?? "", [pathname]);

  return (
    <div className="flex min-h-screen bg-[color:var(--surface)] text-[color:var(--neutral-900)]">
      <aside className="hidden h-screen w-[240px] flex-none border-r border-[color:var(--neutral-200)] bg-white md:flex md:flex-col">
        <div className="border-b border-[color:var(--neutral-100)] px-6 py-6">
          <div className="text-[15px] font-semibold text-[color:var(--brand-deep)]">MiProveedor</div>
          <p className="text-xs text-[color:var(--neutral-500)]">Panel B2B</p>
        </div>
        <div className="flex-1 px-4 py-6">
          <NavLinks activePath={activePath} providerSlug={providerSlug} />
        </div>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[260px] p-0">
          <SheetHeader className="px-6 pb-4 pt-6 text-left">
            <SheetTitle className="text-[15px] text-[color:var(--brand-deep)]">MiProveedor</SheetTitle>
            <p className="text-xs text-[color:var(--neutral-500)]">Panel B2B</p>
          </SheetHeader>
          <div className="px-4 pb-6">
            <NavLinks activePath={activePath} providerSlug={providerSlug} onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[color:var(--neutral-200)] bg-white/90 backdrop-blur">
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
                  className="w-full bg-[color:var(--surface)]"
                  aria-label="Buscar"
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" aria-label="Ayuda">
                <HelpCircle className="h-4 w-4 text-[color:var(--neutral-500)]" />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Notificaciones" className="relative">
                <Bell className="h-4 w-4 text-[color:var(--neutral-500)]" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[color:var(--error)]" />
              </Button>
              <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--brand-primary-dark)] text-xs font-semibold text-white">
                MP
              </div>
            </div>
          </div>
          <Separator className="bg-[color:var(--neutral-200)]" />
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
