"use server";

import { z } from "zod";
import { getDemoData } from "@/lib/demo-data";
import { getProviderScope } from "@/lib/provider-scope";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const settingsSchema = z.object({
  providerSlug: z.string().min(2),
  cashEnabled: z.boolean(),
  transferEnabled: z.boolean(),
  transferAlias: z.string().trim().max(120).optional().nullable(),
  transferCbu: z.string().trim().max(120).optional().nullable(),
  transferNotes: z.string().trim().max(500).optional().nullable(),
});

export type ProviderRow = { id: string; name: string; slug: string };

export type PaymentSettings = {
  cashEnabled: boolean;
  transferEnabled: boolean;
  transferAlias?: string | null;
  transferCbu?: string | null;
  transferNotes?: string | null;
};

export type PaymentSettingsResult =
  | { success: true; provider: ProviderRow; settings: PaymentSettings }
  | { success: false; errors: string[] };

export type SavePaymentSettingsResult =
  | { success: true; message: string; settings: PaymentSettings }
  | { success: false; errors: string[] };

const mapSettingsRow = (row?: {
  cash_enabled?: boolean | null;
  transfer_enabled?: boolean | null;
  transfer_alias?: string | null;
  transfer_cbu?: string | null;
  transfer_notes?: string | null;
}): PaymentSettings => ({
  cashEnabled: row?.cash_enabled ?? true,
  transferEnabled: row?.transfer_enabled ?? true,
  transferAlias: row?.transfer_alias ?? null,
  transferCbu: row?.transfer_cbu ?? null,
  transferNotes: row?.transfer_notes ?? null,
});

export async function getPaymentSettings(providerSlug: string): Promise<PaymentSettingsResult> {
  if (!providerSlug) return { success: false, errors: ["Falta el proveedor."] };

  if (providerSlug === "demo") {
    const demo = getDemoData();
    return {
      success: true,
      provider: { id: demo.provider.id, name: demo.provider.name, slug: demo.provider.slug },
      settings: {
        cashEnabled: true,
        transferEnabled: true,
        transferAlias: "ALIAS.DEMO",
        transferCbu: "0000000000000000000000",
        transferNotes: "Envia el comprobante por WhatsApp o súbelo al armar el pedido.",
      },
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, name, slug")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`Proveedor no encontrado: ${providerError?.message ?? "sin detalle"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const { data: settings, error: settingsError } = await supabase
    .from("provider_payment_settings")
    .upsert({ provider_id: provider.id }, { onConflict: "provider_id" })
    .select("cash_enabled, transfer_enabled, transfer_alias, transfer_cbu, transfer_notes")
    .maybeSingle();

  if (settingsError) {
    return { success: false, errors: [`No se pudieron cargar los métodos de pago: ${settingsError.message}`] };
  }

  return {
    success: true,
    provider,
    settings: mapSettingsRow(settings ?? undefined),
  };
}

export async function savePaymentSettings(
  payload: z.infer<typeof settingsSchema>,
): Promise<SavePaymentSettingsResult> {
  const parsed = settingsSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  if (!parsed.data.cashEnabled && !parsed.data.transferEnabled) {
    return { success: false, errors: ["Debes habilitar al menos un método de pago."] };
  }

  if (parsed.data.providerSlug === "demo") {
    return {
      success: true,
      message: "Cambios guardados en modo demo.",
      settings: {
        cashEnabled: parsed.data.cashEnabled,
        transferEnabled: parsed.data.transferEnabled,
        transferAlias: parsed.data.transferAlias ?? null,
        transferCbu: parsed.data.transferCbu ?? null,
        transferNotes: parsed.data.transferNotes ?? null,
      },
    };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) return { success: false, errors: [scopeResult.error] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", parsed.data.providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`Proveedor no disponible: ${providerError?.message ?? "no encontrado"}`] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const upsertPayload = {
    provider_id: provider.id,
    cash_enabled: parsed.data.cashEnabled,
    transfer_enabled: parsed.data.transferEnabled,
    transfer_alias: parsed.data.transferAlias || null,
    transfer_cbu: parsed.data.transferCbu || null,
    transfer_notes: parsed.data.transferNotes || null,
  };

  const { data, error } = await supabase
    .from("provider_payment_settings")
    .upsert(upsertPayload, { onConflict: "provider_id" })
    .select("cash_enabled, transfer_enabled, transfer_alias, transfer_cbu, transfer_notes")
    .maybeSingle();

  if (error) {
    return { success: false, errors: [`No se pudieron guardar los cambios: ${error.message}`] };
  }

  return {
    success: true,
    message: "Métodos de pago actualizados.",
    settings: mapSettingsRow(data ?? undefined),
  };
}
