"use server";

import { cookies } from "next/headers";

import { getProviderScope } from "@/lib/provider-scope";

const COOKIE_NAME = "mp-admin-provider";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export async function getAdminSelectedProviderSlug(): Promise<string | null> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(COOKIE_NAME)?.value?.trim();
  return stored ? stored : null;
}

export async function persistAdminSelectedProviderSlug(slug: string | null): Promise<{
  success: boolean;
  providerSlug?: string;
  errors?: string[];
}> {
  const scopeResult = await getProviderScope();
  const scope = scopeResult.scope;

  if (!scope) {
    return { success: false, errors: [scopeResult.error ?? "Sesión no encontrada."] };
  }

  if (scope.role !== "admin") {
    return { success: false, errors: ["Solo los administradores pueden cambiar de proveedor."] };
  }

  const cookieStore = await cookies();

  if (slug) {
    cookieStore.set({
      name: COOKIE_NAME,
      value: slug,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  } else {
    cookieStore.set({
      name: COOKIE_NAME,
      value: "",
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return { success: true, providerSlug: slug ?? "" };
}
