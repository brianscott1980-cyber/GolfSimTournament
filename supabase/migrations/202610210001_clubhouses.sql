-- Each authenticated account owns one private clubhouse aggregate.
create table if not exists public.clubhouses (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  tournaments jsonb not null default '[]'::jsonb check (jsonb_typeof(tournaments) = 'array'),
  updated_at timestamptz not null default now()
);
alter table public.clubhouses enable row level security;
revoke all on public.clubhouses from anon;
grant select, insert, update, delete on public.clubhouses to authenticated;
create policy "Read own clubhouse" on public.clubhouses for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Create own clubhouse" on public.clubhouses for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Update own clubhouse" on public.clubhouses for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Delete own clubhouse" on public.clubhouses for delete to authenticated using ((select auth.uid()) = owner_id);
