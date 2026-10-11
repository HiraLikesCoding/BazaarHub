-- =============================================================================
-- BazaarHub migration 4/4: row level security
-- Replaces the Express middleware stack (requireAuth / adminOnly / ownership
-- checks). Every statement below is evaluated inside Postgres, so a client can
-- never work around it by calling the tables directly.
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: you can read/edit yourself, admins can do everything.
-- The `role = my_role()` clause stops a customer from promoting themselves.
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert
  with check (id = auth.uid());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update
  using (id = auth.uid() or public.is_admin())
  with check (
    (id = auth.uid() or public.is_admin())
    and (public.is_admin() or role = public.my_role())
  );

drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_delete" on public.profiles
  for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories: public catalogue, admin writes
-- ---------------------------------------------------------------------------
drop policy if exists "categories_select" on public.categories;
create policy "categories_select" on public.categories
  for select
  using (true);

drop policy if exists "categories_insert_admin" on public.categories;
create policy "categories_insert_admin" on public.categories
  for insert
  with check (public.is_admin());

drop policy if exists "categories_update_admin" on public.categories;
create policy "categories_update_admin" on public.categories
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "categories_delete_admin" on public.categories;
create policy "categories_delete_admin" on public.categories
  for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- products: public catalogue, admin writes (reviews go through
-- add_product_review(), stock changes through place_order())
-- ---------------------------------------------------------------------------
drop policy if exists "products_select" on public.products;
create policy "products_select" on public.products
  for select
  using (true);

drop policy if exists "products_insert_admin" on public.products;
create policy "products_insert_admin" on public.products
  for insert
  with check (public.is_admin());

drop policy if exists "products_update_admin" on public.products;
create policy "products_update_admin" on public.products
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_delete_admin" on public.products;
create policy "products_delete_admin" on public.products
  for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- orders: only the owner (or an admin) can see them.
-- Deliberately NO insert / update / delete policies yet:
--   * inserts only happen via place_order() - a security definer function
--   * status changes and stock restore arrive with set_order_status()
--     in the admin migration, so nobody can bypass that logic from the client
-- ---------------------------------------------------------------------------
drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
  for select
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime: the admin dashboard subscribes to order changes (step 6)
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;   -- already in the publication
  when undefined_object then null;   -- publication missing (fresh local project)
end $$;

-- ---------------------------------------------------------------------------
-- Table privileges (RLS decides which rows; these decide which operations)
-- ---------------------------------------------------------------------------
grant select on public.profiles, public.categories, public.products, public.orders
  to anon, authenticated, service_role;
grant insert, update, delete on public.profiles to authenticated, service_role;
grant insert, update, delete on public.categories, public.products to authenticated, service_role;
grant insert, update, delete on public.orders to service_role;
