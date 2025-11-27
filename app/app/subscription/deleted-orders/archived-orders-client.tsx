"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Archive, Clock3, RefreshCcw, ShieldCheck, Undo2, Wallet } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { restoreOrder, type ArchivedOrder, type ProviderRow } from "../../accounts/actions";
import { formatCurrency } from "@/lib/whatsapp";

type Props = {
  providerSlug: string;
  provider: ProviderRow;
  initialOrders: ArchivedOrder[];
};

const statusTone: Record<string, string> = {
  nuevo: "bg-blue-50 text-blue-800",
  preparando: "bg-amber-50 text-amber-800",
  enviado: "bg-sky-50 text-sky-800",
  entregado: "bg-emerald-50 text-emerald-800",
  cancelado: "bg-rose-50 text-rose-800",
};

const proofTone: Record<string, string> = {
  no_aplica: "bg-slate-50 text-slate-700",
  pendiente: "bg-amber-50 text-amber-800",
  subido: "bg-blue-50 text-blue-800",
  verificado: "bg-emerald-50 text-emerald-800",
};

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleString();
}

export function ArchivedOrdersClient({ providerSlug, provider, initialOrders }: Props) {
  const [orders, setOrders] = useState<ArchivedOrder[]>(initialOrders);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const counters = useMemo(
    () => ({
      total: orders.length,
      totalAmount: orders.reduce((acc, order) => acc + (order.total ?? 0), 0),
    }),
    [orders],
  );

  const handleRestore = (orderId: string) => {
    startTransition(async () => {
      setRestoringId(orderId);
      const response = await restoreOrder({ providerSlug, orderId });
      if (response.success) {
        setOrders((prev) => prev.filter((order) => order.id !== orderId));
      }
      setRestoringId(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/app/${providerSlug}/subscription`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver a configuración
            </Link>
          </Button>
          <span>/</span>
          <Badge variant="secondary" className="gap-1">
            <Archive className="h-3.5 w-3.5" />
            Pedidos eliminados
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            <Wallet className="h-3.5 w-3.5" />
            {formatCurrency(counters.totalAmount)}
          </Badge>
          <Badge variant="secondary">{counters.total} pedidos</Badge>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed border-[color:var(--neutral-200)] bg-white/70">
          <CardHeader>
            <CardTitle className="text-base">No hay pedidos eliminados</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Los pedidos que archives desde Cuentas aparecerán aquí para poder consultarlos o restaurarlos.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-xl border border-[color:var(--neutral-200)] bg-white/80 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Pedido #{order.id.slice(0, 8)} · {order.client.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Creado {formatDate(order.createdAt)} · Archivado {formatDate(order.archivedAt)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className={statusTone[order.status] ?? "bg-muted text-foreground"}>
                      {order.status}
                    </Badge>
                    {order.paymentMethod ? (
                      <Badge variant="outline" className="gap-1">
                        <Wallet className="h-3.5 w-3.5" />
                        {order.paymentMethod === "efectivo" ? "Efectivo" : "Transferencia"}
                      </Badge>
                    ) : null}
                    {order.paymentProofStatus ? (
                      <Badge variant="outline" className={proofTone[order.paymentProofStatus] ?? "bg-muted text-foreground"}>
                        {order.paymentProofStatus}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold">{formatCurrency(order.total)}</p>
                  <p className="text-xs text-muted-foreground">Cliente #{order.client.slug}</p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  Última actualización {formatDate(order.archivedAt ?? order.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={pending && restoringId === order.id}
                    onClick={() => handleRestore(order.id)}
                  >
                    {pending && restoringId === order.id ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
                    Restaurar
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
