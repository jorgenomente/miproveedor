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
});

export type CreateProviderResult =
  | {
      success: true;
      providerId: string;
      userId: string;
      setPasswordLink: string;
      message: string;
    }
  | {
      success: false;
      errors: string[];
    };

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

  // 3) Crear usuario owner en Auth
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
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink(
    {
      type: "invite",
      email: parsed.data.email,
    }
  );

  const invitationLink = linkData?.properties?.action_link;

  if (linkError || !invitationLink) {
    return {
      success: false,
      errors: [
        `No se pudo generar link de invitación: ${
          linkError?.message ?? "sin detalle"
        }`,
      ],
    };
  }

  return {
    success: true,
    providerId: providerRow.id,
    userId: authUser.user.id,
    setPasswordLink: invitationLink,
    message: `Proveedor ${parsed.data.name} creado.`,
  };
}
