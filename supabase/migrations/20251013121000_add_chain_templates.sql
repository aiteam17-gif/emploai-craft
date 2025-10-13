create table if not exists public.chain_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null,
  name text not null,
  steps jsonb not null default '[]'::jsonb
);

create index if not exists chain_templates_created_by_idx on public.chain_templates(created_by);
create index if not exists chain_templates_created_at_idx on public.chain_templates(created_at desc);

alter table public.chain_templates enable row level security;

do $$ begin
  create policy chain_templates_insert_own on public.chain_templates
    for insert to authenticated
    with check (auth.uid() = created_by);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy chain_templates_select_own on public.chain_templates
    for select to authenticated
    using (auth.uid() = created_by);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy chain_templates_update_own on public.chain_templates
    for update to authenticated
    using (auth.uid() = created_by)
    with check (auth.uid() = created_by);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy chain_templates_delete_own on public.chain_templates
    for delete to authenticated
    using (auth.uid() = created_by);
exception when duplicate_object then null; end $$;


