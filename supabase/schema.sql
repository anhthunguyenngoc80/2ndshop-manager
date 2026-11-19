-- =========================================================
-- Schema: quản lý sản phẩm, đơn hàng, thống kê (Supabase)
-- Chạy trong SQL Editor của Supabase
-- =========================================================

-- ---------- Bảng ----------
create table products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text,
  category text,
  cost_price numeric(14,0) check (cost_price >= 0),
  sale_price numeric(14,0) check (sale_price >= 0),
  material text,
  color text,
  size text,
  quantity int not null default 1 check (quantity >= 0),
  status text not null default 'available' check (status in ('available','sold')),
  note text,
  supplier text,
  styling_ideas text,
  created_at timestamptz not null default now()
);

create table product_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  storage_path text not null,
  media_type text not null default 'image' check (media_type in ('image','video')),
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  scheduled_date date not null,
  caption text,
  status text not null default 'planned' check (status in ('planned','posted','cancelled')),
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null,
  customer_name text not null,
  phone text,
  address text,
  payment_method text not null default 'cod' check (payment_method in ('cod','transfer','cash')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','partial','paid')),
  amount_paid numeric(14,0) not null default 0 check (amount_paid >= 0),
  status text not null default 'pending'
    check (status in ('pending','confirmed','shipping','delivered','cancelled','returned')),
  inventory_applied boolean not null default false, -- chống trừ kho 2 lần
  note text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (user_id, code)
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(14,0) not null check (unit_price >= 0), -- giá bán tại thời điểm tạo đơn
  unit_cost numeric(14,0)                                    -- giá vốn tại thời điểm tạo đơn
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_at timestamptz not null default now()
);

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  unique (user_id, name)
);

-- kind: 'incurred' = đã phát sinh, 'planned' = dự kiến
-- Giá nhập sản phẩm lưu ở products.cost_price; khoản nhập hàng theo lô lưu ở đây
-- (category 'Giá nhập', gắn product_id nếu có). Giá vốn hàng đã bán lấy từ order_items.unit_cost.
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14,0) not null check (amount >= 0),
  category_id uuid references expense_categories(id) on delete set null,
  kind text not null default 'incurred' check (kind in ('incurred','planned')),
  incurred_on date not null default current_date,
  product_id uuid references products(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table saved_names (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------- Index ----------
create index on products (user_id, status, created_at desc);
create index on product_media (product_id, position);
create index on schedules (user_id, scheduled_date);
create index on orders (user_id, status, created_at desc);
create index on order_items (order_id);
create index on expenses (user_id, incurred_on);

-- ---------- Row Level Security ----------
do $$
declare t text;
begin
  foreach t in array array['products','product_media','schedules','orders','order_items',
    'order_status_history','expense_categories','expenses','saved_names']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "owner_all" on %I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ---------- Nghiệp vụ tồn kho & lịch sử đơn (idempotent) ----------
create or replace function handle_order_status_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Ghi lịch sử khi đổi trạng thái
  if new.status is distinct from old.status then
    insert into order_status_history (user_id, order_id, from_status, to_status)
    values (new.user_id, new.id, old.status, new.status);
  end if;

  -- Giao thành công: trừ kho đúng 1 lần
  if new.status = 'delivered' and new.inventory_applied = false then
    update products p
       set quantity = greatest(p.quantity - oi.quantity, 0)
      from order_items oi
     where oi.order_id = new.id and oi.product_id = p.id;
    update products set status = 'sold'
     where quantity = 0 and id in (select product_id from order_items where order_id = new.id);
    new.inventory_applied := true;
    new.delivered_at := coalesce(new.delivered_at, now());

  -- Hoàn/hủy sau khi đã trừ kho: cộng lại đúng 1 lần
  elsif new.status in ('returned','cancelled') and new.inventory_applied = true then
    update products p
       set quantity = p.quantity + oi.quantity, status = 'available'
      from order_items oi
     where oi.order_id = new.id and oi.product_id = p.id;
    new.inventory_applied := false;
  end if;
  return new;
end $$;

create or replace function log_order_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into order_status_history (user_id, order_id, from_status, to_status)
  values (new.user_id, new.id, null, new.status);
  return new;
end $$;
create trigger trg_order_created after insert on orders
  for each row execute function log_order_created();
create trigger trg_order_status_upd before update of status on orders
  for each row execute function handle_order_status_change();

-- ---------- Storage ----------
-- Tạo bucket 'product-media' (private hoặc public tùy nhu cầu), đường dẫn: {user_id}/{product_id}/{file}
-- insert into storage.buckets (id, name, public) values ('product-media','product-media', true);
create policy "media_owner_all" on storage.objects for all to authenticated
  using (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'product-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Công thức thống kê (tham khảo cho statsService) ----------
-- Doanh thu thực tế  = sum(unit_price*quantity) của đơn status='delivered' theo delivered_at
-- Giá vốn đã bán     = sum(unit_cost*quantity) của cùng các đơn đó
-- Chi phí thực tế    = sum(amount) từ expenses where kind='incurred' (loại 'Giá nhập' để tránh trùng với giá vốn)
-- Lợi nhuận thực tế  = Doanh thu thực tế - Giá vốn đã bán - Chi phí thực tế (marketing, vận chuyển, ...)
-- Còn phải thu       = sum(total - amount_paid) của đơn chưa hủy/hoàn
