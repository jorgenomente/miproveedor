"use server";

import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  email: z.string().email(),
  phone: z.string().min(6),
  address: z.string().min(3),
  cuit: z.string().min(6),
});

export type CreateProviderResult =
  | {
      success: true;
      providerId: string;
      userId: string;
      setPasswordLink?: string;
      resetEmailSent?: boolean;
      message: string;
      warning?: string;
    }
  | {
      success: false;
      errors: string[];
    };

export type ProviderRow = {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  cuit: string | null;
  is_active: boolean | null;
  subscription_status: "active" | "paused" | "canceled" | null;
  subscribed_at: string | null;
  renews_at: string | null;
  paused_at: string | null;
  created_at: string | null;
  payments_total?: number;
  pending_payments?: number;
  last_payment_at?: string | null;
  last_payment_period?: string | null;
  last_payment_status?: "pending" | "approved" | "rejected" | null;
};

export type ListProvidersResult =
  | {
      success: true;
      providers: ProviderRow[];
    }
  | {
      success: false;
      errors: string[];
    };

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  contact_email: z
    .string()
    .email()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
  contact_phone: z
    .string()
    .min(6)
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
  is_active: z.boolean(),
  subscribed_at: z
    .union([z.string().datetime(), z.literal("")])
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  renews_at: z
    .union([z.string().datetime(), z.literal("")])
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
});

const toggleSubscriptionSchema = z.object({
  id: z.string().uuid(),
});

export type UpdateProviderResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      errors: string[];
    };

const deleteSchema = z.object({
  id: z.string().uuid(),
});

const paymentsSchema = z.object({
  providerId: z.string().uuid(),
});

export type DeleteProviderResult =
  | { success: true; message: string }
  | { success: false; errors: string[] };

export type ResetPasswordResult =
  | { success: true; message: string }
  | { success: false; errors: string[] };

export type ToggleSubscriptionResult =
  | {
      success: true;
      status: "active" | "paused";
      message: string;
      renews_at?: string | null;
    }
  | { success: false; errors: string[] };

export type ProviderPaymentRow = {
  id: string;
  provider_id: string;
  period_label: string;
  proof_url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string | null;
};

export type ListProviderPaymentsResult =
  | { success: true; payments: ProviderPaymentRow[] }
  | { success: false; errors: string[] };

function getAppBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function buildPasswordResetRedirect(providerSlug: string) {
  const baseUrl = getAppBaseUrl();
  const callbackUrl = new URL("/auth/callback", baseUrl);
  const resetPath = `/auth/reset?next=${encodeURIComponent(`/app/${providerSlug}`)}`;
  callbackUrl.searchParams.set("next", resetPath);
  return callbackUrl.toString();
}

export async function listProviders(): Promise<ListProvidersResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."],
    };
  }

  const { data, error } = await supabase
    .from("providers")
    .select(
      "id, name, slug, contact_email, contact_phone, address, cuit, is_active, subscription_status, subscribed_at, renews_at, paused_at, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return {
      success: false,
      errors: [`No se pudieron cargar los proveedores: ${error.message}`],
    };
  }

  const providers = data ?? [];
  const providerIds = providers.map((provider) => provider.id).filter(Boolean);

  const paymentSummary: Record<
    string,
    {
      total: number;
      pending: number;
      lastAt: string | null;
      lastPeriod: string | null;
      lastStatus: "pending" | "approved" | "rejected" | null;
    }
  > = {};

  if (providerIds.length > 0) {
    const { data: payments, error: paymentsError } = await supabase
      .from("provider_payments")
      .select("provider_id, status, period_label, created_at")
      .in("provider_id", providerIds)
      .order("created_at", { ascending: false });

    if (!paymentsError && payments) {
      payments.forEach((payment) => {
        if (!payment.provider_id) return;
        if (!paymentSummary[payment.provider_id]) {
          paymentSummary[payment.provider_id] = {
            total: 0,
            pending: 0,
            lastAt: null,
            lastPeriod: null,
            lastStatus: null,
          };
        }

        const summary = paymentSummary[payment.provider_id];
        summary.total += 1;
        if (payment.status === "pending") summary.pending += 1;

        if (!summary.lastAt) {
          summary.lastAt = payment.created_at ?? null;
          summary.lastPeriod = payment.period_label ?? null;
          summary.lastStatus = payment.status ?? null;
        }
      });
    }
  }

  const providersWithPayments = providers.map((provider) => {
    const summary =
      paymentSummary[provider.id] ?? {
        total: 0,
        pending: 0,
        lastAt: null,
        lastPeriod: null,
        lastStatus: null,
      };

    return {
      ...provider,
      payments_total: summary.total,
      pending_payments: summary.pending,
      last_payment_at: summary.lastAt,
      last_payment_period: summary.lastPeriod,
      last_payment_status: summary.lastStatus,
    };
  });

  return {
    success: true,
    providers: providersWithPayments,
  };
}

export async function listProviderPayments(
  payload: z.infer<typeof paymentsSchema>,
): Promise<ListProviderPaymentsResult> {
  const parsed = paymentsSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };
  }

  const { data, error } = await supabase
    .from("provider_payments")
    .select("id, provider_id, period_label, proof_url, status, created_at")
    .eq("provider_id", parsed.data.providerId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, errors: [`No se pudieron cargar los pagos: ${error.message}`] };
  }

  return { success: true, payments: data ?? [] };
}

export async function updateProvider(
  payload: z.infer<typeof updateSchema>,
): Promise<UpdateProviderResult> {
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."],
    };
  }

  const { error } = await supabase
    .from("providers")
    .update({
      name: parsed.data.name,
      contact_email: parsed.data.contact_email,
      contact_phone: parsed.data.contact_phone,
      is_active: parsed.data.is_active,
      subscribed_at: parsed.data.subscribed_at,
      renews_at: parsed.data.renews_at,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return {
      success: false,
      errors: [`No se pudo actualizar el proveedor: ${error.message}`],
    };
  }

  return {
    success: true,
    message: "Proveedor actualizado.",
  };
}

export async function toggleSubscription(
  payload: z.infer<typeof toggleSubscriptionSchema>,
): Promise<ToggleSubscriptionResult> {
  const parsed = toggleSubscriptionSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, subscription_status, renews_at")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (providerError || !provider) {
    return {
      success: false,
      errors: [`Proveedor no encontrado: ${providerError?.message ?? "sin detalle"}`],
    };
  }

  if (provider.subscription_status === "canceled") {
    return {
      success: false,
      errors: ["La suscripción está cancelada. Reactívala desde billing para continuar."],
    };
  }

  const now = Date.now();
  const nextStatus = provider.subscription_status === "paused" ? "active" : "paused";
  const updates: Record<string, string | null> = {
    subscription_status: nextStatus,
    paused_at: nextStatus === "paused" ? new Date(now).toISOString() : null,
  };

  const renewsAt = provider.renews_at ? new Date(provider.renews_at).getTime() : null;
  if (nextStatus === "active" && (!renewsAt || renewsAt < now)) {
    const nextRenew = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
    updates.renews_at = nextRenew;
  }

  const { error: updateError } = await supabase
    .from("providers")
    .update(updates)
    .eq("id", provider.id);

  if (updateError) {
    return { success: false, errors: [`No se pudo actualizar la suscripción: ${updateError.message}`] };
  }

  return {
    success: true,
    status: nextStatus,
    renews_at: updates.renews_at ?? provider.renews_at ?? null,
    message: nextStatus === "paused" ? "Suscripción pausada y links desactivados." : "Suscripción reactivada.",
  };
}

export async function deleteProvider(payload: z.infer<typeof deleteSchema>): Promise<DeleteProviderResult> {
  const parsed = deleteSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, name")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (providerError || !provider) {
    return {
      success: false,
      errors: [`Proveedor no encontrado: ${providerError?.message ?? "sin detalle"}`],
    };
  }

  // Eliminar en cascada: primero dependencias hijos para evitar FK.
  // 1) Ordenes y order_items
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id")
    .eq("provider_id", provider.id);
  if (ordersError) {
    return {
      success: false,
      errors: [`No se pudieron leer pedidos para eliminar: ${ordersError.message}`],
    };
  }
  const orderIds = (orders ?? []).map((o) => o.id).filter(Boolean);
  if (orderIds.length > 0) {
    const { error: deleteItemsError } = await supabase
      .from("order_items")
      .delete()
      .in("order_id", orderIds);
    if (deleteItemsError) {
      return {
        success: false,
        errors: [`No se pudieron eliminar items de pedidos: ${deleteItemsError.message}`],
      };
    }
    const { error: deleteOrdersError } = await supabase.from("orders").delete().in("id", orderIds);
    if (deleteOrdersError) {
      return {
        success: false,
        errors: [`No se pudieron eliminar pedidos: ${deleteOrdersError.message}`],
      };
    }
  }

  // 2) Productos
  const { error: deleteProductsError } = await supabase.from("products").delete().eq("provider_id", provider.id);
  if (deleteProductsError) {
    return {
      success: false,
      errors: [`No se pudieron eliminar productos: ${deleteProductsError.message}`],
    };
  }

  // 3) Clientes
  const { error: deleteClientsError } = await supabase.from("clients").delete().eq("provider_id", provider.id);
  if (deleteClientsError) {
    return {
      success: false,
      errors: [`No se pudieron eliminar tiendas: ${deleteClientsError.message}`],
    };
  }

  // 4) Usuarios (tabla y Auth)
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("provider_id", provider.id);

  if (usersError) {
    return {
      success: false,
      errors: [`No se pudieron listar usuarios del proveedor: ${usersError.message}`],
    };
  }

  if (users && users.length > 0) {
    await Promise.all(
      users.map(async (user) => {
        if (!user.id) return;
        await supabase.auth.admin.deleteUser(user.id).catch(() => {
          // Ignoramos errores de Auth para no bloquear borrado de tabla local
        });
      }),
    );

    const { error: deleteUsersError } = await supabase.from("users").delete().eq("provider_id", provider.id);
    if (deleteUsersError) {
      return {
        success: false,
        errors: [`No se pudieron eliminar usuarios vinculados: ${deleteUsersError.message}`],
      };
    }
  }

  // 5) Proveedor
  const { error: deleteProviderError } = await supabase.from("providers").delete().eq("id", provider.id);

  if (deleteProviderError) {
    return {
      success: false,
      errors: [`No se pudo eliminar el proveedor: ${deleteProviderError.message}`],
    };
  }

  return { success: true, message: `Proveedor "${provider.name}" eliminado con sus datos.` };
}

const resetSchema = z.object({
  providerId: z.string().uuid(),
});

export async function sendPasswordReset(payload: z.infer<typeof resetSchema>): Promise<ResetPasswordResult> {
  const parsed = resetSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug, name")
    .eq("id", parsed.data.providerId)
    .maybeSingle();

  if (providerError || !provider) {
    return {
      success: false,
      errors: [`Proveedor no encontrado: ${providerError?.message ?? "sin detalle"}`],
    };
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("email")
    .eq("provider_id", provider.id)
    .eq("role", "provider")
    .limit(1)
    .maybeSingle();

  if (userError || !user?.email) {
    return {
      success: false,
      errors: [
        `No se encontró usuario principal (proveedor) para este proveedor: ${userError?.message ?? "sin detalle"}.`,
      ],
    };
  }

  const redirectTo = buildPasswordResetRedirect(provider.slug);

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo,
  });

  if (resetError) {
    return {
      success: false,
      errors: [`No se pudo enviar el correo de restablecimiento: ${resetError.message}`],
    };
  }

  return {
    success: true,
    message: `Se envió un correo de restablecimiento a ${user.email} para ${provider.name}.`,
  };
}

export async function createProvider(payload: z.infer<typeof createSchema>): Promise<CreateProviderResult> {
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."],
    };
  }

  // 1) Validar slug único
  const { data: existing, error: slugError } = await supabase
    .from("providers")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();

  if (slugError) {
    return {
      success: false,
      errors: [`Error verificando slug: ${slugError.message}`],
    };
  }

  if (existing?.id) {
    return {
      success: false,
      errors: ["Ya existe un proveedor con ese slug."],
    };
  }

  // 2) Crear provider
  const { data: providerRow, error: providerError } = await supabase
    .from("providers")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      contact_email: parsed.data.email,
      contact_phone: parsed.data.phone,
      address: parsed.data.address,
      cuit: parsed.data.cuit,
      is_active: true,
    })
    .select("id")
    .single();

  if (providerError || !providerRow?.id) {
    return {
      success: false,
      errors: [
        `No se pudo crear el proveedor: ${
          providerError?.message ?? "sin detalle"
        }`,
      ],
    };
  }

  // 3) Crear usuario proveedor en Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser(
    {
      email: parsed.data.email,
      email_confirm: true,
      phone: parsed.data.phone,
      user_metadata: {
        provider_id: providerRow.id,
        role: "provider",
      },
    }
  );

  if (authError || !authUser?.user?.id) {
    return {
      success: false,
      errors: [
        `Proveedor creado pero usuario falló: ${
          authError?.message ?? "sin detalle"
        }`,
      ],
    };
  }

  // 4) Guardar usuario en tabla users
  const { error: userInsertError } = await supabase.from("users").insert({
    id: authUser.user.id,
    name: parsed.data.name,
    email: parsed.data.email,
    role: "provider",
    provider_id: providerRow.id,
  });

  if (userInsertError) {
    return {
      success: false,
      errors: [
        `Auth creado pero no se pudo insertar en users: ${userInsertError.message}`,
      ],
    };
  }

  // 5) Generar link de invitación / set password
  const resetRedirectTo = buildPasswordResetRedirect(parsed.data.slug);

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink(
    {
      type: "invite",
      email: parsed.data.email,
      options: {
        redirectTo: resetRedirectTo,
      },
    }
  );

  const invitationLink = linkData?.properties?.action_link;

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: resetRedirectTo,
  });

  if ((linkError || !invitationLink) && resetError) {
    return {
      success: true,
      providerId: providerRow.id,
      userId: authUser.user.id,
      setPasswordLink: undefined,
      resetEmailSent: false,
      warning: `Proveedor creado, pero no se pudo generar link ni enviar correo de restablecimiento: ${
        linkError?.message ?? resetError?.message ?? "sin detalle"
      }. Genera un reset manual desde Supabase Auth.`,
      message: `Proveedor ${parsed.data.name} creado.`,
    };
  }

  return {
    success: true,
    providerId: providerRow.id,
    userId: authUser.user.id,
    setPasswordLink: invitationLink,
    resetEmailSent: !resetError,
    message: `Proveedor ${parsed.data.name} creado.`,
    warning:
      resetError && !linkError
        ? `Link generado, pero el correo de restablecimiento no pudo enviarse automáticamente: ${resetError.message}.`
        : !invitationLink
          ? "El correo se envió, pero no se pudo obtener un link directo; reenvía si es necesario."
          : undefined,
  };
}
