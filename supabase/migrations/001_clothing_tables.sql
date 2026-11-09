-- UK Threads (clothing) — Supabase schema v1
-- SAME project as UK Accessories: https://cnkdeotxnaxlavvrmzyr.supabase.co
-- ("ukhayam902's Project", org UK Mobile Zone). Apply in Supabase Dashboard
-- > SQL Editor, or with the Supabase CLI, AFTER the UK Accessories
-- migrations 001/002/003 (which created public.profiles, public.user_roles
-- and the SECURITY DEFINER public.is_admin() function).
-- This file does NOT recreate profiles / user_roles / is_admin — it reuses
-- them. The admin user ukhayam902@gmail.com already has the admin role.
-- NEVER put the service_role key in frontend code.

create extension if not exists pgcrypto;

create table if not exists public.clothing_categories (
  id text primary key, name text not null, slug text not null unique,
  description text, image_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.clothing_products (
  id text primary key, sku text not null unique, slug text not null unique,
  name text not null, category_id text not null references public.clothing_categories(id),
  price integer not null check (price >= 0), compare_at integer check (compare_at is null or compare_at >= 0),
  stock integer not null default 0 check (stock >= 0),
  description text, image_url text, fabric text,
  sizes text[] not null default array['S','M','L','XL','XXL'],
  featured boolean not null default false, bestseller boolean not null default false,
  is_new boolean not null default false,
  is_demo boolean not null default true, published boolean not null default true,
  seo_title text, seo_description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.clothing_orders (
  id text primary key, user_id uuid references public.profiles(id),
  customer_name text not null, phone text not null, email text not null,
  city text not null, address text not null, postal_code text, country text not null default 'Pakistan',
  total int not null check (total >= 0),
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled')),
  payment_method text not null default 'Cash on Delivery' check (payment_method in ('Cash on Delivery')),
  payment_status text not null default 'Pay on delivery',
  internal_notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.clothing_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.clothing_orders(id) on delete cascade,
  product_id text not null references public.clothing_products(id), qty int not null check (qty > 0),
  unit_price int not null check (unit_price >= 0), size text not null default 'M'
);
create table if not exists public.clothing_store_settings (
  id int primary key default 1, store_name text not null default 'UK Threads',
  slogan text not null default 'Premium Shirts & Tees',
  currency text not null default 'PKR',
  announcement text, cod_fee int not null default 250,
  check (id = 1)
);
create table if not exists public.clothing_shipping_methods (
  id text primary key, name text not null, price int not null default 0,
  free_over int, zone text not null default 'Pakistan', estimate_days text, active boolean not null default true
);

create index if not exists idx_clothing_products_category on public.clothing_products(category_id);
create index if not exists idx_clothing_products_slug on public.clothing_products(slug);
create index if not exists idx_clothing_orders_user on public.clothing_orders(user_id);
create index if not exists idx_clothing_orders_status on public.clothing_orders(status);
create index if not exists idx_clothing_order_items_order on public.clothing_order_items(order_id);

-- updated_at helper (shared with the accessories schema; no-op if present)
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_clothing_products_updated') then
    create trigger trg_clothing_products_updated before update on public.clothing_products for each row execute function public.touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_clothing_orders_updated') then
    create trigger trg_clothing_orders_updated before update on public.clothing_orders for each row execute function public.touch_updated_at();
  end if;
end $$;

-- RLS: enabled on every clothing table. Public reads only the published
-- catalogue; customers see only their own orders; admins manage everything
-- through the EXISTING public.is_admin(auth.uid()).
alter table public.clothing_categories enable row level security;
alter table public.clothing_products enable row level security;
alter table public.clothing_orders enable row level security;
alter table public.clothing_order_items enable row level security;
alter table public.clothing_store_settings enable row level security;
alter table public.clothing_shipping_methods enable row level security;

create policy "clothing catalogue read" on public.clothing_categories for select using (true);
create policy "clothing catalogue read" on public.clothing_products for select using (published = true);
create policy "clothing catalogue read" on public.clothing_shipping_methods for select using (active = true);
create policy "clothing catalogue read" on public.clothing_store_settings for select using (true);
create policy "admin manage clothing categories" on public.clothing_categories for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage clothing products" on public.clothing_products for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage clothing orders" on public.clothing_orders for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage clothing order items" on public.clothing_order_items for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage clothing settings" on public.clothing_store_settings for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage clothing shipping" on public.clothing_shipping_methods for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "own clothing orders" on public.clothing_orders for select using (user_id = auth.uid());
create policy "customer insert own clothing order" on public.clothing_orders for insert with check (user_id = auth.uid());
create policy "customer insert own clothing order items" on public.clothing_order_items for insert with check (exists (
  select 1 from public.clothing_orders o where o.id = order_id and o.user_id = auth.uid()));

-- Storage bucket (create in Dashboard > Storage if not present):
-- clothing-product-images (public, for product photos uploaded from /admin)
