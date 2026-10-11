-- =============================================================================
-- BazaarHub migration 3/4: server-side logic that must stay transactional
-- These replace Express controllers: everything that used to live in
-- server/controllers/orderController.js and product review handling.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- is_admin(): used by every RLS policy. security definer so that policies on
-- public.profiles can read public.profiles without recursing into themselves.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- my_role(): lets a profiles policy compare against the caller's current role
-- without querying public.profiles through RLS (which would recurse).
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.my_role() from public;
grant execute on function public.my_role() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- place_order(): atomic checkout
-- Reads prices from the database (a manipulated client cannot change them),
-- decrements stock only when there is enough left and builds the order number.
-- Any failure raises -> the whole statement rolls back -> stock is restored,
-- which is the guarantee the Express code had to implement by hand.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_items jsonb,
  p_shipping_address jsonb,
  p_payment_method text default 'cod',
  p_note text default ''
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_item record;
  v_product public.products;
  v_qty integer;
  v_subtotal numeric(10, 2) := 0;
  v_shipping numeric(10, 2);
  v_order_number text;
  v_order public.orders;
  v_attempts integer := 0;
  v_field text;
begin
  if v_user is null then
    raise exception 'You must be signed in to place an order.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  if p_payment_method is null or p_payment_method not in ('cod', 'card', 'wallet') then
    raise exception 'Invalid payment method.';
  end if;

  foreach v_field in array array['fullName', 'email', 'phone', 'address', 'city', 'province', 'postalCode', 'country']
  loop
    if coalesce(p_shipping_address ->> v_field, '') = '' then
      raise exception 'Shipping address is incomplete: % is missing.', v_field;
    end if;
  end loop;

  -- Reserve stock item by item; stock >= qty makes each decrement atomic.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if not coalesce(v_item.value ->> 'product', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Cart contains an invalid product.';
    end if;

    v_qty := greatest(1, coalesce((v_item.value ->> 'quantity')::integer, 1));

    update public.products
       set stock = stock - v_qty,
           sold = sold + v_qty
     where id = (v_item ->> 'product')::uuid
       and stock >= v_qty
    returning * into v_product;

    if v_product.id is null then
      raise exception 'One of the products in your cart is out of stock.';
    end if;

    v_subtotal := v_subtotal + v_product.effective_price * v_qty;
  end loop;

  v_subtotal := round(v_subtotal, 2);
  -- same shipping rule as calculateShipping() in the old controller
  v_shipping := case when v_subtotal = 0 or v_subtotal >= 75 then 0 else 6.99 end;

  -- BZH-YYYYMMDD-XXXX, redrawn until the number is free
  loop
    v_order_number := 'BZH-'
                    || to_char(now(), 'YYYYMMDD')
                    || '-' || lpad((floor(random() * 9000) + 1000)::integer::text, 4, '0');
    exit when not exists (select 1 from public.orders o where o.order_number = v_order_number);

    v_attempts := v_attempts + 1;
    if v_attempts >= 25 then
      v_order_number := 'BZH-'
                      || to_char(now(), 'YYYYMMDD')
                      || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
      exit;
    end if;
  end loop;

  insert into public.orders (
    order_number, user_id, items, shipping_address,
    payment_method, payment_status,
    subtotal, shipping, total,
    status, status_history, note
  )
  values (
    v_order_number, v_user, p_items, p_shipping_address,
    p_payment_method,
    case when p_payment_method = 'cod' then 'Unpaid' else 'Paid' end,
    v_subtotal, v_shipping, round(v_subtotal + v_shipping, 2),
    'Pending',
    jsonb_build_array(jsonb_build_object('status', 'Pending', 'at', now(), 'by', 'system')),
    coalesce(p_note, '')
  )
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, text, text) from public;
grant execute on function public.place_order(jsonb, jsonb, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- add_product_review(): customers cannot update public.products directly
-- (RLS gives that to admins only), so reviews go through a definer function
-- that appends to the jsonb array and recomputes the average like the old
-- POST /api/products/:id/reviews endpoint did.
-- ---------------------------------------------------------------------------
create or replace function public.add_product_review(
  p_product_id uuid,
  p_rating integer,
  p_comment text default ''
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_name text;
  v_reviews jsonb;
  v_product public.products;
begin
  if v_user is null then
    raise exception 'You must be signed in to leave a review.';
  end if;

  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Rating must be between 1 and 5.';
  end if;

  if char_length(coalesce(p_comment, '')) > 1000 then
    raise exception 'Review comment must be at most 1000 characters.';
  end if;

  select p.name into v_name from public.profiles p where p.id = v_user;
  if v_name is null then
    raise exception 'Profile not found.';
  end if;

  update public.products
     set reviews = reviews || jsonb_build_array(
           jsonb_build_object(
             'user_id', v_user,
             'name', v_name,
             'rating', p_rating,
             'comment', coalesce(p_comment, ''),
             'created_at', now()
           )
         )
   where id = p_product_id
   returning reviews into v_reviews;

  if v_reviews is null then
    raise exception 'Product not found.';
  end if;

  update public.products
     set rating = coalesce(
           (select round(avg((r ->> 'rating')::numeric), 1)
              from jsonb_array_elements(v_reviews) r),
           0
         ),
         num_reviews = jsonb_array_length(v_reviews)
   where id = p_product_id
   returning * into v_product;

  return v_product;
end;
$$;

revoke all on function public.add_product_review(uuid, integer, text) from public;
grant execute on function public.add_product_review(uuid, integer, text) to authenticated, service_role;
