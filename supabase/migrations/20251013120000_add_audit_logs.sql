-- Create audit_logs table with append-only policy
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid not null,
  org_id uuid,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  details jsonb,
  -- hash chain for tamper-evidence (optional initial)
  prev_hash text,
  event_hash text
);

-- Helpful indexes
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

-- RLS enabled: allow inserts by authenticated users, reads by org members (to be extended later)
alter table public.audit_logs enable row level security;

do $$ begin
  create policy audit_insert_authenticated on public.audit_logs
    for insert
    to authenticated
    with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy audit_select_self_org on public.audit_logs
    for select
    to authenticated
    using (true);
exception when duplicate_object then null; end $$;


