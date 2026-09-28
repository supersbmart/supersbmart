-- SUPERSBMART SUPABASE SCHEMA
create extension if not exists pgcrypto;

create type public.user_role as enum ('customer','admin');
create type public.payment_state as enum ('pending','success','failed','refunded');
create type public.order_state as enum ('pending','payment_verification','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','return_requested','returned','refund_processing','refunded');

create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text,
 email text,
 phone text,
 role public.user_role not null default 'customer',
 created_at timestamptz not null default now()
);

create table if not exists public.addresses(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 address_line text not null,
 city text not null,
 state text not null,
 pincode text not null,
 is_default boolean default false,
 created_at timestamptz not null default now()
);

create table if not exists public.products(
 id uuid primary key default gen_random_uuid(),
 name text not null,
 category text,
 brand text,
 description text,
 price numeric(12,2) not null default 0,
 mrp numeric(12,2) not null default 0,
 discount_percent numeric(5,2) default 0,
 image_url text,
 stock integer not null default 0,
 active boolean not null default true,
 created_at timestamptz not null default now()
);

create table if not exists public.orders(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete restrict,
 subtotal numeric(12,2) not null default 0,
 shipping_fee numeric(12,2) not null default 0,
 delivery_fee numeric(12,2) not null default 50,
 total_amount numeric(12,2) not null default 0,
 payment_status public.payment_state not null default 'pending',
 order_status public.order_state not null default 'pending',
 delivery_address_id uuid references public.addresses(id),
 created_at timestamptz not null default now()
);

create table if not exists public.order_items(
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete cascade,
 product_id text,
 product_name text not null,
 quantity integer not null check(quantity>0),
 unit_price numeric(12,2) not null
);

create table if not exists public.payments(
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 utr text not null,
 status public.payment_state not null default 'pending',
 screenshot_url text,
 verified_by uuid references public.profiles(id),
 verified_at timestamptz,
 created_at timestamptz not null default now()
);

create table if not exists public.festival_offers(
 id uuid primary key default gen_random_uuid(),
 festival_name text not null,
 description text,
 discount_percent numeric(5,2) default 0,
 fixed_discount numeric(12,2) default 0,
 minimum_order numeric(12,2) default 0,
 maximum_discount numeric(12,2),
 category text,
 product_id text,
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 priority integer default 0,
 active boolean default true,
 created_at timestamptz not null default now()
);

create table if not exists public.coupons(
 id uuid primary key default gen_random_uuid(),
 code text unique not null,
 discount_percent numeric(5,2) default 0,
 fixed_discount numeric(12,2) default 0,
 minimum_order numeric(12,2) default 0,
 maximum_discount numeric(12,2),
 starts_at timestamptz,
 ends_at timestamptz,
 usage_limit integer,
 used_count integer default 0,
 active boolean default true,
 created_at timestamptz not null default now()
);

create table if not exists public.support_tickets(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 subject text not null,
 category text,
 message text not null,
 status text not null default 'open',
 admin_reply text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.banners(
 id uuid primary key default gen_random_uuid(),
 title text,
 image_url text,
 link_url text,
 starts_at timestamptz,
 ends_at timestamptz,
 active boolean default true,
 created_at timestamptz not null default now()
);

create table if not exists public.site_settings(
 key text primary key,
 value jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,email,full_name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''));
 return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.festival_offers enable row level security;
alter table public.coupons enable row level security;
alter table public.support_tickets enable row level security;
alter table public.banners enable row level security;
alter table public.site_settings enable row level security;

create policy "public read active products" on public.products for select using(active=true or public.is_admin());
create policy "admin manage products" on public.products for all using(public.is_admin()) with check(public.is_admin());

create policy "public read active festivals" on public.festival_offers for select using(active=true or public.is_admin());
create policy "admin manage festivals" on public.festival_offers for all using(public.is_admin()) with check(public.is_admin());

create policy "public read active banners" on public.banners for select using(active=true or public.is_admin());
create policy "admin manage banners" on public.banners for all using(public.is_admin()) with check(public.is_admin());

create policy "own profile" on public.profiles for select using(id=auth.uid() or public.is_admin());
create policy "own profile update" on public.profiles for update using(id=auth.uid() or public.is_admin()) with check(id=auth.uid() or public.is_admin());

create policy "own addresses" on public.addresses for all using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());

create policy "own orders" on public.orders for select using(user_id=auth.uid() or public.is_admin());
create policy "own order insert" on public.orders for insert with check(user_id=auth.uid());
create policy "admin order update" on public.orders for update using(public.is_admin()) with check(public.is_admin());

create policy "own order items" on public.order_items for select using(exists(select 1 from orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create policy "own order item insert" on public.order_items for insert with check(exists(select 1 from orders o where o.id=order_id and o.user_id=auth.uid()));

create policy "own payments" on public.payments for select using(user_id=auth.uid() or public.is_admin());
create policy "own payment insert" on public.payments for insert with check(user_id=auth.uid());
create policy "admin payment update" on public.payments for update using(public.is_admin()) with check(public.is_admin());

create policy "active coupons read" on public.coupons for select using(active=true or public.is_admin());
create policy "admin coupon manage" on public.coupons for all using(public.is_admin()) with check(public.is_admin());

create policy "own tickets" on public.support_tickets for select using(user_id=auth.uid() or public.is_admin());
create policy "own ticket insert" on public.support_tickets for insert with check(user_id=auth.uid());
create policy "admin ticket update" on public.support_tickets for update using(public.is_admin()) with check(public.is_admin());

create policy "admin settings" on public.site_settings for all using(public.is_admin()) with check(public.is_admin());

-- After creating your own account, make that account an admin:
-- update public.profiles set role='admin' where email='YOUR_ADMIN_EMAIL';


-- ===== SUPERSBMART CUSTOMER SERVICE / SUPPORT FILES =====
alter table if exists public.support_tickets add column if not exists order_id uuid references public.orders(id) on delete set null;
alter table if exists public.support_tickets add column if not exists attachment_path text;
alter table if exists public.support_tickets add column if not exists updated_at timestamptz not null default now();

insert into storage.buckets (id,name,public) values ('support-files','support-files',false)
on conflict (id) do update set public=false;

drop policy if exists "Support users upload own files" on storage.objects;
create policy "Support users upload own files" on storage.objects for insert to authenticated
with check (bucket_id='support-files' and (storage.foldername(name))[1]='support' and (storage.foldername(name))[2]=auth.uid()::text);

drop policy if exists "Support users view own files" on storage.objects;
create policy "Support users view own files" on storage.objects for select to authenticated
using (bucket_id='support-files' and (((storage.foldername(name))[1]='support' and (storage.foldername(name))[2]=auth.uid()::text) or public.is_admin()));

drop policy if exists "Admins delete support files" on storage.objects;
create policy "Admins delete support files" on storage.objects for delete to authenticated
using (bucket_id='support-files' and public.is_admin());

-- ===== SUPERSBMART PAYMENT SETTINGS + QR STORAGE =====
-- site_settings should contain only non-secret values for the public keys below.
alter table if exists public.site_settings
  add column if not exists is_public boolean not null default false;

-- Public customers may read only the payment/support settings explicitly marked public.
drop policy if exists "Public can read public site settings" on public.site_settings;
create policy "Public can read public site settings"
on public.site_settings
for select
using (
  is_public = true
  and key in ('upi_id','qr_url','payment_instructions','customer_care')
);

-- Storage bucket for QR/banner/product public assets.
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view site assets" on storage.objects;
create policy "Public can view site assets"
on storage.objects
for select
using (bucket_id = 'site-assets');

drop policy if exists "Admins can upload site assets" on storage.objects;
create policy "Admins can upload site assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-assets'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Admins can update site assets" on storage.objects;
create policy "Admins can update site assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-assets'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  bucket_id = 'site-assets'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Admins can delete site assets" on storage.objects;
create policy "Admins can delete site assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-assets'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
