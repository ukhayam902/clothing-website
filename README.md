# UK Threads — Clothing Store (full-stack)

A React 19 + TypeScript + Vite + Tailwind 4 + react-router + Supabase
e-commerce app for the clothing store, with a full admin dashboard.
Same stack and patterns as the UK Accessories store
(`~/workspace/uk-accessories`), rebuilt for shirts, tees and polos.

**Brand name "UK Threads" is a placeholder and is not confirmed.**
All product photos are representative sample photos, all prices are sample
prices in PKR, and the payment/delivery/exchange policies are sample text —
to be confirmed by the owner. No shop address, phone number, business email
or social links have been confirmed for this clothing store, so none are
published here.

## What is inside

- Storefront: home (hero with 4 looks, Shop by Category, Best Sellers,
  Style That Speaks, Why Choose, FAQs, newsletter), `/shop` (filters +
  search + sort), `/product/:slug` (sizes S–XXL, Add to Cart / Buy Now),
  cart drawer, Cash-on-Delivery checkout with order confirmation,
  `/track` order tracking, `/login` + `/register`, `/profile`.
- Admin: `/admin` — Overview totals, Products CRUD (name, price, stock,
  category, sizes, fabric, image upload to Supabase Storage, sample flag),
  Orders (status: Pending / Confirmed / Processing / Shipped / Delivered /
  Cancelled; payment status), Shipping methods, Settings (store name,
  slogan, currency, COD fee).
- Data: live Supabase first, local sample catalogue fallback when Supabase
  is not configured (demo mode). Orders are created server-side by the
  `create_clothing_order()` RPC (validates prices/stock, decrements stock
  atomically). No service-role key anywhere in frontend code.

## Run locally

```bash
npm install
cp .env.example .env   # then fill in VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5173
npm run build          # tsc + vite build
npm run preview        # serve the production build
```

Without an anon key the app runs in **demo mode**: the 30 sample products
load from `src/data/catalog.ts`, orders stay in the browser, and the admin
preview is available from the demo sign-in button on `/login`.

## Supabase setup (parent agent / owner runs these — do NOT run from here)

Same project as UK Accessories — **https://cnkdeotxnaxlavvrmzyr.supabase.co**
("ukhayam902's Project", org UK Mobile Zone). The UK Accessories
migrations 001/002/003 must already be applied there (they created
`public.profiles`, `public.user_roles` and the SECURITY DEFINER
`public.is_admin()` function). This app reuses them and does **not**
recreate them.

1. In Supabase Dashboard → SQL Editor, run in order:
   - `supabase/migrations/001_clothing_tables.sql` — `clothing_categories`,
     `clothing_products`, `clothing_orders`, `clothing_order_items`,
     `clothing_store_settings`, `clothing_shipping_methods` + RLS
     (public read for the published catalogue, admin-only writes via the
     existing `public.is_admin(auth.uid())`, customers see only own orders).
   - `supabase/migrations/002_clothing_order_rpc.sql` — the
     `create_clothing_order()` function (COD only, sizes, server-side total
     and stock check).
   - `supabase/seed.sql` — 4 categories + 30 sample products
     (`is_demo = true`, stock 50) + store settings + COD shipping method
     (Rs. 250, free over Rs. 5,000).
2. Storage → create a **public** bucket `clothing-product-images` (admin
   product-photo uploads go here).
3. Authentication → the admin user is **ukhayam902@gmail.com** — the same
   Supabase Auth account as UK Accessories, which already has the `admin`
   row in `public.user_roles`. No new user is created by this app and no
   password is stored anywhere in this repo. If the role row is missing:
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'ukhayam902@gmail.com'
   on conflict (user_id) do update set role = 'admin';
   ```
   (Run only after confirming that email is the owner's admin account.)
4. Project Settings → API → copy the **anon public key** into `.env` as
   `VITE_SUPABASE_ANON_KEY` (and into Vercel environment variables on
   deploy). Never use the service-role key in the app.

## Deploy (parent agent / owner)

- GitHub: push this directory to a repo, then import it in Vercel as a
  Vite project (SPA rewrite is in `vercel.json`). Set
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel env vars.
- The live static site currently serves from
  https://clothing-website-kohl.vercel.app (Vercel project
  `clothing-website`, GitHub `ukhayam902/clothing-website`). Replacing it
  with this app is a separate decision — do not switch the production
  deployment without the owner's go-ahead.

## SEO (carried over from the static site)

- `index.html`: title "UK Threads — Premium Shirts & Tees", 110-char meta
  description, canonical `https://clothing-website-kohl.vercel.app/`,
  Open Graph + Twitter meta, JSON-LD WebSite + Organization + FAQPage
  (the site's 6 FAQs, confirmed facts only).
- `public/robots.txt`, `public/sitemap.xml` (homepage + `/shop` + all 30
  `/product/:slug` URLs, lastmod 2026-11-09, no priority/changefreq —
  Google ignores them), `public/llms.txt`, `public/llms-full.txt`,
  `public/google38067bd907e81902.html` (Google Search Console verification
  file, exact content as supplied).
- Product images: extracted from the static export
  (`scripts/extract-images.py`, manifest in `scripts/products.json`).
  The four owner-photo products (Olive Everyday Tee, Slate Grey Crew Tee,
  Navy Blue Crew Tee, Maroon Crew Tee) are extracted as-is. Image files
  keep their source format (`.webp` / `.jpeg` as in the export).
