"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Banknote, CheckCircle2, Clock3, DollarSign, RefreshCcw, ShoppingBag, Wallet } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/whatsapp";
import { listProviders, type ProviderRow } from "../orders/actions";
import {
  getClientAccounts,
  recordClientPayment,
  type AccountOrder,
  type AccountPayment,
  type ClientAccount,
} from "./actions";

export type AccountsPageProps = { initialProviderSlug?: string };

type PaymentFormState = {
  clientId?: string;
  orderId?: string | null;
  amount: string;
  method?: "efectivo" | "transferencia";
  status?: "pending" | "approved" | "rejected";
  reference?: string;
  note?: string;
  paidAt?: string;
};

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const orderStatusTone: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-700",
  preparando: "bg-amber-100 text-amber-800",
  enviado: "bg-sky-100 text-sky-700",
  entregado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-rose-100 text-rose-700",
};

function PaymentBadge({ payment }: { payment: AccountPayment }) {
  const tone =
    payment.status === "approved"
      ? "bg-emerald-100 text-emerald-700"
      : payment.status === "pending"
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-700";
  return (
    <Badge variant="secondary" className={`gap-1 ${tone}`}>
      <Wallet className="h-3.5 w-3.5" />
      {statusLabel[payment.status] ?? payment.status}
    </Badge>
  );
}

function OrderRow({ order }: { order: AccountOrder }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-muted/40 bg-white/60 px-3 py-2">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>Pedido #{order.id.slice(0, 6)}</span>
          <Badge variant="secondary" className={orderStatusTone[order.status] ?? "bg-muted text-foreground"}>
            {order.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "Sin fecha"}</p>
      </div>
      <div className="text-right text-sm font-semibold">{formatCurrency(order.total)}</div>
    </div>
  );
}

function PaymentRow({ payment }: { payment: AccountPayment }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-muted/40 bg-gradient-to-r from-white via-white to-slate-50 px-3 py-2">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>Pago #{payment.id.slice(0, 6)}</span>
          <PaymentBadge payment={payment} />
        </div>
        <p className="text-xs text-muted-foreground">{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "Sin fecha"}</p>
        {payment.reference ? <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p> : null}
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold">{formatCurrency(payment.amount)}</div>
        {payment.method ? <p className="text-xs text-muted-foreground capitalize">{payment.method}</p> : null}
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    amount: "",
    status: "approved",
    method: "transferencia",
    paidAt: new Date().toISOString().slice(0, 16),
  });

  const filteredAccounts = useMemo(() => accounts, [accounts]);

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

  const handleRecordPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAccount) return;
    const formData = new FormData(event.currentTarget);
    const payload = {
      providerSlug,
      clientId: selectedAccount.client.id,
      orderId: (formData.get("orderId") as string) || null,
      amount: Number(formData.get("amount") ?? 0),
      method: (formData.get("method") as PaymentFormState["method"]) ?? null,
      status: (formData.get("status") as PaymentFormState["status"]) ?? "approved",
      reference: (formData.get("reference") as string) || null,
      note: (formData.get("note") as string) || null,
      paidAt: (() => {
        const value = formData.get("paidAt") as string;
        if (!value) return null;
        const parsed = new Date(value);
        return parsed.toISOString();
      })(),
    };
    startSaving(async () => {
      const response = await recordClientPayment(payload);
      if (response.success) {
        await loadAccounts(providerSlug);
        setPaymentDialogOpen(false);
        setPaymentForm((prev) => ({ ...prev, amount: "", reference: "", note: "" }));
      } else {
        setError(response.errors.join("\n"));
      }
    });
  };

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
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Cuentas por cobrar</CardTitle>
            <p className="text-sm text-muted-foreground">
              Controla pedidos, pagos recibidos y saldos pendientes por cada cliente.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {formatCurrency(summary.paid)}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              <Clock3 className="h-4 w-4" />
              Pendiente {formatCurrency(summary.pending)}
            </div>
          </div>
        </CardHeader>
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
            <AnimatePresence>
              <div className="grid gap-3 md:grid-cols-2">
                {filteredAccounts.map((account, index) => {
                  const isActive = selectedAccount?.client.id === account.client.id;
                  const highlight = account.totals.pending > 0 ? "border-amber-300 shadow-[0_10px_40px_-24px_rgba(251,191,36,0.8)]" : "border-slate-200";
                  return (
                    <motion.button
                      key={account.client.id}
                      layout
                      type="button"
                      onClick={() => setSelectedClientId(account.client.id)}
                      className={`flex flex-col items-start rounded-xl border ${highlight} bg-white p-4 text-left transition hover:shadow-md focus:outline-none`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
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
                    </motion.button>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {selectedAccount ? (
        <motion.div
          layout
          className="rounded-2xl border border-[color:var(--neutral-200)] bg-white shadow-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <div className="flex flex-col gap-3 border-b border-[color:var(--neutral-100)] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Detalle</p>
              <h3 className="text-lg font-semibold leading-tight">{selectedAccount.client.name}</h3>
              {selectedAccount.client.contactPhone ? (
                <p className="text-sm text-muted-foreground">{selectedAccount.client.contactPhone}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-amber-50 text-amber-800">
                Pendiente {formatCurrency(selectedAccount.totals.pending)}
              </Badge>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-800">
                Pagado {formatCurrency(selectedAccount.totals.paid)}
              </Badge>
              <Dialog
                open={paymentDialogOpen}
                onOpenChange={(open) => {
                  setPaymentDialogOpen(open);
                  if (open && selectedAccount) {
                    setPaymentForm((prev) => ({
                      ...prev,
                      orderId: null,
                      amount: selectedAccount.totals.pending > 0 ? String(selectedAccount.totals.pending.toFixed(2)) : "",
                      paidAt: new Date().toISOString().slice(0, 16),
                    }));
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="shadow-sm">
                    <Banknote className="mr-2 h-4 w-4" />
                    Registrar pago
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Registrar pago</DialogTitle>
                    <DialogDescription>
                      Deja asentado un pago manual para controlar el saldo del cliente.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleRecordPayment}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Monto</Label>
                        <Input
                          id="amount"
                          name="amount"
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={paymentForm.amount}
                          onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paidAt">Fecha de pago</Label>
                        <Input
                          id="paidAt"
                          name="paidAt"
                          type="datetime-local"
                          value={paymentForm.paidAt}
                          onChange={(event) => setPaymentForm((prev) => ({ ...prev, paidAt: event.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Método</Label>
                        <Select
                          name="method"
                          value={paymentForm.method}
                          onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, method: value as PaymentFormState["method"] }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Elige método" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select
                          name="status"
                          value={paymentForm.status}
                          onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, status: value as PaymentFormState["status"] }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approved">Aprobado</SelectItem>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="rejected">Rechazado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Asociar a pedido</Label>
                      <Select
                        name="orderId"
                        value={paymentForm.orderId ?? ""}
                        onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, orderId: value || null }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="(Opcional) elige un pedido" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin pedido</SelectItem>
                          {selectedAccount.orders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              Pedido #{order.id.slice(0, 6)} · {formatCurrency(order.total)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reference">Referencia</Label>
                      <Input
                        id="reference"
                        name="reference"
                        placeholder="Alias, comprobante o nota corta"
                        value={paymentForm.reference ?? ""}
                        onChange={(event) => setPaymentForm((prev) => ({ ...prev, reference: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="note">Notas internas</Label>
                      <Textarea
                        id="note"
                        name="note"
                        rows={3}
                        placeholder="Ej: pendiente de aprobar, falta comprobante..."
                        value={paymentForm.note ?? ""}
                        onChange={(event) => setPaymentForm((prev) => ({ ...prev, note: event.target.value }))}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setPaymentDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={saving || !providerSlug}>
                        {saving ? "Guardando..." : "Guardar pago"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid gap-6 p-4 md:grid-cols-2 md:p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingBag className="h-4 w-4 text-[color:var(--brand-deep)]" />
                  Pedidos ({selectedAccount.orders.length})
                </div>
                <Badge variant="outline" className="bg-slate-50">
                  Último {selectedAccount.totals.lastOrderAt ? new Date(selectedAccount.totals.lastOrderAt).toLocaleDateString() : "—"}
                </Badge>
              </div>
              <div className="space-y-2">
                {selectedAccount.orders.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
                    Aún no hay pedidos de este cliente.
                  </div>
                ) : (
                  selectedAccount.orders.map((order) => <OrderRow key={order.id} order={order} />)
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="h-4 w-4 text-[color:var(--brand-primary-dark)]" />
                  Pagos ({selectedAccount.payments.length})
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-800">
                  Pendientes {formatCurrency(selectedAccount.totals.pendingPayments)}
                </Badge>
              </div>
              <div className="space-y-2">
                {selectedAccount.payments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
                    Sin pagos registrados todavía.
                  </div>
                ) : (
                  selectedAccount.payments.map((payment) => <PaymentRow key={payment.id} payment={payment} />)
                )}
              </div>
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
                <p className="text-sm font-semibold text-amber-900">{formatCurrency(selectedAccount.totals.pendingPayments)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
