"use server";

import { randomUUID } from "crypto";
import { getProviderScope } from "@/lib/provider-scope";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_BYTES = 900 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export async function uploadPaymentProof({
  providerSlug,
  orderId,
  fileName,
  contentType,
  base64,
}: {
  providerSlug: string;
  orderId: string;
  fileName: string;
  contentType: string;
  base64: string;
}): Promise<{ success: true; url: string } | { success: false; errors: string[] }> {
  if (!providerSlug || !orderId) return { success: false, errors: ["Faltan datos para subir el comprobante."] };
  if (!ALLOWED_TYPES.includes(contentType)) {
    return { success: false, errors: ["Formato no permitido. Usa JPG/PNG/WEBP."] };
  }
  if (!base64) return { success: false, errors: ["No se recibió la imagen."] };

  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength > MAX_BYTES) {
    return { success: false, errors: ["La imagen supera 900KB."] };
  }

  const scope = await getProviderScope();
  if (!scope.scope) return { success: false, errors: ["Sesión no encontrada."] };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, errors: ["Faltan credenciales de Supabase."] };

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("slug", providerSlug)
    .maybeSingle();

  if (providerError || !provider?.id) {
    return { success: false, errors: [`Proveedor no encontrado: ${providerError?.message ?? "sin datos"}`] };
  }

  if (scope.scope.role === "provider" && scope.scope.provider.id !== provider.id) {
    return { success: false, errors: ["No tienes acceso a este proveedor."] };
  }

  const bucket = process.env.ORDER_PAYMENT_PROOFS_BUCKET ?? "order-payment-proofs";
  const extension = fileName.split(".").pop() || "jpg";
  const key = `${providerSlug}/${orderId}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(key, buffer, {
    contentType,
    upsert: true,
  });

  if (uploadError) {
    return { success: false, errors: [`No se pudo subir el comprobante: ${uploadError.message}`] };
  }

  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(key);
  if (!publicUrl?.publicUrl) {
    return { success: false, errors: ["No se pudo obtener el link público del comprobante."] };
  }

  return { success: true, url: publicUrl.publicUrl };
}
