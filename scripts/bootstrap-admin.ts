import { createClient, type UserResponse } from "@supabase/supabase-js";

type BootstrapOptions = {
  adminEmail: string;
  adminName?: string;
  resetProviders: boolean;
  dryRun: boolean;
};

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  }

  return { url, serviceKey };
}

async function findAuthUserByEmail(
  client: any,
  email: string,
): Promise<UserResponse["data"]["user"] | null> {
  // listUsers es paginado; aquí asumimos base chica.
  const pageSize = 200;
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) throw error;

    const found = data.users.find(
      (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (found) return found;

    if (data.users.length < pageSize) break;
    page += 1;
  }

  return null;
}

async function purgeProviderData(
  client: any,
  dryRun: boolean,
  logPrefix = "",
) {
  const { data: providers, error: providersError } = await client
    .from("providers")
    .select("id, name");

  if (providersError) throw new Error(`No se pudieron listar proveedores: ${providersError.message}`);
  const providerRows = (providers ?? []) as { id: string; name?: string }[];

  if (providerRows.length === 0) {
    console.log(`${logPrefix}No hay proveedores para eliminar.`);
    return;
  }

  console.log(`${logPrefix}Eliminando datos de ${providerRows.length} proveedor(es)...`);

  for (const provider of providerRows) {
    if (!provider.id) continue;

    const providerLabel = `${logPrefix}[${provider.name ?? provider.id}] `;

    // 1) Orders -> order_items
    const { data: orders, error: ordersError } = await client
      .from("orders")
      .select("id")
      .eq("provider_id", provider.id);
    if (ordersError) throw new Error(`${providerLabel}No se pudieron leer pedidos: ${ordersError.message}`);

    const orderRows = (orders ?? []) as { id?: string }[];
    const orderIds = orderRows.map((o) => o.id).filter(Boolean) as string[];
    if (orderIds.length > 0) {
      console.log(`${providerLabel}Borrando ${orderIds.length} pedidos + items`);
      if (!dryRun) {
        const { error: deleteItemsError } = await client.from("order_items").delete().in("order_id", orderIds);
        if (deleteItemsError) {
          throw new Error(`${providerLabel}No se pudieron borrar items: ${deleteItemsError.message}`);
        }
        const { error: deleteOrdersError } = await client.from("orders").delete().in("id", orderIds);
        if (deleteOrdersError) {
          throw new Error(`${providerLabel}No se pudieron borrar pedidos: ${deleteOrdersError.message}`);
        }
      }
    }

    // 2) Products
    console.log(`${providerLabel}Borrando productos`);
    if (!dryRun) {
      const { error: deleteProductsError } = await client.from("products").delete().eq("provider_id", provider.id);
      if (deleteProductsError) {
        throw new Error(`${providerLabel}No se pudieron borrar productos: ${deleteProductsError.message}`);
      }
    }

    // 3) Clients
    console.log(`${providerLabel}Borrando clientes`);
    if (!dryRun) {
      const { error: deleteClientsError } = await client.from("clients").delete().eq("provider_id", provider.id);
      if (deleteClientsError) {
        throw new Error(`${providerLabel}No se pudieron borrar clientes: ${deleteClientsError.message}`);
      }
    }

    // 4) Users vinculados (tabla + Auth)
    const { data: users, error: usersError } = await client
      .from("users")
      .select("id, email")
      .eq("provider_id", provider.id);
    if (usersError) throw new Error(`${providerLabel}No se pudieron leer usuarios: ${usersError.message}`);

    const userRows = (users ?? []) as { id?: string; email?: string }[];

    if (userRows.length > 0) {
      console.log(`${providerLabel}Borrando ${userRows.length} usuario(s) de Auth y tabla users`);
      if (!dryRun) {
        for (const user of userRows) {
          if (user.id) {
            await client.auth.admin.deleteUser(user.id).catch((err: any) => {
              console.warn(`${providerLabel}No se pudo borrar usuario Auth ${user.email ?? user.id}: ${err.message}`);
            });
          }
        }
        const { error: deleteUsersError } = await client.from("users").delete().eq("provider_id", provider.id);
        if (deleteUsersError) {
          throw new Error(`${providerLabel}No se pudieron borrar usuarios tabla: ${deleteUsersError.message}`);
        }
      }
    }

    // 5) Provider
    console.log(`${providerLabel}Borrando proveedor`);
    if (!dryRun) {
      const { error: deleteProviderError } = await client.from("providers").delete().eq("id", provider.id);
      if (deleteProviderError) {
        throw new Error(`${providerLabel}No se pudo borrar el proveedor: ${deleteProviderError.message}`);
      }
    }
  }
}

async function ensureAdminUser(
  client: any,
  email: string,
  name?: string,
  dryRun?: boolean,
) {
  const baseUrl = getBaseUrl();
  const redirectTo = `${baseUrl}/auth/callback?next=/app`;

  const existingAuth = await findAuthUserByEmail(client, email);
  let authUserId = existingAuth?.id;
  let linkType: "invite" | "recovery" = "invite";

  if (existingAuth) {
    linkType = "recovery";
    console.log(`Usuario Auth ya existe para ${email} (id ${existingAuth.id}), genero link de recovery.`);
  } else {
    console.log(`Creando usuario Auth para ${email}...`);
    if (!dryRun) {
      const { data, error } = await client.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role: "admin" },
      });
      if (error || !data?.user?.id) {
        // Si ya existe, intentamos recuperarlo y usar recovery link.
        if (error?.message?.toLowerCase().includes("already been registered")) {
          const existing = await findAuthUserByEmail(client, email);
          if (existing?.id) {
            console.log(`El usuario ya existía (id ${existing.id}), uso recovery link.`);
            linkType = "recovery";
            authUserId = existing.id;
          } else {
            throw new Error(
              `El usuario ya estaba registrado pero no se pudo obtener su id: ${error.message}`,
            );
          }
        } else {
          throw new Error(`No se pudo crear usuario Auth: ${error?.message ?? "sin detalle"}`);
        }
      } else {
        authUserId = data.user.id;
      }
    } else {
      authUserId = "dry-run-user-id";
    }
  }

  if (!authUserId) throw new Error("No se resolvió user id de Auth.");

  // Upsert en tabla users
  console.log("Upserting en tabla users (role=admin)...");
  if (!dryRun) {
    // Si hay un registro con el mismo email pero distinto id, lo eliminamos para evitar duplicado.
    const { data: existingRowRaw, error: existingError } = await client
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingError) {
      throw new Error(`No se pudo verificar usuarios existentes: ${existingError.message}`);
    }
    const existingRow = (existingRowRaw ?? null) as { id?: string } | null;
    if (existingRow?.id && existingRow.id !== authUserId) {
      console.log(`Eliminando fila previa en users con email ${email} (id ${existingRow.id})...`);
      const { error: deleteError } = await client.from("users").delete().eq("id", existingRow.id);
      if (deleteError) {
        throw new Error(`No se pudo borrar la fila antigua en users: ${deleteError.message}`);
      }
    }

    const { error: userError } = await client
      .from("users" as unknown as any)
      .upsert(
        {
          id: authUserId,
          email,
          name: name ?? null,
          role: "admin",
          provider_id: null,
        } as any,
        { onConflict: "id" },
      );
    if (userError) throw new Error(`No se pudo upsert en users: ${userError.message}`);
  }

  console.log(`Generando link ${linkType === "invite" ? "de invitación" : "de recovery"}...`);
  const { data: linkData, error: linkError } = await client.auth.admin.generateLink({
    type: linkType,
    email,
    options: { redirectTo },
  });

  if (linkError || !linkData?.properties?.action_link) {
    throw new Error(`No se pudo generar link: ${linkError?.message ?? "sin detalle"}`);
  }

  return { actionLink: linkData.properties.action_link, authUserId };
}

async function main() {
  const { url, serviceKey } = getEnv();
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName = process.env.ADMIN_NAME;
  const resetProviders = process.argv.includes("--reset-providers");
  const dryRun = process.argv.includes("--dry-run");

  if (!adminEmail) {
    console.error("Falta ADMIN_EMAIL en el entorno.");
    process.exit(1);
  }

  const options: BootstrapOptions = {
    adminEmail,
    adminName: adminName ?? undefined,
    resetProviders,
    dryRun,
  };

  console.log("=== Bootstrap admin MiProveedor ===");
  console.log(`Admin email: ${options.adminEmail}`);
  console.log(`Admin name: ${options.adminName ?? "(sin nombre)"}`);
  console.log(`Reset proveedores: ${options.resetProviders ? "Sí" : "No"}`);
  console.log(`Dry run: ${options.dryRun ? "Sí" : "No"}`);

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (options.resetProviders) {
    await purgeProviderData(supabase, options.dryRun, "[reset] ");
  }

  const { actionLink, authUserId } = await ensureAdminUser(
    supabase,
    options.adminEmail,
    options.adminName,
    options.dryRun,
  );

  console.log("Listo ✅");
  console.log(`Auth user id: ${authUserId}`);
  console.log("Usa este link para setear/recuperar contraseña:");
  console.log(actionLink);
}

main().catch((err) => {
  console.error("Error en bootstrap:", err.message);
  process.exit(1);
});
