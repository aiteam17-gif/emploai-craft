alter table public.chain_instances
  add column if not exists step_states jsonb not null default '[]'::jsonb;


