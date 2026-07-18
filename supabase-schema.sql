create extension if not exists pgcrypto;

create table if not exists public.mymain_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_id uuid references public.mymain_nodes(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  node_type text not null default 'node' check (node_type in ('node', 'log', 'links')),
  depth smallint not null check (depth between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mymain_nodes
  add column if not exists content text not null default ''
  check (char_length(content) <= 10000);

alter table public.mymain_nodes drop constraint if exists mymain_nodes_node_type_check;
alter table public.mymain_nodes
  add constraint mymain_nodes_node_type_check check (node_type in ('node', 'log', 'links'));
alter table public.mymain_nodes drop constraint if exists mymain_nodes_depth_check;
alter table public.mymain_nodes
  add constraint mymain_nodes_depth_check check (depth between 1 and 4);

create unique index if not exists mymain_one_log_per_root
  on public.mymain_nodes(parent_id)
  where node_type = 'log';

create unique index if not exists mymain_one_links_node_per_parent
  on public.mymain_nodes(parent_id)
  where node_type = 'links';

create table if not exists public.mymain_log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  node_id uuid not null references public.mymain_nodes(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.mymain_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  node_id uuid not null references public.mymain_nodes(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 100),
  url text not null check (char_length(trim(url)) between 1 and 2000 and trim(url) ~* '^https?://'),
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

  if parent_node.depth >= 4 or parent_node.node_type = 'links' then
    raise exception 'Nodes cannot be nested beyond level 4';
  end if;

  new.depth := parent_node.depth + 1;
  if new.node_type = 'log' and parent_node.node_type <> 'node' then
    raise exception 'Log nodes must be beneath regular nodes';
  end if;

  if new.node_type = 'links' and parent_node.node_type <> 'node' then
    raise exception 'Links nodes must be beneath regular nodes';
  end if;

  if new.depth = 4 and new.node_type not in ('log', 'links') then
    raise exception 'Level 4 is reserved for automatic Log and Links nodes';
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

create or replace function public.mymain_validate_link()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_node public.mymain_nodes;
begin
  new.user_id := auth.uid();
  new.label := trim(new.label);
  new.url := trim(new.url);

  select * into target_node
  from public.mymain_nodes
  where id = new.node_id;

  if not found or target_node.user_id <> new.user_id or target_node.node_type <> 'links' then
    raise exception 'Links can only be added to your Links nodes';
  end if;

  return new;
end;
$$;

drop trigger if exists mymain_links_validate on public.mymain_links;
create trigger mymain_links_validate
before insert or update on public.mymain_links
for each row execute function public.mymain_validate_link();

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

  insert into public.mymain_nodes (name, parent_id, node_type, depth)
  values ('Links', new_root.id, 'links', 2);

  return new_root;
end;
$$;

create or replace function public.mymain_create_child(parent_node_id uuid, child_name text)
returns public.mymain_nodes
language plpgsql
security invoker
set search_path = public
as $$
declare
  parent_node public.mymain_nodes;
  new_child public.mymain_nodes;
begin
  select * into parent_node
  from public.mymain_nodes
  where id = parent_node_id and user_id = auth.uid();

  if not found or parent_node.depth >= 3 or parent_node.node_type = 'links' then
    raise exception 'This node cannot have a user-created child';
  end if;

  insert into public.mymain_nodes (name, parent_id, node_type, depth)
  values (trim(child_name), parent_node.id, 'node', parent_node.depth + 1)
  returning * into new_child;

  insert into public.mymain_nodes (name, parent_id, node_type, depth)
  values ('Log', new_child.id, 'log', new_child.depth + 1);

  insert into public.mymain_nodes (name, parent_id, node_type, depth)
  values ('Links', new_child.id, 'links', new_child.depth + 1);

  return new_child;
end;
$$;

create or replace function public.mymain_ensure_links()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.mymain_nodes (user_id, parent_id, name, node_type, depth)
  select auth.uid(), node.id, 'Links', 'links', node.depth + 1
  from public.mymain_nodes node
  where node.user_id = auth.uid()
    and node.node_type = 'node'
    and node.depth <= 3
    and not exists (
      select 1 from public.mymain_nodes child
      where child.parent_id = node.id and child.node_type = 'links'
    );
end;
$$;

alter table public.mymain_nodes enable row level security;
alter table public.mymain_log_entries enable row level security;
alter table public.mymain_links enable row level security;

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

drop policy if exists "mymain users read own links" on public.mymain_links;
create policy "mymain users read own links"
on public.mymain_links for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "mymain users insert own links" on public.mymain_links;
create policy "mymain users insert own links"
on public.mymain_links for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "mymain users delete own links" on public.mymain_links;
create policy "mymain users delete own links"
on public.mymain_links for delete to authenticated
using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.mymain_nodes to authenticated;
grant select, insert, update, delete on public.mymain_log_entries to authenticated;
grant select, insert, update, delete on public.mymain_links to authenticated;
revoke execute on function public.mymain_create_root(text) from public, anon;
grant execute on function public.mymain_create_root(text) to authenticated;
revoke execute on function public.mymain_create_child(uuid, text) from public, anon;
grant execute on function public.mymain_create_child(uuid, text) to authenticated;
revoke execute on function public.mymain_ensure_links() from public, anon;
grant execute on function public.mymain_ensure_links() to authenticated;
