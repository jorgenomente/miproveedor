"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { persistAdminSelectedProviderSlug } from "@/app/app/actions/admin-provider";

type ProviderRole = "admin" | "provider";

type ProviderContextValue = {
  role: ProviderRole;
  providerSlug?: string;
  setProviderSlug: (slug: string, options?: { lock?: boolean }) => Promise<void>;
  isLocked: boolean;
};

const ProviderContext = createContext<ProviderContextValue | null>(null);

export function ProviderContextProvider({
  children,
  role,
  initialProviderSlug,
  locked: lockedProp,
}: {
  children: ReactNode;
  role: ProviderRole;
  initialProviderSlug?: string;
  locked?: boolean;
}) {
  const [providerSlug, setProviderSlugState] = useState<string>(initialProviderSlug ?? "");
  const [isLocked, setIsLocked] = useState<boolean>(lockedProp ?? role === "provider");

  useEffect(() => {
    if (initialProviderSlug && initialProviderSlug !== providerSlug) {
      setProviderSlugState(initialProviderSlug);
    }
  }, [initialProviderSlug, providerSlug]);

  const setProviderSlug = useCallback(
    async (slug: string, options?: { lock?: boolean }) => {
      setProviderSlugState(slug);
      if (typeof options?.lock === "boolean" && role !== "admin") {
        setIsLocked(options.lock);
      }
      if (role === "admin") {
        try {
          await persistAdminSelectedProviderSlug(slug);
        } catch (error) {
          console.error("No se pudo persistir el proveedor seleccionado", error);
        }
      }
    },
    [role],
  );

  const value = useMemo<ProviderContextValue>(
    () => ({
      role,
      providerSlug,
      setProviderSlug,
      isLocked,
    }),
    [role, providerSlug, setProviderSlug, isLocked],
  );

  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>;
}

export function useProviderContext() {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error("useProviderContext debe usarse dentro de ProviderContextProvider.");
  }
  return context;
}
