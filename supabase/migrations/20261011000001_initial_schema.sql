-- =============================================================================
-- BazaarHub migration 1/4: initial schema
-- MERN -> Supabase. Hybrid design: relational core (profiles, categories,
-- products, orders) + jsonb for the embedded lists that lived inside the
-- MongoDB documents (items, shipping address, status history, specs, reviews).
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Shared helpers: updated_at maintenance and URL slugs
-- (parity with the Mongoose pre-save hooks in server/models)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.assign_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := coalesce(nullif(public.slugify(new.name), ''), 'item')
             || '-' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users account (created by the trigger in 2/4)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  email text unique,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) <= 40),
  slug text not null unique,
  description text not null default '' check (char_length(description) <= 300),
  image text not null default '',
  icon text not null default '🛍️',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_assign_slug
  before insert on public.categories
  for each row execute function public.assign_slug();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- `category` was a plain string in MongoDB; it is a real foreign key here, so
-- the old "cannot delete a category that is still in use" rule from
-- server/controllers/categoryController.js becomes `on delete restrict`.
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 120),
  slug text not null unique,
  description text not null check (char_length(description) <= 3000),
  price numeric(10, 2) not null check (price >= 0),
  discount_price numeric(10, 2) not null default 0 check (discount_price >= 0),
  -- the price the customer pays; same rule as computeEffectivePrice() in the old model
  effective_price numeric(10, 2) generated always as (
    case when discount_price > 0 and discount_price < price then discount_price else price end
  ) stored,
  category_id uuid not null references public.categories (id) on delete restrict,
  brand text not null default '',
  sku text not null default '',
  images jsonb not null default '[]'
    check (jsonb_typeof(images) = 'array' and jsonb_array_length(images) <= 8),
  stock integer not null default 0 check (stock >= 0),
  sold integer not null default 0 check (sold >= 0),
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  num_reviews integer not null default 0 check (num_reviews >= 0),
  featured boolean not null default false,
  specifications jsonb not null default '[]' check (jsonb_typeof(specifications) = 'array'),
  -- review objects: { user_id, name, rating, comment, created_at }
  reviews jsonb not null default '[]' check (jsonb_typeof(reviews) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_assign_slug
  before insert on public.products
  for each row execute function public.assign_slug();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index products_category_id_idx on public.products (category_id);
create index products_featured_idx on public.products (featured) where featured;
create index products_sku_idx on public.products (sku) where sku <> '';
create index products_created_at_idx on public.products (created_at desc);
create index products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create index products_description_trgm_idx on public.products using gin (description gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- orders
-- Order number keeps the BZH-YYYYMMDD-XXXX shape from server/models/Order.js.
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.profiles (id) on delete cascade,
  items jsonb not null
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  -- { fullName, email, phone, address, city, province, postalCode, country }
  shipping_address jsonb not null check (jsonb_typeof(shipping_address) = 'object'),
  payment_method text not null default 'cod'
    check (payment_method in ('cod', 'card', 'wallet')),
  payment_status text not null default 'Unpaid'
    check (payment_status in ('Unpaid', 'Paid', 'Refunded')),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  shipping numeric(10, 2) not null check (shipping >= 0),
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'Pending'
    check (status in ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  status_history jsonb not null default '[]' check (jsonb_typeof(status_history) = 'array'),
  note text not null default '' check (char_length(note) <= 500),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();
