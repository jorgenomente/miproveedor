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
      setPasswordLink: string;
      message: string;
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
  created_at: string | null;
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

export type DeleteProviderResult =
  | { success: true; message: string }
  | { success: false; errors: string[] };

function getAppBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
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
    .select("id, name, slug, contact_email, contact_phone, address, cuit, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      success: false,
      errors: [`No se pudieron cargar los proveedores: ${error.message}`],
    };
  }

  return {
    success: true,
    providers: data ?? [],
  };
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
  const appBaseUrl = getAppBaseUrl();
  const callbackUrl = `${appBaseUrl}/auth/callback?next=${encodeURIComponent(`/app/${parsed.data.slug}`)}`;
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink(
    {
      type: "invite",
      email: parsed.data.email,
      options: {
        redirectTo: callbackUrl,
      },
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
