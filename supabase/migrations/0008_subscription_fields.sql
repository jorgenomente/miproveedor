-- Campos de suscripción para proveedores
alter table providers
  add column subscription_status text not null default 'active',
  add column subscribed_at timestamptz not null default now(),
  add column renews_at timestamptz not null default (now() + interval '30 days'),
  add column paused_at timestamptz;

alter table providers
  add constraint providers_subscription_status_check
  check (subscription_status in ('active', 'paused', 'canceled'));
