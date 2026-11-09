-- UK Threads (clothing) — payments v2 (run AFTER 001 + 002)
-- Adds Easypaisa and JazzCash alongside Cash on Delivery, and a txn_id
-- column for the wallet transaction ID the customer enters at checkout.
-- Payment details confirmed by the owner 2026-11-09:
--   Easypaisa 03170851250, JazzCash 03170851250, account title Umar Khayam.
--   WhatsApp 0317 0851250 for screenshot/transaction-ID verification.
--
-- NOTE on the old function: 002 created create_clothing_order() with 9
-- parameters. This file creates a NEW 11-parameter overload (create or
-- replace with a different signature does not drop the old one). The old
-- 9-arg version is left in place on purpose so the currently-live site
-- keeps working until the new app code is deployed; it hardcodes COD.
-- Once the new app is live, the old signature can be dropped:
--   drop function if exists public.create_clothing_order
--     (text, text, text, text, text, text, text, jsonb, text);

-- (a) Widen the payment_method check. 001 declared it inline (unnamed),
-- so Postgres auto-named it clothing_orders_payment_method_check. Look
-- it up from pg_constraint instead of assuming the name.
do $$
declare
  v_con text;
begin
  select conname into v_con
    from pg_constraint
   where conrelid = 'public.clothing_orders'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%payment_method%';
  if v_con is not null then
    execute format('alter table public.clothing_orders drop constraint %I', v_con);
  end if;
end $$;

alter table public.clothing_orders
  add constraint clothing_orders_payment_method_check
  check (payment_method in ('Cash on Delivery', 'Easypaisa', 'JazzCash'));

-- (b) Transaction ID for Easypaisa/JazzCash payments (null for COD).
alter table public.clothing_orders
  add column if not exists txn_id text;

-- (c) Order RPC with payment support. Same behaviour as 002 (price/stock
-- validation from the DB, server-side total, atomic stock decrement,
-- UT- id, SECURITY DEFINER) plus:
--   p_payment_method: one of 'Cash on Delivery' | 'Easypaisa' | 'JazzCash'
--   p_txn_id: required for Easypaisa/JazzCash, stored on the order
--   payment_status: 'Pay on delivery' for COD, 'Awaiting verification'
--   for wallet payments (admin marks it 'Paid' after WhatsApp verification).
create or replace function public.create_clothing_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_city text,
  p_address text,
  p_postal_code text,
  p_country text,
  p_items jsonb,
  p_notes text default null,
  p_payment_method text default 'Cash on Delivery',
  p_txn_id text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id text;
  v_item jsonb;
  v_product record;
  v_qty int;
  v_size text;
  v_items_total int := 0;
  v_shipping int := 0;
  v_ship_price int;
  v_ship_free int;
  v_attempt int := 0;
  v_payment_status text;
begin
  if p_customer_name is null or btrim(p_customer_name) = '' then
    raise exception 'customer name required';
  end if;
  if p_phone is null or btrim(p_phone) = '' then
    raise exception 'phone number required';
  end if;
  if p_city is null or btrim(p_city) = '' then
    raise exception 'city required';
  end if;
  if p_address is null or btrim(p_address) = '' then
    raise exception 'address required';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty';
  end if;
  if p_payment_method is null
     or p_payment_method not in ('Cash on Delivery', 'Easypaisa', 'JazzCash') then
    raise exception 'invalid payment method';
  end if;
  if p_payment_method in ('Easypaisa', 'JazzCash')
     and (p_txn_id is null or btrim(p_txn_id) = '') then
    raise exception 'transaction ID required for Easypaisa/JazzCash';
  end if;
  v_payment_status := case
    when p_payment_method = 'Cash on Delivery' then 'Pay on delivery'
    else 'Awaiting verification' end;

  -- Shipping from the first active method (seeded: COD Pakistan, 250 / free over 5000).
  select price, free_over into v_ship_price, v_ship_free
    from public.clothing_shipping_methods where active = true order by price asc limit 1;

  -- Validate items and compute the total from DB prices (not client prices).
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.clothing_products
      where id = (v_item ->> 'product_id') and published = true;
    if not found then
      raise exception 'product not found: %', (v_item ->> 'product_id');
    end if;
    v_qty := (v_item ->> 'qty')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'invalid quantity';
    end if;
    v_size := nullif(v_item ->> 'size', '');
    if v_size is null or not (v_size = any (v_product.sizes)) then
      raise exception 'invalid size for product: %', v_product.name;
    end if;
    if v_product.stock < v_qty then
      raise exception 'out of stock: %', v_product.name;
    end if;
    v_items_total := v_items_total + (v_product.price * v_qty);
  end loop;

  if v_ship_price is not null then
    v_shipping := case
      when v_ship_free is not null and v_items_total >= v_ship_free then 0
      else v_ship_price end;
  end if;

  loop
    v_order_id := 'UT-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.clothing_orders where id = v_order_id);
    v_attempt := v_attempt + 1;
    if v_attempt > 20 then
      raise exception 'could not generate order id';
    end if;
  end loop;

  insert into public.clothing_orders
    (id, user_id, customer_name, phone, email, city, address, postal_code, country,
     total, status, payment_method, payment_status, txn_id, internal_notes)
    values (v_order_id, v_user_id, p_customer_name, p_phone, nullif(p_email, ''),
      p_city, p_address, nullif(p_postal_code, ''), coalesce(nullif(p_country, ''), 'Pakistan'),
      v_items_total + v_shipping, 'Pending', p_payment_method, v_payment_status,
      nullif(p_txn_id, ''), nullif(p_notes, ''));

  -- Decrement stock atomically; a failure here rolls back the whole order.
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.clothing_products where id = (v_item ->> 'product_id');
    v_qty := (v_item ->> 'qty')::int;
    v_size := nullif(v_item ->> 'size', '');
    update public.clothing_products set stock = stock - v_qty
      where id = v_product.id and stock >= v_qty;
    if not found then
      raise exception 'out of stock: %', v_product.name;
    end if;
    insert into public.clothing_order_items (order_id, product_id, qty, unit_price, size)
      values (v_order_id, v_product.id, v_qty, v_product.price, v_size);
  end loop;

  return v_order_id;
end $$;

grant execute on function public.create_clothing_order(text, text, text, text, text, text, text, jsonb, text, text, text) to anon, authenticated;
