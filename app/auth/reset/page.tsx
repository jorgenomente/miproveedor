"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Status = "checking" | "ready" | "error" | "success";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get("next") ?? "/app";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseBrowser(), []);

  useEffect(() => {
    const hydrateSession = async () => {
      setStatus("checking");
      setError(null);

      const code = params.get("code");

      // Soporte tanto para links con `code` (PKCE) como con fragmento `#access_token`.
      const hashParams = new URLSearchParams(typeof window !== "undefined" ? window.location.hash.slice(1) : "");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          if (typeof window !== "undefined") {
            window.location.hash = "";
          }
        }

        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data.user) {
          throw userError ?? new Error("No se encontró sesión de recuperación.");
        }

        setStatus("ready");
      } catch (err) {
        console.error("No se pudo hidratar la sesión de reset", err);
        setStatus("error");
        setError("El enlace no es válido o expiró. Pide un nuevo correo de restablecimiento.");
      }
    };

    void hydrateSession();
  }, [params, supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setStatus("checking");
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setStatus("ready");
      setError(updateError.message || "No se pudo actualizar la contraseña.");
      return;
    }

    await supabase.auth.signOut();
    setStatus("success");
    setMessage("Contraseña actualizada. Inicia sesión con tu nueva contraseña.");
    setTimeout(() => {
      const loginUrl = `/auth/login?next=${encodeURIComponent(nextParam)}`;
      router.replace(loginUrl);
      router.refresh();
    }, 900);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-secondary/40">
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-12 bottom-0 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
      </motion.div>

      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-16 md:flex-row md:items-center md:gap-16 md:px-8">
        <motion.div
          className="mb-10 space-y-6 md:mb-0 md:w-1/2"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Restablecer acceso a MiProveedor
          </div>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            Define tu nueva contraseña
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Este enlace te permite crear una contraseña segura. Después te llevaremos directo a tu
            panel.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            ¿Problemas con el enlace? Pide uno nuevo desde el panel de admin.
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
                Nueva contraseña
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Escribe y confirma tu contraseña para continuar.
              </p>
            </CardHeader>
            <CardContent>
              {status === "error" ? (
                <div className="space-y-4">
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error ?? "El enlace no es válido o expiró. Pide un nuevo correo de restablecimiento."}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Usa el botón en el panel de admin para generar un nuevo enlace o{" "}
                    <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
                      vuelve al inicio de sesión
                    </Link>
                    .
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={status === "checking"}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirmar contraseña</Label>
                    <Input
                      id="confirm"
                      name="confirm"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      disabled={status === "checking"}
                      required
                    />
                  </div>

                  {error ? (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  ) : null}

                  {message ? (
                    <div className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                      {message}
                    </div>
                  ) : null}

                  <Button type="submit" className="w-full" disabled={status === "checking" || status === "success"}>
                    {status === "success" ? "Redirigiendo..." : "Guardar contraseña"}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Si no solicitaste este cambio, vuelve a iniciar sesión o{" "}
                    <Link href="/auth/logout" className="text-primary underline-offset-4 hover:underline">
                      cierra sesión
                    </Link>{" "}
                    y pide un nuevo enlace.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-secondary/40 px-4">
          <Card className="w-full max-w-md border-border/70 bg-card/80 p-6 shadow-lg backdrop-blur">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Cargando formulario de restablecimiento...</p>
            </div>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
