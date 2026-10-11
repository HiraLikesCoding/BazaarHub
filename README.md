# BazaarHub

A complete e-commerce platform: modern storefront + full admin panel, built on **Next.js (App Router)** and **Supabase** (Postgres, Auth, Realtime) with **Tailwind CSS v4**.

---

## Features

### Storefront
- Home page with hero, categories, featured products, promotions and best sellers (server-rendered + ISR)
- `/shop` with search, category, price, rating, stock and sale filters, sorting and pagination — all shareable via the URL (results update live over React Query)
- Product detail page with gallery, specs, ratings, reviews, related products and SEO metadata
- Cart and wishlist persisted in `localStorage` (works for guests)
- Checkout with validation, order summary and cash-on-delivery — orders are placed through a transactional Postgres function that re-reads prices and decrements stock atomically
- Auth (register / login) via Supabase Auth, order history, profile and wishlist in the account area
- Order confirmation, toasts, loading skeletons, empty/error states, responsive design
- Static pages: about, contact, FAQ, shipping, privacy, terms + custom 404 / error pages

### Admin panel (`/admin`)
- Dashboard: revenue, orders, products, customers, 7-day sales chart, low-stock alerts, recent orders (one `admin_stats()` RPC)
- Orders: filter, search, detail view and status updates — delivered marks payment paid, cancelled restores stock server-side (`set_order_status()`), and the table **updates in realtime** via Supabase subscriptions
- Products and categories: full CRUD (row-level security restricts writes to admins)
- Customers: order counts and lifetime spend
- Inventory: stock health filters and sorting
- Route guard: only logged-in admins can open any admin screen

### Backend (Supabase)
- Postgres schema with row-level security on every table: public catalog reads, owner-scoped orders, admin-only writes
- Supabase Auth with a trigger that creates a `profiles` row on signup; roles (`customer` / `admin`) live on the profile
- Transactional SQL functions: `place_order()` (atomic stock + order numbers), `add_product_review()`, `set_order_status()`, `admin_stats()`
- `on delete restrict` keeps categories that are still in use from disappearing
- Generated `effective_price` column, trigram search indexes, realtime on `orders`

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS 4, TanStack Query |
| Backend | Supabase — Postgres + RLS, Auth, Realtime |
| Data access | `@supabase/supabase-js` (browser + server components) |
| Migrations | SQL files in `supabase/migrations/` (run in the SQL editor or via the CLI) |

---

## Getting started

1. **Create a Supabase project** (free tier is enough).
2. **Run the migrations** in order in the SQL editor (Dashboard → SQL Editor), or with the CLI:
   `supabase link` → `supabase db push`. Files: `supabase/migrations/20261011*.sql` (6 files).
3. **Configure auth**: Authentication → Providers → Email — turn *Confirm email* off so register logs people in immediately (like the old flow).
4. **Environment**: copy `.env.example` values into `client/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # seed script only
   ```
5. **Seed the demo catalog** (categories, products, demo accounts, sample orders):
   ```
   npm run seed:supabase
   ```
   Logins: `admin@bazaarhub.com` / `Admin@123` and `customer@bazaarhub.com` / `Customer@123`.
6. **Develop**:
   ```
   npm run install:client
   npm run dev
   ```
   Storefront: http://localhost:3000 — admin: http://localhost:3000/admin

### Deploying (Vercel)

The repo deploys as a single Next.js app (`vercel.json` points the build at `client/`). Create a Vercel project from the repo, add the two `NEXT_PUBLIC_SUPABASE_*` values under Settings → Environment Variables, and deploy.

---

## Project structure

```
bazaarhub/
├── client/                  # Next.js storefront + admin
│   ├── app/
│   │   ├── (store)/         # public routes (shop, cart, checkout, account...)
│   │   └── admin/           # protected admin routes
│   ├── components/          # ui, product, layout, shop, cart, checkout, admin...
│   ├── lib/                 # supabase client, formatting, constants
│   ├── services/            # data access per domain (products, orders, auth, admin)
│   └── scripts/seed-supabase.mjs
├── supabase/
│   ├── migrations/          # schema, RLS, triggers, SQL functions
│   └── seed-data.js         # demo catalog shared with the seed script
└── .github/workflows/ci.yml # lint + build
```

### How the data layer is organised

- `client/lib/supabase.js` — shared anon client, build-time guard, filter escaping
- `client/services/*.js` — one module per domain; every response is mapped to the shape the components expect (`_id`, `discountPrice`, `numReviews`, ...)
- RLS is the authorization layer: the browser talks to Postgres directly, and the SQL functions keep the transactional rules (stock, order numbers, review averages) server-side
- Server components fetch at ISR intervals; client views use TanStack Query with the server render as `initialData`

---

## License

MIT
