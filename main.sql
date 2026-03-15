create extension if not exists pgcrypto;

------------------------------------------------
-- PRODUCTS
------------------------------------------------

create table products (
  id uuid primary key default gen_random_uuid(),
  name text,
  barcode text unique,
  price numeric,
  created_at timestamp default now()
);

------------------------------------------------
-- INVENTORY
------------------------------------------------

create table inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  stock int default 0
);

------------------------------------------------
-- STOCK MOVEMENTS (IMPORT / EXPORT LOG)
------------------------------------------------

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  type text,
  quantity int,
  price numeric,
  created_by text,
  note text,
  created_at timestamp default now()
);

------------------------------------------------
-- INVOICES
------------------------------------------------

create table invoices (
  id uuid primary key default gen_random_uuid(),
  total numeric,
  created_at timestamp default now()
);

------------------------------------------------
-- INVOICE ITEMS
------------------------------------------------

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  product_id uuid references products(id),
  qty int,
  price numeric
);

------------------------------------------------
-- SALES (DATASET FOR AI)
------------------------------------------------

create table sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  quantity int,
  price numeric,
  created_at timestamp default now()
);

------------------------------------------------
-- USERS
------------------------------------------------

create table users (
  id uuid primary key,
  email text unique,
  role text default 'sale',
  created_at timestamp default now()
);