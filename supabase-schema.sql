create extension if not exists pgcrypto;

create table if not exists public.mymain_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_id uuid references public.mymain_nodes(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  node_type text not null default 'node' check (node_type in ('node', 'log')),
  depth smallint not null check (depth between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mymain_one_log_per_root
  on public.mymain_nodes(parent_id)
  where node_type = 'log';

create table if not exists public.mymain_log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  node_id uuid not null references public.mymain_nodes(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create or replace function public.mymain_validate_node()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_node public.mymain_nodes;
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
  else
    new.user_id := old.user_id;
  end if;

  new.name := trim(new.name);
  new.updated_at := now();

  if new.parent_id is null then
    new.depth := 1;
    if new.node_type = 'log' then
      raise exception 'A Log must be beneath a root node';
    end if;
    return new;
  end if;

  select * into parent_node
  from public.mymain_nodes
  where id = new.parent_id;

  if not found or parent_node.user_id <> new.user_id then
    raise exception 'Invalid parent node';
  end if;

  if parent_node.depth >= 3 then
    raise exception 'Nodes cannot be nested beyond level 3';
  end if;

  new.depth := parent_node.depth + 1;
  if new.node_type = 'log' and new.depth <> 2 then
    raise exception 'A Log must be a level 2 node';
  end if;

  return new;
end;
$$;

drop trigger if exists mymain_nodes_validate on public.mymain_nodes;
create trigger mymain_nodes_validate
before insert or update on public.mymain_nodes
for each row execute function public.mymain_validate_node();

create or replace function public.mymain_validate_log_entry()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_node public.mymain_nodes;
begin
  new.user_id := auth.uid();
  new.body := trim(new.body);

  select * into target_node
  from public.mymain_nodes
  where id = new.node_id;

  if not found or target_node.user_id <> new.user_id or target_node.node_type <> 'log' then
    raise exception 'Entries can only be added to your Log nodes';
  end if;

  return new;
end;
$$;

drop trigger if exists mymain_log_entries_validate on public.mymain_log_entries;
create trigger mymain_log_entries_validate
before insert or update on public.mymain_log_entries
for each row execute function public.mymain_validate_log_entry();

create or replace function public.mymain_create_root(root_name text)
returns public.mymain_nodes
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_root public.mymain_nodes;
begin
  insert into public.mymain_nodes (name, parent_id, node_type, depth)
  values (trim(root_name), null, 'node', 1)
  returning * into new_root;

  insert into public.mymain_nodes (name, parent_id, node_type, depth)
  values ('Log', new_root.id, 'log', 2);

  return new_root;
end;
$$;

alter table public.mymain_nodes enable row level security;
alter table public.mymain_log_entries enable row level security;

drop policy if exists "mymain users read own nodes" on public.mymain_nodes;
create policy "mymain users read own nodes"
on public.mymain_nodes for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "mymain users insert own nodes" on public.mymain_nodes;
create policy "mymain users insert own nodes"
on public.mymain_nodes for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "mymain users update own nodes" on public.mymain_nodes;
create policy "mymain users update own nodes"
on public.mymain_nodes for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "mymain users delete own nodes" on public.mymain_nodes;
create policy "mymain users delete own nodes"
on public.mymain_nodes for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "mymain users read own log entries" on public.mymain_log_entries;
create policy "mymain users read own log entries"
on public.mymain_log_entries for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "mymain users insert own log entries" on public.mymain_log_entries;
create policy "mymain users insert own log entries"
on public.mymain_log_entries for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "mymain users delete own log entries" on public.mymain_log_entries;
create policy "mymain users delete own log entries"
on public.mymain_log_entries for delete
to authenticated
using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.mymain_nodes to authenticated;
grant select, insert, update, delete on public.mymain_log_entries to authenticated;
revoke execute on function public.mymain_create_root(text) from public, anon;
grant execute on function public.mymain_create_root(text) to authenticated;
