"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCcw, Tag, ToggleLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/whatsapp";
import {
  createProduct,
  listProducts,
  toggleProductActive,
  type CreateProductResult,
  type ProductRow,
} from "./actions";

export type ProductsPageProps = { initialProviderSlug?: string };

export default function ProductsPage({ initialProviderSlug }: ProductsPageProps) {
  const providerSlug = initialProviderSlug ?? "";
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateProductResult | null>(null);
  const [pendingCreate, startCreate] = useTransition();
  const [pendingToggle, startToggle] = useTransition();

  const loadProducts = useCallback(
    async (slug: string) => {
      if (!slug) return;
      setLoadingProducts(true);
      setProductsError(null);
      const response = await listProducts(slug);
      if (response.success) {
        setProducts(response.products);
      } else {
        setProductsError(response.errors.join("\n"));
      }
      setLoadingProducts(false);
    },
    [],
  );

  useEffect(() => {
    void loadProducts(providerSlug);
  }, [loadProducts, providerSlug]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!providerSlug) return;
    const formData = new FormData(event.currentTarget);
    const priceValue = Number((formData.get("price") as string) ?? "0");
    startCreate(async () => {
      const response = await createProduct({
        providerSlug,
        name: (formData.get("name") as string) ?? "",
        price: priceValue,
        unit: (formData.get("unit") as string) ?? "",
        description: (formData.get("description") as string) ?? "",
        category: (formData.get("category") as string) ?? "",
      });
      setResult(response);
      if (response.success) {
        (event.target as HTMLFormElement).reset();
        await loadProducts(providerSlug);
      }
    });
  };

  const handleToggle = (productId: string, isActive: boolean) => {
    if (!providerSlug) return;
    startToggle(async () => {
      const response = await toggleProductActive({
        providerSlug,
        productId,
        isActive: !isActive,
      });
      if (response.success) {
        await loadProducts(providerSlug);
      } else {
        setProductsError(response.errors.join("\n"));
      }
    });
  };

  if (!providerSlug) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-xl font-semibold">Falta el slug de proveedor.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Usa la ruta /app/[providerSlug]/products para gestionar el catálogo de un proveedor.
        </p>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/50 px-4 pb-12 pt-6 sm:px-8">
      <main className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button asChild variant="ghost" size="sm">
              <Link href={providerSlug ? `/app/${providerSlug}` : "/app"}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <span>/</span>
            <Badge variant="secondary">Productos</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{providerSlug || "Proveedor"}</Badge>
            <Button
              size="icon"
              variant="outline"
              onClick={() => void loadProducts(providerSlug)}
              aria-label="Refrescar productos"
              disabled={loadingProducts}
            >
              <RefreshCcw className={`h-4 w-4 ${loadingProducts ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Catálogo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Activa / desactiva productos y revisa su precio final para los pedidos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{providerSlug || "Sin proveedor"}</Badge>
              <Badge variant="secondary">{products.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {productsError ? (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {productsError}
              </div>
            ) : null}

            {loadingProducts ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="rounded-xl border border-border/60 bg-secondary/30 p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-secondary/30 p-4 text-sm text-muted-foreground">
                Aún no hay productos para este proveedor.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{product.name}</p>
                          <Badge variant={product.is_active ? "secondary" : "outline"}>
                            {product.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {product.description || "Sin descripción"}
                        </p>
                        <div className="text-sm font-semibold">
                          {formatCurrency(product.price)}
                          {product.unit ? <span className="text-xs text-muted-foreground"> · {product.unit}</span> : null}
                        </div>
                        {product.category ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                            <Tag className="h-3 w-3" />
                            {product.category}
                          </div>
                        ) : null}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Alternar producto"
                        disabled={pendingToggle}
                        onClick={() => handleToggle(product.id, Boolean(product.is_active))}
                      >
                        <ToggleLeft className="h-5 w-5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Agregar producto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Los productos activos aparecen en el link público de la tienda.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" required placeholder="Ej: Granola premium" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="5500"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidad</Label>
                  <Input id="unit" name="unit" placeholder="kg, unidad, caja x12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Input id="category" name="category" placeholder="Snacks, bebidas..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" rows={3} placeholder="Notas para el cliente" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={pendingCreate || !providerSlug}>
                  {pendingCreate ? "Guardando..." : "Crear producto"}
                </Button>
              </div>
            </form>
            <Separator className="my-4" />
            {result ? (
              result.success ? (
                <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 text-sm">
                  {result.message}
                </div>
              ) : (
                <div className="rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
                  {result.errors.join("\n")}
                </div>
              )
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
