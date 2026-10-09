# BazaarHub

A complete, production-ready e-commerce platform: modern storefront + full admin panel + REST API.

Built with **Next.js (App Router)**, **Express**, **MongoDB**, and **Tailwind CSS v4**.

---

## Features

### Storefront
- Home page with hero, categories, featured products, promotions and best sellers (server-rendered + ISR)
- `/shop` with search, category, price, rating, stock and sale filters, sorting and pagination — all shareable via the URL
- Product detail page with gallery, specs, ratings, reviews, related products and SEO metadata
- Cart and wishlist persisted in `localStorage` (works for guests)
- Guest-friendly checkout with validation, order summary and cash-on-delivery / demo card payment
- Order confirmation, order history, profile and wishlist in the account area
- Auth (register / login), toasts, loading skeletons, empty/error states, responsive design
- Static pages: about, contact, FAQ, shipping, privacy, terms + custom 404 / error pages

### Admin panel (`/admin`)
- Dashboard: revenue, orders, products, customers, 7-day sales chart, low-stock alerts, recent orders
- Products: create, edit, delete with image and pricing controls
- Orders: filter, search, detail view and status updates (stock restored on cancel)
- Customers: order counts and lifetime spend
- Categories: full CRUD
- Inventory: stock health filters and sorting
- Route guard: only logged-in admins can open any admin screen

### API
- JWT auth with role-based access (`admin` / `customer`), bcrypt password hashing
- Products with search, filters, sorting, pagination, reviews and related items
- Orders with server-side price calculation, atomic stock decrement and rollback on failure
- Rate limiting, Helmet security headers, CORS allow-list, request logging, central error handler
- Data validation with `express-validator`

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| Backend | Node.js, Express 4, Mongoose |
| Database | MongoDB (Atlas or local), `mongodb-memory-server` for zero-setup demos |
| Auth | JSON Web Tokens (localStorage), bcryptjs |
| Testing | API smoke test — 53 endpoint checks (`npm test`) |

---

## Project structure

```
bazaarhub/
├── client/                  # Next.js storefront + admin
│   ├── app/
│   │   ├── (store)/         # public routes (shop, cart, checkout, account...)
│   │   └── admin/           # protected admin routes
│   ├── components/          # ui, product, layout, shop, cart, checkout, admin...
│   ├── lib/                 # api wrapper, formatting, constants
│   ├── services/            # typed API calls (products, orders, auth, admin)
│   └── public/images/       # product imagery
├── server/                  # Express REST API
│   ├── config/              # db connection + in-memory Mongo helper
│   ├── controllers/         # route logic
│   ├── middleware/          # auth, validation, errors
│   ├── models/              # User, Product, Category, Order
│   ├── routes/              # /api/auth, /api/products, /api/orders, /api/admin
│   ├── seed/                # demo data + image handling
│   └── scripts/             # smoke test, image downloader, helpers
└── README.md
```

---

## Getting started

### Prerequisites
- Node.js 18+ and npm 9+
- MongoDB **or** nothing at all (see “Running without MongoDB”)

### 1. Install

```bash
git clone <your-repo-url> bazaarhub
cd bazaarhub
npm install --prefix server
npm install --prefix client
```

### 2. Configure environment

```bash
cp .env.example server/.env      # then edit the values
cp .env.example client/.env.local
```

| Variable | Where | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | server | MongoDB connection string |
| `JWT_SECRET` | server | Token signing secret (use a long random string) |
| `BCRYPT_SALT_ROUNDS` | server | Password hashing cost (default 12) |
| `PORT` | server | API port (default `5000`) |
| `CLIENT_URL` | server | Allowed CORS origin(s) |
| `NEXT_PUBLIC_API_URL` | client | API base URL, no trailing slash |

### 3. Seed demo data

```bash
npm run seed --prefix server
```

Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@bazaarhub.com` | `Admin@123` |
| Customer | `customer@bazaarhub.com` | `Customer@123` |

### 4. Run in development

```bash
# terminal 1 — API
npm run dev --prefix server

# terminal 2 — frontend
npm run dev --prefix client
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin
- API health check: http://localhost:5000/api/health

### Running without MongoDB

No local MongoDB? Use the bundled in-memory server (data resets on restart):

```bash
npm run mongo:prepare --prefix server   # one-time download of a MongoDB binary
npm run dev:memory --prefix server      # API + seeded demo data
```

### Download product images

All 60 images ship with the repo in `client/public/images/products/`. To re-download them:

```bash
npm run images --prefix server
```

---

## Scripts

| Command | Location | What it does |
| --- | --- | --- |
| `npm run dev` | server | API with auto-reload |
| `npm run start` | server | API in production mode |
| `npm run seed` | server | Reset and seed categories, products, users, demo orders |
| `npm run test` | server | End-to-end API smoke test (53 checks) |
| `npm run dev:memory` | server | API backed by an in-memory MongoDB |
| `npm run images` | server | Re-download catalogue images |
| `npm run dev` | client | Next.js dev server |
| `npm run build` / `npm start` | client | Production build / serve |

---

## API overview

Base URL: `http://localhost:5000` — JSON responses use `{ success, data }` and `{ success: false, message }`.

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/api/health` | public | Service health check |
| GET | `/api/products` | public | `search, category, minPrice, maxPrice, minRating, featured, inStock, onSale, ids, sort, page, limit` |
| GET | `/api/products/featured` | public | Home page highlights |
| GET | `/api/products/:id` | public | Accepts an id **or** a slug |
| GET | `/api/products/:id/related` | public | Same-category products |
| POST/PUT/DELETE | `/api/products` | admin | Catalogue management |
| POST | `/api/products/:id/reviews` | user | Rating + comment |
| GET | `/api/categories` | public | Categories with product counts |
| POST/PUT/DELETE | `/api/categories` | admin | Category management |
| POST | `/api/auth/register` · `/api/auth/login` | public | Returns `{ token, user }` |
| GET | `/api/auth/me` | user | Current profile |
| POST | `/api/orders` | user | Prices re-read from DB, stock decremented atomically |
| GET | `/api/orders/mine` | user | Own order history |
| GET | `/api/orders/:id` | owner/admin | Order detail |
| GET | `/api/orders` | admin | All orders, filterable |
| PUT | `/api/orders/:id/status` | admin | Status update, restock on cancel |
| GET | `/api/admin/stats` | admin | Dashboard totals + 7-day sales |
| GET | `/api/admin/inventory` | admin | Stock health |
| GET | `/api/admin/customers` | admin | Customers with order totals |

---

## Testing

```bash
npm run test --prefix server   # boots in-memory MongoDB, seeds, runs 53 endpoint checks
npm run build --prefix client  # type/route validation + production bundle
```

---

## Deployment

### Frontend → Vercel
1. Import the repo in Vercel and set the **root directory** to `client/`
2. Add `NEXT_PUBLIC_API_URL=https://your-api.example.com`
3. Deploy — no config file needed

### Backend → Render / Railway / Fly.io
1. Create a Node service with **root directory** `server/`
2. Build command: `npm install` · Start command: `npm start`
3. Set `MONGODB_URI` (MongoDB Atlas), `JWT_SECRET`, `CLIENT_URL=https://your-app.vercel.app`, `PORT=5000`

### Database → MongoDB Atlas
Create a free M0 cluster, allow network access, and put the connection string in `MONGODB_URI`.

Then seed once against production: `npm run seed --prefix server`.

---

## Notes

- Prices are in **USD**; shipping is a flat **$6.99**, free over **$75**
- Order `paymentStatus` values: `Unpaid` / `Paid` / `Refunded`
- Card and wallet payments are demo placeholders — cash on delivery is fully wired
- Cart, wishlist and the auth token live in `localStorage`; nothing sensitive is stored server-side

## License

MIT
