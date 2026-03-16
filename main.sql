create extension if not exists pgcrypto;

------------------------------------------------
-- USERS
------------------------------------------------

create table if not exists public.users (
  id uuid primary key,
  email text unique,
  role text check (role in ('admin','seller')) default 'seller',
  created_at timestamp default now()
);

------------------------------------------------
-- CATEGORIES
------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamp default now()
);

------------------------------------------------
-- PRODUCTS
------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  barcode text unique,
  price numeric default 0,
  min_stock int default 5,
  category_id uuid,
  created_at timestamp default now()
);

------------------------------------------------
-- INVENTORY
------------------------------------------------

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid unique,
  stock int default 0
);

------------------------------------------------
-- STOCK MOVEMENTS
------------------------------------------------

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,
  type text check (type in ('import','export')),
  quantity int not null,
  price numeric,
  created_by text,
  note text,
  created_at timestamp default now()
);

------------------------------------------------
-- INVOICES
------------------------------------------------

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  total numeric default 0,
  created_at timestamp default now()
);

------------------------------------------------
-- INVOICE ITEMS
------------------------------------------------

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid,
  product_id uuid,
  qty int not null,
  price numeric not null
);

------------------------------------------------
-- SALES (AI DATASET)
------------------------------------------------

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,
  quantity int not null,
  price numeric,
  created_at timestamp default now()
);

------------------------------------------------
-- FOREIGN KEYS
------------------------------------------------

alter table products
add constraint products_category_fkey
foreign key (category_id)
references categories(id)
on delete set null;

alter table inventory
add constraint inventory_product_fkey
foreign key (product_id)
references products(id)
on delete cascade;

alter table stock_movements
add constraint stock_movements_product_fkey
foreign key (product_id)
references products(id)
on delete cascade;

alter table invoice_items
add constraint invoice_items_invoice_fkey
foreign key (invoice_id)
references invoices(id)
on delete cascade;

alter table invoice_items
add constraint invoice_items_product_fkey
foreign key (product_id)
references products(id);

alter table sales
add constraint sales_product_fkey
foreign key (product_id)
references products(id)
on delete cascade;

------------------------------------------------
-- TRIGGER: AUTO CREATE INVENTORY ROW
------------------------------------------------

create or replace function create_inventory_row()
returns trigger
language plpgsql
as $$

begin

  insert into inventory(product_id, stock)
  values (new.id, 0);

  return new;

end;

$$;

create trigger create_inventory_after_product
after insert on products
for each row
execute procedure create_inventory_row();

------------------------------------------------
-- TRIGGER: UPDATE STOCK AFTER MOVEMENT
------------------------------------------------

create or replace function update_stock_after_movement()
returns trigger
language plpgsql
as $$

begin

  if new.type = 'import' then

    update inventory
    set stock = stock + new.quantity
    where product_id = new.product_id;

  elsif new.type = 'export' then

    update inventory
    set stock = stock - new.quantity
    where product_id = new.product_id;

  end if;

  return new;

end;

$$;

create trigger update_stock_after_movement
after insert on stock_movements
for each row
execute procedure update_stock_after_movement();

------------------------------------------------
-- TRIGGER: AUTO CREATE USER FROM AUTH
------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$

begin

  insert into public.users (id, email, role)
  values (new.id, new.email, 'seller')
  on conflict (id) do nothing;

  return new;

end;

$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure handle_new_user();