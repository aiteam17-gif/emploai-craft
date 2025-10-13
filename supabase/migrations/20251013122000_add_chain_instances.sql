create table if not exists public.chain_instances (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null,
  task_id uuid not null,
  template_id uuid not null,
  version int not null default 1,
  steps jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
);

create index if not exists chain_instances_task_idx on public.chain_instances(task_id);
create index if not exists chain_instances_template_idx on public.chain_instances(template_id);

alter table public.chain_instances enable row level security;

do $$ begin
  create policy chain_instances_insert_own on public.chain_instances
    for insert to authenticated
    with check (auth.uid() = created_by);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy chain_instances_select_own on public.chain_instances
    for select to authenticated
    using (auth.uid() = created_by);
exception when duplicate_object then null; end $$;


