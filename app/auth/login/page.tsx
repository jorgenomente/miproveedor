"use client";

import { FormEvent, Suspense, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

function LoginForm() {
  const params = useSearchParams();
  const nextParam = params.get("next");
  const hasNextParam = params.has("next");
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const supabase = getSupabaseBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError(signInError.message || "No se pudo iniciar sesión.");
        return;
      }

      // Si el query string pide un destino específico, respetarlo.
      if (hasNextParam && nextParam) {
        window.location.href = nextParam;
        return;
      }

      // Resolver destino en servidor según rol/tenant
      try {
        const response = await fetch("/auth/destination", { credentials: "include" });
        if (response.ok) {
          const data = (await response.json()) as { destination?: string };
          if (data.destination) {
            window.location.href = data.destination;
            return;
          }
        }
      } catch (err) {
        console.warn("No se pudo resolver destino, uso fallback /app", err);
      }

      window.location.href = "/app";
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-secondary/40">
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-12 bottom-0 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
      </motion.div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-16 md:flex-row md:items-center md:gap-16 md:px-8">
        <motion.div
          className="mb-10 space-y-6 md:mb-0 md:w-1/2"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Acceso seguro a MiProveedor
          </div>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            {greeting}, vuelve a tu panel
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Inicia sesión con tu correo y contraseña para acceder a tu dashboard. Los administradores
            verán todos los proveedores; los proveedores irán directo a su propio panel.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            ¿Volver al inicio? <Link href="/" className="text-primary underline-offset-4 hover:underline">Inicio</Link>
          </div>
        </motion.div>

        <motion.div
          className="md:w-1/2"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45 }}
        >
          <Card className="border-border/70 bg-card/80 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-4 w-4 text-primary" />
                Iniciar sesión
              </CardTitle>
              <p className="text-sm text-muted-foreground">Usa tu correo y contraseña de MiProveedor.</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Correo
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={pending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={pending}
                  />
                </div>

                {error ? (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Ingresando..." : "Entrar"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  ¿Olvidaste tu contraseña? Pide un reset desde el panel o contacta al admin.
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="animate-pulse text-sm text-muted-foreground">Cargando formulario...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
