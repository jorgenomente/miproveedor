export const ORDER_STATUS = ["nuevo", "preparando", "entregado"] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  nuevo: "Nuevo",
  preparando: "Preparado",
  entregado: "Entregado",
};
