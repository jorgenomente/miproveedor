"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState, useTransition, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock3,
  Eye,
  FileUp,
  Download,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Wallet,
  ChevronDown,
  Trash2,
  FileText,
  LayoutGrid,
  Table as TableIcon,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/whatsapp";
import { listProviders, type ProviderRow } from "../orders/actions";
import {
  getClientAccounts,
  markOrderProofStatus,
  recordClientPayment,
  updateOrderStatus,
  deleteOrder,
  type AccountOrder,
  type AccountPayment,
  type ClientAccount,
} from "./actions";

export type AccountsPageProps = { initialProviderSlug?: string };

const orderStatusTone: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-700",
  preparando: "bg-amber-100 text-amber-800",
  enviado: "bg-sky-100 text-sky-700",
  entregado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-rose-100 text-rose-700",
};

const shortId = (id: string) => (id?.length > 8 ? id.slice(0, 8) : id);

const proofLabel: Record<string, { label: string; tone: string }> = {
  no_aplica: { label: "No aplica", tone: "bg-slate-100 text-slate-700" },
  pendiente: { label: "Comprobante pendiente", tone: "bg-amber-100 text-amber-800" },
  subido: { label: "Comprobante subido", tone: "bg-blue-100 text-blue-800" },
  verificado: { label: "Comprobante verificado", tone: "bg-emerald-100 text-emerald-800" },
};

function OrderRow({
  order,
  payments,
  onConfirmCash,
  onVerifyTransfer,
  isProcessing,
  onChangeStatus,
  isStatusUpdating,
  onDelete,
  isDeleting,
}: {
  order: AccountOrder;
  payments: AccountPayment[];
  onConfirmCash: (order: AccountOrder) => void;
  onVerifyTransfer: (order: AccountOrder) => void;
  isProcessing?: boolean;
  onChangeStatus: (order: AccountOrder, status: AccountOrder["status"]) => void;
  isStatusUpdating?: boolean;
  onDelete: (order: AccountOrder) => void;
  isDeleting?: boolean;
}) {
  const approvedPayment = payments.find((payment) => payment.orderId === order.id && payment.status === "approved");
  const hasApprovedTransfer = payments.some(
    (payment) => payment.orderId === order.id && payment.status === "approved" && payment.method === "transferencia",
  );
  const cashReceived = approvedPayment?.method === "efectivo";
  const transferVerified = order.paymentProofStatus === "verificado" || (order.paymentProofStatus === "subido" && hasApprovedTransfer);
  const proofInfo = transferVerified
    ? proofLabel.verificado
    : proofLabel[order.paymentProofStatus ?? "no_aplica"] ?? proofLabel.no_aplica;
  const orderStatuses: AccountOrder["status"][] = ["nuevo", "preparando", "enviado", "entregado", "cancelado"];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-muted/40 bg-white/60 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span>Pedido #{shortId(order.id)}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                    orderStatusTone[order.status] ?? "bg-muted text-foreground"
                  } ${isProcessing || isStatusUpdating ? "opacity-70" : "hover:brightness-95"}`}
                  disabled={isProcessing || isStatusUpdating}
                >
                  {order.status}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={6} className="w-44">
                {orderStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => onChangeStatus(order, status)}
                    disabled={isProcessing || isStatusUpdating || status === order.status}
                    className="flex items-center justify-between text-sm capitalize"
                  >
                    <span className="capitalize">{status}</span>
                    <span className={`h-2 w-2 rounded-full ${orderStatusTone[status] ?? "bg-muted"} opacity-80`} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {order.paymentMethod ? (
              <Badge variant="outline" className="gap-1">
                <Wallet className="h-3.5 w-3.5" />
                {order.paymentMethod === "efectivo" ? "Efectivo" : "Transferencia"}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Sin fecha"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right text-sm font-semibold">{formatCurrency(order.total)}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-destructive hover:bg-destructive/10"
                disabled={isProcessing || isStatusUpdating || isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>Archivar pedido</AlertDialogTitle>
              <AlertDialogDescription>
                El pedido se moverá a Pedidos eliminados en Configuración. Podrás restaurarlo más adelante.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => onDelete(order)}
                  disabled={isProcessing || isStatusUpdating || isDeleting}
                >
                Archivar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {order.paymentMethod === "efectivo" ? (
            <>
              <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-800">
                <Banknote className="h-3.5 w-3.5" />
                Efectivo
              </Badge>
              <Button
                size="sm"
                variant={cashReceived ? "secondary" : "outline"}
                className={`h-8 gap-2 ${cashReceived ? "bg-emerald-50 text-emerald-800" : ""}`}
                disabled={cashReceived || isProcessing}
                onClick={() => onConfirmCash(order)}
              >
                <CheckCircle2 className="h-4 w-4" />
                {cashReceived ? "Efectivo recibido" : "Marcar efectivo recibido"}
              </Button>
            </>
          ) : null}

          {order.paymentMethod === "transferencia" ? (
            <>
              <Badge variant="outline" className={`gap-1 ${proofInfo.tone}`}>
                <FileUp className="h-3.5 w-3.5" />
                {proofInfo.label}
              </Badge>
              {order.paymentProofUrl ? (
                <Button asChild size="sm" variant="ghost" className="h-8 gap-1 text-xs">
                  <a href={order.paymentProofUrl} target="_blank" rel="noreferrer">
                    <Eye className="h-4 w-4" />
                    Ver comprobante
                  </a>
                </Button>
              ) : null}
              <Button
                size="sm"
                variant={transferVerified ? "secondary" : "outline"}
                className={`h-8 gap-2 ${transferVerified ? "bg-emerald-50 text-emerald-800" : ""}`}
                disabled={isProcessing}
                onClick={() => onVerifyTransfer(order)}
              >
                <ShieldCheck className="h-4 w-4" />
                {transferVerified ? "Desmarcar" : "Comprobante verificado"}
              </Button>
            </>
          ) : null}
        </div>
      </div>

    </div>
  );
}

export function AccountsClient({ initialProviderSlug }: AccountsPageProps) {
  const searchParams = useSearchParams();
  const providerQuery = searchParams?.get("provider") ?? null;
  const lockedProvider = Boolean(initialProviderSlug || providerQuery);
  const [providerSlug, setProviderSlug] = useState(initialProviderSlug ?? providerQuery ?? "");
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [markingOrderId, setMarkingOrderId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [archivingOrderId, setArchivingOrderId] = useState<string | null>(null);
  const [accountsPanelOpen, setAccountsPanelOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [summaryAccount, setSummaryAccount] = useState<ClientAccount | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [downloadingSummary, setDownloadingSummary] = useState(false);

  const filteredAccounts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return accounts;
    return accounts.filter((account) => account.client.name.toLowerCase().includes(term));
  }, [accounts, searchTerm]);

  const selectedAccount = useMemo(() => {
    if (!filteredAccounts.length) return null;
    return filteredAccounts.find((account) => account.client.id === selectedClientId) ?? filteredAccounts[0];
  }, [filteredAccounts, selectedClientId]);

  const summary = useMemo(() => {
    const totals = filteredAccounts.reduce(
      (acc, account) => {
        return {
          pending: acc.pending + account.totals.pending,
          paid: acc.paid + account.totals.paid,
          orders: acc.orders + account.totals.ordersCount,
        };
      },
      { pending: 0, paid: 0, orders: 0 },
    );
    return totals;
  }, [filteredAccounts]);
  const isOrderConfirmed = useCallback(
    (order: AccountOrder, payments: AccountPayment[]) => {
      const hasApprovedCash = payments.some(
        (payment) => payment.orderId === order.id && payment.status === "approved" && payment.method === "efectivo",
      );
      const hasApprovedTransfer = payments.some(
        (payment) => payment.orderId === order.id && payment.status === "approved" && payment.method === "transferencia",
      );
      const proofVerified =
        order.paymentProofStatus === "verificado" || (order.paymentProofStatus === "subido" && hasApprovedTransfer);
      const cashReceived = order.paymentMethod === "efectivo" && hasApprovedCash;
      return order.status === "entregado" && (proofVerified || cashReceived);
    },
    [],
  );

  const confirmedOrders = useMemo(() => {
    if (!selectedAccount) return [];
    return selectedAccount.orders.filter((order) => isOrderConfirmed(order, selectedAccount.payments));
  }, [isOrderConfirmed, selectedAccount]);

  const pendingOrders = useMemo(() => {
    if (!selectedAccount) return [];
    return selectedAccount.orders.filter((order) => !isOrderConfirmed(order, selectedAccount.payments));
  }, [isOrderConfirmed, selectedAccount]);

  const summaryCompletedOrders = useMemo(() => {
    if (!summaryAccount) return [];
    return summaryAccount.orders.filter((order) => isOrderConfirmed(order, summaryAccount.payments));
  }, [isOrderConfirmed, summaryAccount]);

  const summaryPendingOrders = useMemo(() => {
    if (!summaryAccount) return [];
    return summaryAccount.orders.filter((order) => !isOrderConfirmed(order, summaryAccount.payments));
  }, [isOrderConfirmed, summaryAccount]);

  const summaryTotals = useMemo(
    () => ({
      completed: summaryCompletedOrders.reduce((acc, order) => acc + order.total, 0),
      pending: summaryPendingOrders.reduce((acc, order) => acc + order.total, 0),
    }),
    [summaryCompletedOrders, summaryPendingOrders],
  );

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, clientId: string) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setSelectedClientId(clientId);
      }
    },
    [],
  );

  const openSummaryForAccount = useCallback((account: ClientAccount) => {
    setSelectedClientId(account.client.id);
    setSummaryAccount(account);
    setSummaryOpen(true);
  }, []);

  const handleDownloadSummary = useCallback(async () => {
    if (!providerSlug || !summaryAccount) return;
    try {
      setDownloadingSummary(true);
      const params = new URLSearchParams({ provider: providerSlug, clientId: summaryAccount.client.id });
      const response = await fetch(`/app/accounts/summary?${params.toString()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "No se pudo generar el PDF." }));
        throw new Error(payload.error ?? "No se pudo generar el PDF.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resumen-${summaryAccount.client.slug ?? "cliente"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError((err as Error).message ?? "No se pudo descargar el resumen.");
    } finally {
      setDownloadingSummary(false);
    }
  }, [providerSlug, summaryAccount]);

  const loadProviders = useCallback(async () => {
    const response = await listProviders();
    if (response.success) {
      setProviders(response.providers);
      if (!providerSlug && response.providers.length > 0) {
        setProviderSlug(response.providers[0].slug);
      }
    } else {
      setError(response.errors.join("\n"));
    }
  }, [providerSlug]);

  const loadAccounts = useCallback(
    async (slug: string) => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      const response = await getClientAccounts(slug);
      if (response.success) {
        setAccounts(response.accounts);
        if (!selectedClientId && response.accounts.length > 0) {
          setSelectedClientId(response.accounts[0].client.id);
        }
      } else {
        setError(response.errors.join("\n"));
      }
      setLoading(false);
    },
    [selectedClientId],
  );

  useEffect(() => {
    if (!lockedProvider) {
      void loadProviders();
    }
  }, [lockedProvider, loadProviders]);

  useEffect(() => {
    if (providerSlug) {
      void loadAccounts(providerSlug);
    }
  }, [providerSlug, loadAccounts]);

  useEffect(() => {
    setSelectedClientId(null);
  }, [providerSlug]);

  const confirmCashPayment = useCallback(
    async (order: AccountOrder) => {
      if (!providerSlug || !selectedAccount) return;
      try {
        setMarkingOrderId(order.id);
        const response = await recordClientPayment({
          providerSlug,
          clientId: selectedAccount.client.id,
          orderId: order.id,
          amount: order.total,
          method: "efectivo",
          status: "approved",
          reference: `Efectivo pedido #${shortId(order.id)}`,
          note: null,
          paidAt: new Date().toISOString(),
        });
        if (!response.success) {
          setError(response.errors.join("\n"));
          return;
        }
        await loadAccounts(providerSlug);
      } finally {
        setMarkingOrderId(null);
      }
    },
    [loadAccounts, providerSlug, selectedAccount],
  );

  const verifyTransferPayment = useCallback(
    async (order: AccountOrder) => {
      if (!providerSlug || !selectedAccount) return;
      const hasApprovedTransfer = selectedAccount.payments.some(
        (payment) => payment.orderId === order.id && payment.status === "approved" && payment.method === "transferencia",
      );
      try {
        setMarkingOrderId(order.id);
        const transferCurrentlyVerified =
          order.paymentProofStatus === "verificado" || (order.paymentProofStatus === "subido" && hasApprovedTransfer);
        const nextStatus = transferCurrentlyVerified ? "pendiente" : "verificado";
        const response = await markOrderProofStatus({
          providerSlug,
          orderId: order.id,
          status: nextStatus,
        });
        if (!response.success) {
          setError(response.errors.join("\n"));
          return;
        }
        if (nextStatus === "verificado" && !hasApprovedTransfer) {
          const paymentResponse = await recordClientPayment({
            providerSlug,
            clientId: selectedAccount.client.id,
            orderId: order.id,
            amount: order.total,
            method: "transferencia",
            status: "approved",
            reference: `Transferencia verificada #${shortId(order.id)}`,
            note: null,
            paidAt: new Date().toISOString(),
          });
          if (!paymentResponse.success) {
            setError(paymentResponse.errors.join("\n"));
            return;
          }
        }
        await loadAccounts(providerSlug);
      } finally {
        setMarkingOrderId(null);
      }
    },
    [loadAccounts, providerSlug, selectedAccount],
  );

  const handleUpdateOrderStatus = useCallback(
    async (order: AccountOrder, status: AccountOrder["status"]) => {
      if (!providerSlug) return;
      try {
        setStatusUpdatingId(order.id);
        const response = await updateOrderStatus({ providerSlug, orderId: order.id, status });
        if (!response.success) {
          setError(response.errors.join("\n"));
          return;
        }
        await loadAccounts(providerSlug);
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [loadAccounts, providerSlug],
  );

  const handleDeleteOrder = useCallback(
    async (order: AccountOrder) => {
      if (!providerSlug) return;
      try {
        setArchivingOrderId(order.id);
        const response = await deleteOrder({ providerSlug, orderId: order.id });
        if (!response.success) {
          setError(response.errors.join("\n"));
          return;
        }
        await loadAccounts(providerSlug);
      } finally {
        setArchivingOrderId(null);
      }
    },
    [loadAccounts, providerSlug],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link href={providerSlug ? `/app/${providerSlug}` : "/app"}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
          <span>/</span>
          <Badge variant="secondary">Cuentas</Badge>
        </div>
        <div className="flex items-center gap-2">
          {!lockedProvider ? (
            <Select value={providerSlug} onValueChange={(value) => setProviderSlug(value)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Proveedor" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.slug}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (providerSlug) void loadAccounts(providerSlug);
            }}
            disabled={loading}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <Card className="border-[color:var(--neutral-200)] bg-white/80 shadow-sm">
        <Collapsible open={accountsPanelOpen} onOpenChange={setAccountsPanelOpen}>
          <CardHeader className="flex flex-col gap-4">
            <CollapsibleTrigger asChild>
              <motion.button
                type="button"
                aria-expanded={accountsPanelOpen}
                className="group flex w-full flex-col gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-muted/60 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:flex-row md:items-center md:justify-between"
                whileTap={{ scale: 0.99 }}
              >
                <div className="space-y-1">
                  <CardTitle className="text-lg">Cuentas por cobrar</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Controla pedidos, pagos recibidos y saldos pendientes por cada cliente.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    {formatCurrency(summary.paid)}
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 shadow-sm">
                    <Clock3 className="h-4 w-4" />
                    Pendiente {formatCurrency(summary.pending)}
                  </div>
                  <motion.span
                    aria-hidden
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-slate-200"
                    animate={{ rotate: accountsPanelOpen ? 0 : -90 }}
                    transition={{ type: "spring", stiffness: 200, damping: 16 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </div>
              </motion.button>
            </CollapsibleTrigger>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar tienda"
                    className="w-[220px] pl-9"
                    aria-label="Buscar tienda"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Vista</span>
                  <div className="flex items-center gap-1 rounded-full border border-muted/40 bg-white/80 p-1 shadow-inner">
                    <Button
                      type="button"
                      size="sm"
                      variant={viewMode === "cards" ? "secondary" : "ghost"}
                      className={`h-8 gap-2 ${viewMode === "cards" ? "shadow-sm" : ""}`}
                      onClick={() => setViewMode("cards")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Tarjetas
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={viewMode === "table" ? "secondary" : "ghost"}
                      className={`h-8 gap-2 ${viewMode === "table" ? "shadow-sm" : ""}`}
                      onClick={() => setViewMode("table")}
                    >
                      <TableIcon className="h-4 w-4" />
                      Tabla
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent asChild>
            <CardContent className="space-y-4">
              {error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
              {loading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {viewMode === "cards" ? (
                    <motion.div
                      key="cards-view"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.16 }}
                      className="grid gap-3 md:grid-cols-2"
                    >
                      {filteredAccounts.map((account, index) => {
                        const isActive = selectedAccount?.client.id === account.client.id;
                        const highlight = account.totals.pending > 0 ? "border-amber-300 shadow-[0_10px_40px_-24px_rgba(251,191,36,0.8)]" : "border-slate-200";
                        return (
                          <motion.div
                            key={account.client.id}
                            layout
                            onClick={() => setSelectedClientId(account.client.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => handleCardKeyDown(event, account.client.id)}
                            className={`flex flex-col items-start rounded-xl border ${highlight} bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            whileHover={{ y: -2 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <div className="flex w-full items-start justify-between gap-3">
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Cliente</p>
                                <h3 className="text-base font-semibold leading-tight">{account.client.name}</h3>
                                <p className="text-xs text-muted-foreground">{account.client.contactName ?? "Sin contacto"}</p>
                              </div>
                              <Badge variant="secondary" className={isActive ? "bg-primary/10 text-primary" : ""}>
                                {account.totals.ordersCount} pedido(s)
                              </Badge>
                            </div>
                            <div className="mt-3 grid w-full grid-cols-2 gap-3">
                              <div className="rounded-lg bg-slate-50 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500">Pendiente</p>
                                <p className="text-sm font-semibold text-slate-900">{formatCurrency(account.totals.pending)}</p>
                              </div>
                              <div className="rounded-lg bg-emerald-50 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wide text-emerald-600">Pagado</p>
                                <p className="text-sm font-semibold text-emerald-800">{formatCurrency(account.totals.paid)}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex w-full items-center justify-between gap-2">
                              <div className="text-xs text-muted-foreground">Actualizado automáticamente con cada pedido.</div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-2"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openSummaryForAccount(account);
                                }}
                              >
                                <FileText className="h-4 w-4" />
                                Obtener resumen
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="table-view"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden rounded-xl border border-muted/50 bg-white"
                    >
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cliente</TableHead>
                              <TableHead className="text-center">Pedidos</TableHead>
                              <TableHead className="text-right">Pendiente</TableHead>
                              <TableHead className="text-right">Pagado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAccounts.map((account) => {
                              const isActive = selectedAccount?.client.id === account.client.id;
                              return (
                                <TableRow
                                  key={account.client.id}
                                  className={`cursor-pointer transition hover:bg-muted/60 ${isActive ? "bg-primary/5" : ""}`}
                                  onClick={() => setSelectedClientId(account.client.id)}
                                  tabIndex={0}
                                  onKeyDown={(event) => handleCardKeyDown(event, account.client.id)}
                                >
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-semibold leading-tight">{account.client.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {account.client.contactName ?? "Sin contacto"}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center text-sm">
                                    <Badge variant="secondary" className="bg-slate-100 text-foreground">
                                      {account.totals.ordersCount}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-semibold text-amber-800">
                                    {formatCurrency(account.totals.pending)}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-semibold text-emerald-700">
                                    {formatCurrency(account.totals.paid)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 gap-1"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setSelectedClientId(account.client.id);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                        Ver
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-2"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          openSummaryForAccount(account);
                                        }}
                                      >
                                        <FileText className="h-4 w-4" />
                                        Resumen
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {selectedAccount ? (
        <motion.div
          layout
          className="rounded-2xl border border-[color:var(--neutral-200)] bg-white shadow-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <motion.button
            type="button"
            onClick={() => setDetailsOpen((prev) => !prev)}
            aria-expanded={detailsOpen}
            className="group flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-4 text-left transition hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 md:px-6"
            whileTap={{ scale: 0.99 }}
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Detalle</p>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold leading-tight">{selectedAccount.client.name}</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:text-sm">
                  {selectedAccount.client.contactName ? <span>{selectedAccount.client.contactName}</span> : null}
                  {selectedAccount.client.contactPhone ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 md:text-xs">
                      {selectedAccount.client.contactPhone}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-amber-50 text-amber-800">
                  Pendiente {formatCurrency(selectedAccount.totals.pending)}
                </Badge>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-800">
                  Pagado {formatCurrency(selectedAccount.totals.paid)}
                </Badge>
              </div>
              <motion.span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-slate-200"
                animate={{ rotate: detailsOpen ? 0 : -90 }}
                transition={{ type: "spring", stiffness: 180, damping: 12 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </div>
          </motion.button>
          <AnimatePresence initial={false}>
            {detailsOpen ? (
              <motion.div
                key="account-body"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 140, damping: 18 }}
                className="overflow-hidden"
              >
                <div className="space-y-6 p-4 md:p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <ShoppingBag className="h-4 w-4 text-[color:var(--brand-deep)]" />
                        Pedidos
                      </div>
                      <Badge variant="outline" className="bg-slate-50">
                        Último{" "}
                        {selectedAccount.totals.lastOrderAt ? new Date(selectedAccount.totals.lastOrderAt).toLocaleDateString() : "—"}
                      </Badge>
                    </div>
                    <Accordion type="multiple" defaultValue={["pending-orders"]} className="space-y-3">
                      <AccordionItem value="pending-orders" className="overflow-hidden rounded-xl border border-(--neutral-200) bg-white">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <div className="flex w-full items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <Clock3 className="h-4 w-4 text-amber-700" />
                              Cobros por confirmar
                            </div>
                            <Badge variant="outline">{pendingOrders.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          {pendingOrders.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
                              Sin cobros por confirmar.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {pendingOrders.map((order) => (
                              <OrderRow
                                key={order.id}
                                order={order}
                                payments={selectedAccount.payments}
                                onConfirmCash={confirmCashPayment}
                                onVerifyTransfer={verifyTransferPayment}
                                isProcessing={markingOrderId === order.id || saving}
                                onChangeStatus={handleUpdateOrderStatus}
                                isStatusUpdating={statusUpdatingId === order.id}
                                onDelete={handleDeleteOrder}
                                isDeleting={archivingOrderId === order.id}
                              />
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="confirmed-orders" className="overflow-hidden rounded-xl border border-(--neutral-200) bg-white">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <div className="flex w-full items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                              Pedidos confirmados
                            </div>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-800">
                              {confirmedOrders.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          {confirmedOrders.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
                              No hay pedidos confirmados todavía.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {confirmedOrders.map((order) => (
                              <OrderRow
                                key={order.id}
                                order={order}
                                payments={selectedAccount.payments}
                                onConfirmCash={confirmCashPayment}
                                onVerifyTransfer={verifyTransferPayment}
                                isProcessing={markingOrderId === order.id || saving}
                                onChangeStatus={handleUpdateOrderStatus}
                                isStatusUpdating={statusUpdatingId === order.id}
                                onDelete={handleDeleteOrder}
                                isDeleting={archivingOrderId === order.id}
                              />
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                </div>
                <Separator />
                <div className="grid gap-3 border-t border-[color:var(--neutral-100)] p-4 md:grid-cols-3 md:p-6">
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                    <Wallet className="h-5 w-5 text-slate-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(selectedAccount.totals.pending)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-800" />
                    <div>
                      <p className="text-xs text-emerald-700">Pagado</p>
                      <p className="text-sm font-semibold text-emerald-900">{formatCurrency(selectedAccount.totals.paid)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2">
                    <Clock3 className="h-5 w-5 text-amber-800" />
                    <div>
                      <p className="text-xs text-amber-700">Pagos en curso</p>
                      <p className="text-sm font-semibold text-amber-900">
                        {formatCurrency(selectedAccount.totals.pendingPayments)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}

      <Dialog
        open={summaryOpen}
        onOpenChange={(open) => {
          setSummaryOpen(open);
          if (!open) setSummaryAccount(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[color:var(--brand-primary-dark)]" />
              Resumen de {summaryAccount?.client.name ?? "cliente"}
            </DialogTitle>
            <DialogDescription>Pedidos completados y pendientes por cobrar.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={handleDownloadSummary}
              disabled={!summaryAccount || downloadingSummary}
            >
              <Download className={`h-4 w-4 ${downloadingSummary ? "animate-bounce" : ""}`} />
              {downloadingSummary ? "Generando..." : "Descargar resumen PDF"}
            </Button>
          </div>
          <ScrollArea className="max-h-[70vh] pr-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 16 }}
              className="space-y-4 pr-1"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Completados</p>
                  <p className="text-lg font-semibold text-emerald-900">{formatCurrency(summaryTotals.completed)}</p>
                  <p className="text-xs text-emerald-800/80">{summaryCompletedOrders.length} pedido(s)</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-50 via-white to-amber-100/70 p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-amber-700">Pendientes por cobrar</p>
                  <p className="text-lg font-semibold text-amber-900">{formatCurrency(summaryTotals.pending)}</p>
                  <p className="text-xs text-amber-800/80">{summaryPendingOrders.length} pedido(s)</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Pedidos completados</p>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800">
                    {summaryCompletedOrders.length}
                  </Badge>
                </div>
                {summaryCompletedOrders.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-muted/60 px-3 py-4 text-sm text-muted-foreground">
                    Todavía no hay pedidos completados.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {summaryCompletedOrders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Pedido #{shortId(order.id)}</span>
                          <span className="text-sm font-semibold text-emerald-900">{formatCurrency(order.total)}</span>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          {order.status}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pb-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Pedidos pendientes por cobrar</p>
                  <Badge variant="outline">{summaryPendingOrders.length}</Badge>
                </div>
                {summaryPendingOrders.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-muted/60 px-3 py-4 text-sm text-muted-foreground">
                    No hay pedidos pendientes ahora mismo.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {summaryPendingOrders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/80 px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Pedido #{shortId(order.id)}</span>
                          <span className="text-sm font-semibold text-slate-900">{formatCurrency(order.total)}</span>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            orderStatusTone[order.status] ?? "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
