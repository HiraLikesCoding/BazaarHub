-- =============================================================================
-- BazaarHub migration 5/5 (for now): catalog helper view
--
-- PostgREST cannot run GROUP BY aggregates, and the category cards need a
-- productCount badge (the old Mongo endpoint did this with an aggregation).
-- A plain view keeps the count live and respects product RLS via
-- security_invoker, so it stays correct if the catalog ever goes private.
-- =============================================================================

create or replace view public.category_counts
with (security_invoker = true) as
select
  category_id,
  count(*)::integer as product_count
from public.products
group by category_id;

grant select on public.category_counts to anon, authenticated, service_role;
