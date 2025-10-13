do $$ begin
  create policy chain_instances_update_own on public.chain_instances
    for update to authenticated
    using (auth.uid() = created_by)
    with check (auth.uid() = created_by);
exception when duplicate_object then null; end $$;


