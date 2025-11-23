"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { getDemoData } from "@/lib/demo-data";
import { getProviderScope } from "@/lib/provider-scope";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const PAYMENT_PROOFS_BUCKET = "payment-proofs";
const MAX_PROOF_BYTES = 8 * 1024 * 1024;

const createSchema = z.object({
  providerSlug: z.string().min(2, "Proveedor requerido"),
  periodLabel: z.string().min(3, "Período requerido"),
  receiptBase64: z.string().min(10, "Archivo requerido"),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
});

export type PaymentRow = {
  id: string;
  provider_id: string;
  period_label: string;
  proof_url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string | null;
};

export type ProviderInfo = {
  id: string;
  name: string;
  slug: string;
  subscription_status?: "active" | "paused" | "canceled" | null;
  renews_at?: string | null;
};

export type ListPaymentsResult =
  | { success: true; provider: ProviderInfo; payments: PaymentRow[] }
  | { success: false; errors: string[] };

export type CreatePaymentResult =
  | { success: true; message: string; payment: PaymentRow }
  | { success: false; errors: string[] };

type DecodedFile =
  | { ok: true; buffer: Buffer; mimeType: string }
  | { ok: false; error: string };

function decodeBase64File(value: string, mimeTypeHint?: string): DecodedFile {
  const match = value.match(/^data:(.+);base64,(.*)$/);
  const cleanBase64 = match ? match[2] : value;
  const mimeType = match ? match[1] : mimeTypeHint ?? "application/octet-stream";

  try {
    const buffer = Buffer.from(cleanBase64, "base64");
    if (!buffer.byteLength) {
      return { ok: false, error: "El archivo parece vacío." };
    }
    return { ok: true, buffer, mimeType };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer el archivo.";
    return { ok: false, error: message };
  }
}

async function ensurePaymentBucketExists(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(PAYMENT_PROOFS_BUCKET);
  if (bucketData) return { ok: true as const };
  if (bucketError && !/not exist/i.test(bucketError.message)) {
    return { ok: false as const, error: `No se pudo validar el bucket: ${bucketError.message}` };
  }

  const { error: createError } = await supabase.storage.createBucket(PAYMENT_PROOFS_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_PROOF_BYTES}`,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
  });

  if (createError) {
    return { ok: false as const, error: `No se pudo preparar el bucket: ${createError.message}` };
  }

  return { ok: true as const };
}

export async function listPayments(providerSlug: string): Promise<ListPaymentsResult> {
  if (!providerSlug) {
    return { success: false, errors: ["Falta el slug del proveedor."] };
  }

  if (providerSlug === "demo") {
    const demo = getDemoData();
    const provider: ProviderInfo = {
      id: demo.provider.id,
      name: demo.provider.name,
      slug: demo.provider.slug,
      subscription_status: "active",
      renews_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const payments: PaymentRow[] = [
      {
        id: "demo-1",
        provider_id: provider.id,
        period_label: "Marzo 2024",
        proof_url: "https://placehold.co/600x400?text=Comprobante",
        status: "approved",
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "demo-2",
        provider_id: provider.id,
        period_label: "Abril 2024",
        proof_url: "https://placehold.co/600x400?text=Comprobante",
        status: "pending",
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return { success: true, provider, payments };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, name, slug, subscription_status, renews_at")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`No se encontró el proveedor: ${providerError?.message ?? "sin detalle"}`] };
  }

  const { data: payments, error: paymentsError } = await supabase
    .from("provider_payments")
    .select("id, provider_id, period_label, proof_url, status, created_at")
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (paymentsError) {
    return { success: false, errors: [`No se pudo cargar el historial: ${paymentsError.message}`] };
  }

  return {
    success: true,
    provider,
    payments: payments ?? [],
  };
}

export async function createPayment(
  payload: z.infer<typeof createSchema>,
): Promise<CreatePaymentResult> {
  if (payload.providerSlug === "demo") {
    const demo = getDemoData();
    const now = new Date().toISOString();
    return {
      success: true,
      message: "Modo demo: el comprobante no se guarda, pero simulamos el flujo.",
      payment: {
        id: `demo-${Date.now()}`,
        provider_id: demo.provider.id,
        period_label: payload.periodLabel,
        proof_url: "https://placehold.co/600x400?text=Comprobante",
        status: "pending",
        created_at: now,
      },
    };
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.issues.map((issue) => issue.message) };
  }

  const scopeResult = await getProviderScope();
  if (scopeResult.error) {
    return { success: false, errors: [scopeResult.error] };
  }

  if (scopeResult.scope?.role === "provider" && scopeResult.scope.provider.slug !== parsed.data.providerSlug) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, errors: ["Faltan credenciales de Supabase (SERVICE_ROLE / URL)."] };
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", parsed.data.providerSlug)
    .maybeSingle();

  if (providerError || !provider) {
    return { success: false, errors: [`No se encontró el proveedor: ${providerError?.message ?? "sin detalle"}`] };
  }

  const decoded = decodeBase64File(parsed.data.receiptBase64, parsed.data.mimeType);
  if (!decoded.ok) {
    return { success: false, errors: [decoded.error] };
  }

  if (decoded.buffer.byteLength > MAX_PROOF_BYTES) {
    return { success: false, errors: ["El archivo es muy pesado. Máximo 8MB."] };
  }

  const bucketResult = await ensurePaymentBucketExists(supabase);
  if (!bucketResult.ok) {
    return { success: false, errors: [bucketResult.error ?? "No se pudo preparar el bucket de comprobantes."] };
  }

  const extensionFromName = parsed.data.fileName?.split(".").pop();
  const extension =
    extensionFromName && extensionFromName.length < 8
      ? extensionFromName
      : decoded.mimeType.split("/")[1] ?? "dat";

  const objectPath = `${provider.slug}/payments/${Date.now()}-${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(PAYMENT_PROOFS_BUCKET)
    .upload(objectPath, decoded.buffer, {
      contentType: decoded.mimeType,
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { success: false, errors: [`No se pudo subir el comprobante: ${uploadError.message}`] };
  }

  const { data: urlData } = supabase.storage.from(PAYMENT_PROOFS_BUCKET).getPublicUrl(objectPath);
  if (!urlData?.publicUrl) {
    return { success: false, errors: ["El comprobante se subió pero no pudimos obtener la URL pública."] };
  }

  const { data: insertData, error: insertError } = await supabase
    .from("provider_payments")
    .insert({
      provider_id: provider.id,
      period_label: parsed.data.periodLabel,
      proof_url: urlData.publicUrl,
      status: "pending",
    })
    .select("id, provider_id, period_label, proof_url, status, created_at")
    .single();

  if (insertError || !insertData?.id) {
    return { success: false, errors: [`No se pudo registrar el pago: ${insertError?.message ?? "sin detalle"}`] };
  }

  return {
    success: true,
    message: "Pago registrado. El equipo de MiProveedor lo revisará.",
    payment: insertData,
  };
}
