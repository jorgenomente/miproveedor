-- Control manual de remitos: se registra cuándo se generó y las cantidades efectivamente enviadas.

-- Agrega columna para marcar cuándo se generó el remito.
alter table if exists public.orders
  add column if not exists receipt_generated_at timestamptz;

-- Las órdenes previas quedan marcadas como generadas para no romper descargas existentes.
update public.orders
set receipt_generated_at = created_at
where receipt_generated_at is null;

-- Agrega columna para cantidades confirmadas de envío en cada item.
alter table if exists public.order_items
  add column if not exists delivered_quantity integer;

-- Prefill histórico: los pedidos previos usan la cantidad pedida como enviada.
update public.order_items
set delivered_quantity = quantity
where delivered_quantity is null;

-- Soporte equivalente para el modo demo.
alter table if exists public.demo_orders
  add column if not exists receipt_generated_at timestamptz;

alter table if exists public.demo_orders
  add column if not exists delivered_items jsonb;

update public.demo_orders
set receipt_generated_at = created_at
where receipt_generated_at is null;

update public.demo_orders
set delivered_items = items
where delivered_items is null;
