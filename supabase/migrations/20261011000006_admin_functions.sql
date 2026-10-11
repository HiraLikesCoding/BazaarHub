-- =============================================================================
-- BazaarHub migration 6: admin server-side logic
--
-- set_order_status(): replaces PUT /api/orders/:id/status - appends to the
-- history, marks delivery (and payment) and restores stock on cancellation.
-- admin_stats(): replaces GET /api/admin/stats - one round trip for the
-- dashboard numbers that used to be eight Mongo aggregations.
-- customer_order_stats: per-customer order totals for the customers table
-- (PostgREST cannot GROUP BY, same reason as category_counts).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- set_order_status()
-- ---------------------------------------------------------------------------
create or replace function public.set_order_status(
  p_order_id uuid,
  p_status text,
  p_restore_stock boolean default true
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item record;
  v_qty integer;
begin
  if not public.is_admin() then
    raise exception 'Admins only.';
  end if;

  if p_status is null or p_status not in ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') then
    raise exception 'Invalid status.';
  end if;

  -- Lock the row so two admins changing the status at once cannot double-restore stock.
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'Order not found.';
  end if;

  if v_order.status = p_status then
    return v_order; -- status unchanged, same as the old controller
  end if;

  update public.orders
     set status = p_status,
         status_history = status_history || jsonb_build_array(jsonb_build_object(
           'status', p_status,
           'at', now(),
           'by', (select name from public.profiles where id = auth.uid())
         )),
         delivered_at = case when p_status = 'Delivered' then now() else delivered_at end,
         -- cash collected on delivery
         payment_status = case when p_status = 'Delivered' then 'Paid' else payment_status end
   where id = p_order_id
   returning * into v_order;

  if p_status = 'Cancelled' and coalesce(p_restore_stock, true) then
    for v_item in select * from jsonb_array_elements(v_order.items)
    loop
      v_qty := greatest(0, coalesce((v_item.value ->> 'quantity')::integer, 0));
      update public.products
         set stock = stock + v_qty,
             sold = greatest(0, sold - v_qty)
       where id = (v_item.value ->> 'product')::uuid;
    end loop;
  end if;

  return v_order;
end;
$$;

revoke all on function public.set_order_status(uuid, text, boolean) from public;
grant execute on function public.set_order_status(uuid, text, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- admin_stats(): one jsonb document shaped exactly like the dashboard reads it
-- ---------------------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admins only.';
  end if;

  select jsonb_build_object(
    'totals', jsonb_build_object(
      'products', (select count(*) from public.products),
      'orders', (select count(*) from public.orders),
      'users', (select count(*) from public.profiles),
      'revenue', coalesce((select round(sum(total), 2) from public.orders where status <> 'Cancelled'), 0),
      'averageOrder', coalesce((select round(avg(total), 2) from public.orders where status <> 'Cancelled'), 0),
      'outOfStock', (select count(*) from public.products where stock = 0),
      'lowStock', (select count(*) from public.products where stock between 1 and 10),
      'pending', (select count(*) from public.orders where status = 'Pending')
    ),
    'statusCounts', coalesce((
      select jsonb_object_agg(status, cnt)
      from (select status, count(*)::integer as cnt from public.orders group by status) s
    ), '{}'::jsonb),
    -- one bar per day with sales; days without orders are simply missing
    'dailySales', coalesce((
      select jsonb_agg(
        jsonb_build_object('_id', day, 'revenue', revenue, 'orders', cnt)
        order by day
      )
      from (
        select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
               round(sum(total), 2) as revenue,
               count(*)::integer as cnt
        from public.orders
        where created_at >= date_trunc('day', now()) - interval '6 days'
          and status <> 'Cancelled'
        group by 1
      ) d
    ), '[]'::jsonb),
    'lowStockProducts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          '_id', p.id, 'name', p.name, 'sku', p.sku, 'stock', p.stock, 'category', c.name
        )
        order by p.stock
      )
      from (
        select id, name, sku, stock, category_id
        from public.products
        where stock between 1 and 10
        order by stock
        limit 8
      ) p
      left join public.categories c on c.id = p.category_id
    ), '[]'::jsonb),
    'recentOrders', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          '_id', o.id,
          'orderNumber', o.order_number,
          'status', o.status,
          'total', o.total,
          'createdAt', o.created_at,
          'user', case when p.id is null then null else jsonb_build_object('name', p.name) end
        )
        order by o.created_at desc
      )
      from (
        select id, order_number, status, total, created_at, user_id
        from public.orders
        order by created_at desc
        limit 8
      ) o
      left join public.profiles p on p.id = o.user_id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_stats() from public;
grant execute on function public.admin_stats() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- customer_order_stats view - per-customer order totals for the admin table
-- ---------------------------------------------------------------------------
create or replace view public.customer_order_stats
with (security_invoker = true) as
select
  user_id,
  count(*)::integer as orders,
  coalesce(round(sum(total), 2), 0) as spent,
  max(created_at) as last_order
from public.orders
group by user_id;

grant select on public.customer_order_stats to authenticated, service_role;
