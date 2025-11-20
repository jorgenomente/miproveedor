"use client";

import { FormEvent, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createProvider, type CreateProviderResult } from "./actions";

const preset = {
  name: "Helados Frozs",
  slug: "helados-frozs",
  email: "owner@heladosfrozs.com",
  phone: "+54 9 11 4444-8899",
};

export default function AdminProvidersPage() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CreateProviderResult | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: (formData.get("name") as string) ?? "",
      slug: (formData.get("slug") as string) ?? "",
      email: (formData.get("email") as string) ?? "",
      phone: (formData.get("phone") as string) ?? "",
    };

    startTransition(async () => {
      const response = await createProvider(payload);
      setResult(response);
    });
  };

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-b from-background via-background to-secondary/50 px-4 pb-12 pt-8 sm:px-8">
      <main className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link href="/app">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
          <span>/</span>
          <Badge variant="secondary">Admin · Proveedores</Badge>
        </div>

        <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">
              Alta manual de proveedor (Supabase)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Crea el proveedor + usuario owner y genera link de invitación desde Supabase Auth.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" defaultValue={preset.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={preset.slug}
                    required
                    pattern="^[a-z0-9-]+$"
                    title="Solo minúsculas, números y guiones"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email del owner</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={preset.email}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={preset.phone}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="submit" disabled={pending}>
                  Crear proveedor
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>

            <Separator className="my-4" />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: result ? 1 : 0.6, y: 0 }}
              className="space-y-3 rounded-xl border border-border/70 bg-secondary/40 p-4"
            >
              <p className="text-sm font-semibold">Resultado</p>
              {result?.success ? (
                <div className="space-y-2 text-sm">
                  <p>{result.message}</p>
                  <p className="text-muted-foreground">
                    Envia este link al owner para setear su contraseña:
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={result.setPasswordLink} target="_blank" rel="noreferrer">
                      {result.setPasswordLink}
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Se usa Supabase Auth (service role). Si necesitas reenviar, vuelve a generar link.
                  </p>
                </div>
              ) : result ? (
                <div className="space-y-1 text-sm text-destructive">
                  {result.errors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Completa el formulario para generar el proveedor.
                </p>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
