"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { getDemoData } from "@/lib/demo-data";
import { getProviderScope } from "@/lib/provider-scope";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const transferProfileSchema = z
  .object({
    id: z.string().uuid().optional(),
    label: z.string().trim().max(120).optional().nullable(),
    alias: z.string().trim().max(120).optional().nullable(),
    cbu: z.string().trim().max(120).optional().nullable(),
    extraInfo: z.string().trim().max(240).optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (!value.alias && !value.cbu) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cada cuenta de transferencia debe tener alias o CBU.",
        path: ["alias"],
      });
    }
  });

const settingsSchema = z.object({
  providerSlug: z.string().min(2),
  cashEnabled: z.boolean(),
  transferEnabled: z.boolean(),
  transferNotes: z.string().trim().max(500).optional().nullable(),
  transferProfiles: z.array(transferProfileSchema).default([]),
});

export type ProviderRow = { id: string; name: string; slug: string };

export type TransferProfile = {
  id: string;
  label?: string | null;
  alias?: string | null;
  cbu?: string | null;
  extraInfo?: string | null;
  isActive: boolean;
};

export type PaymentSettings = {
  cashEnabled: boolean;
  transferEnabled: boolean;
  transferNotes?: string | null;
  transferProfiles: TransferProfile[];
};

export type PaymentSettingsResult =
  | { success: true; provider: ProviderRow; settings: PaymentSettings }
  | { success: false; errors: string[] };

export type SavePaymentSettingsResult =
  | { success: true; message: string; settings: PaymentSettings }
  | { success: false; errors: string[] };

const mapSettings = ({
  settingsRow,
  profiles,
}: {
  settingsRow?: {
    cash_enabled?: boolean | null;
    transfer_enabled?: boolean | null;
    transfer_notes?: string | null;
  };
  profiles?: {
    id: string;
    label?: string | null;
    alias?: string | null;
    cbu?: string | null;
    extra_info?: string | null;
    is_active?: boolean | null;
  }[];
}): PaymentSettings => ({
  cashEnabled: settingsRow?.cash_enabled ?? true,
  transferEnabled: settingsRow?.transfer_enabled ?? true,
  transferNotes: settingsRow?.transfer_notes ?? null,
  transferProfiles:
    profiles?.map((profile) => ({
      id: profile.id,
      label: profile.label ?? null,
      alias: profile.alias ?? null,
      cbu: profile.cbu ?? null,
      extraInfo: profile.extra_info ?? null,
      isActive: profile.is_active ?? true,
    })) ?? [],
});

async function fetchProviderSettings(providerId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Faltan credenciales de Supabase (SERVICE_ROLE / URL)." } as const;

  const [{ data: settingsRow, error: settingsError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase
      .from("provider_payment_settings")
      .upsert({ provider_id: providerId }, { onConflict: "provider_id" })
      .select("cash_enabled, transfer_enabled, transfer_notes")
      .maybeSingle(),
    supabase
      .from("provider_transfer_profiles")
      .select("id, label, alias, cbu, extra_info, is_active")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: true }),
  ]);

  if (settingsError) {
    return { error: `No se pudieron cargar los métodos de pago: ${settingsError.message}` } as const;
  }

  if (profilesError) {
    return { error: `No se pudieron cargar las cuentas de transferencia: ${profilesError.message}` } as const;
  }

  return { settings: mapSettings({ settingsRow: settingsRow ?? undefined, profiles: profiles ?? [] }) } as const;
}

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
        transferNotes: "Envía el comprobante por WhatsApp o súbelo al armar el pedido.",
        transferProfiles: [
          {
            id: "demo-transfer-1",
            label: "Cuenta principal",
            alias: "ALIAS.DEMO",
            cbu: "0000000000000000000000",
            isActive: true,
          },
        ],
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

  const settingsResult = await fetchProviderSettings(provider.id);
  if ("error" in settingsResult) {
    return { success: false, errors: [settingsResult.error ?? "No se pudieron cargar los métodos de pago."] };
  }

  return {
    success: true,
    provider,
    settings: settingsResult.settings,
  };
}

export async function savePaymentSettings(
  payload: z.infer<typeof settingsSchema>,
): Promise<SavePaymentSettingsResult> {
  const parsed = settingsSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  const normalizedProfiles = (parsed.data.transferProfiles ?? []).map((profile) => {
    const alias = profile.alias?.trim() ?? "";
    const cbu = profile.cbu?.trim() ?? "";
    return {
      ...profile,
      id: profile.id,
      label: profile.label?.trim() || null,
      alias: alias.length ? alias : null,
      cbu: cbu.length ? cbu : null,
      extraInfo: profile.extraInfo?.trim() || null,
      isActive: profile.isActive !== false,
    };
  });

  const filteredProfiles = normalizedProfiles.filter((profile) => profile.alias || profile.cbu);
  const activeTransferProfiles = filteredProfiles.filter((profile) => profile.isActive);

  if (!parsed.data.cashEnabled && !parsed.data.transferEnabled) {
    return { success: false, errors: ["Debes habilitar al menos un método de pago."] };
  }

  if (parsed.data.transferEnabled && activeTransferProfiles.length === 0) {
    return { success: false, errors: ["Agrega al menos una cuenta de transferencia activa o desactiva el método."] };
  }

  if (parsed.data.providerSlug === "demo") {
    return {
      success: true,
      message: "Cambios guardados en modo demo.",
      settings: {
        cashEnabled: parsed.data.cashEnabled,
        transferEnabled: parsed.data.transferEnabled,
        transferNotes: parsed.data.transferNotes ?? null,
        transferProfiles: filteredProfiles.map((profile) => ({
          ...profile,
          id: profile.id ?? randomUUID(),
        })),
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
    transfer_alias: null,
    transfer_cbu: null,
    transfer_notes: parsed.data.transferNotes || null,
  };

  const [{ error: settingsError }, { data: existingProfiles, error: profilesQueryError }] = await Promise.all([
    supabase.from("provider_payment_settings").upsert(upsertPayload, { onConflict: "provider_id" }),
    supabase.from("provider_transfer_profiles").select("id").eq("provider_id", provider.id),
  ]);

  if (settingsError) {
    return { success: false, errors: [`No se pudieron guardar los cambios: ${settingsError.message}`] };
  }

  if (profilesQueryError) {
    return { success: false, errors: [`No se pudieron obtener las cuentas actuales: ${profilesQueryError.message}`] };
  }

  const existingIds = new Set((existingProfiles ?? []).map((profile) => profile.id));
  const normalizedWithIds = filteredProfiles.map((profile) => ({
    ...profile,
    id: profile.id ?? randomUUID(),
  }));

  const incomingIds = new Set(normalizedWithIds.map((profile) => profile.id));
  const idsToDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));

  const upsertRows = normalizedWithIds.map((profile) => ({
    id: profile.id,
    provider_id: provider.id,
    label: profile.label,
    alias: profile.alias,
    cbu: profile.cbu,
    extra_info: profile.extraInfo,
    is_active: profile.isActive,
  }));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("provider_transfer_profiles")
      .delete()
      .eq("provider_id", provider.id)
      .in("id", idsToDelete);

    if (deleteError) {
      return { success: false, errors: [`No se pudieron eliminar cuentas viejas: ${deleteError.message}`] };
    }
  }

  if (upsertRows.length > 0) {
    const { error: upsertError } = await supabase
      .from("provider_transfer_profiles")
      .upsert(upsertRows, { onConflict: "id" });

    if (upsertError) {
      return { success: false, errors: [`No se pudieron actualizar las cuentas: ${upsertError.message}`] };
    }
  } else if (parsed.data.transferEnabled) {
    return { success: false, errors: ["Agrega al menos una cuenta de transferencia activa o desactiva el método."] };
  }

  const settingsResult = await fetchProviderSettings(provider.id);
  if ("error" in settingsResult) {
    return { success: false, errors: [settingsResult.error ?? "No se pudieron cargar los métodos de pago."] };
  }

  return {
    success: true,
    message: "Métodos de pago actualizados.",
    settings: settingsResult.settings,
  };
}
