type WhatsAppProductLine = {
  name: string;
  quantity: number;
  price: number;
  unit?: string;
};

type WhatsAppContext = {
  providerName: string;
  providerPhone?: string;
  clientName: string;
  contactName: string;
  contactPhone: string;
  deliveryMethod?: string;
  note?: string;
  currency?: string;
  paymentMethod?: "efectivo" | "transferencia";
  paymentProofStatus?: "no_aplica" | "pendiente" | "subido";
  items: WhatsAppProductLine[];
};

function formatCurrency(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizePhone(phone?: string) {
  if (!phone) return "";
  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsAppMessage({
  providerName,
  clientName,
  contactName,
  contactPhone,
  deliveryMethod,
  note,
  currency,
  paymentMethod,
  paymentProofStatus,
  items,
}: Omit<WhatsAppContext, "providerPhone">) {
  const total = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const lines = [
    `Nuevo pedido para ${providerName}`,
    `Cliente: ${clientName}`,
    `Contacto: ${contactName || "Sin nombre"} - ${contactPhone || "Sin teléfono"}`,
    `Entrega: ${deliveryMethod || "Sin especificar"}`,
    items
      .map((item) =>
        `- ${item.quantity} x ${item.name}${
          item.unit ? ` (${item.unit})` : ""
        } - ${formatCurrency(item.price * item.quantity, currency)}`
      )
      .join("\n"),
    `Total estimado: ${formatCurrency(total, currency)}`,
    paymentMethod
      ? `Pago: ${
          paymentMethod === "transferencia" ? "Transferencia" : "Efectivo"
        }${
          paymentMethod === "transferencia"
            ? ` (${paymentProofStatus === "subido" ? "Comprobante cargado" : "Comprobante pendiente"})`
            : " (A pagar en la entrega)"
        }`
      : "",
    note ? `Nota: ${note}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { message: lines, total };
}

export function buildWhatsAppLink(context: WhatsAppContext) {
  const phone = normalizePhone(context.providerPhone);
  if (!phone || context.items.length === 0) return null;

  const { message, total } = buildWhatsAppMessage(context);
  return {
    href: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    total,
  };
}

export { normalizePhone, formatCurrency };
