-- =========================================================
-- Cửa hàng online cho khách (chạy 1 lần sau schema.sql)
-- =========================================================
alter table products add column if not exists is_published boolean not null default false;
alter table products add column if not exists measurements jsonb not null default '[]';

create table if not exists store_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  shop_name text not null default 'Cửa hàng',
  intro text,
  contact_phone text,
  contact_threads text,
  contact_instagram text,
  visible_fields jsonb not null default '{"sale_price":true,"category":true,"material":true,"color":true,"size":true,"quantity":false,"note":false,"styling_ideas":false,"created_at":false,"measurements":true}',
  created_at timestamptz not null default now()
);

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  contact_type text not null check (contact_type in ('threads','instagram','phone')),
  contact_value text not null,
  note text,
  items jsonb not null default '[]',
  status text not null default 'new' check (status in ('new','done')),
  created_at timestamptz not null default now()
);
create index if not exists inquiries_user_idx on inquiries (user_id, created_at desc);

alter table store_settings enable row level security;
alter table inquiries enable row level security;
create policy "owner_all" on store_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "owner_all" on inquiries for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Khách (anon) KHÔNG đọc trực tiếp bảng; chỉ gọi 2 hàm dưới đây.
-- Hàm chỉ trả về sản phẩm đang đăng bán và các trường admin cho phép (không bao giờ có giá nhập, nhà cung cấp).
create or replace function public_storefront() returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare s store_settings%rowtype; vf jsonb; items jsonb;
begin
  select * into s from store_settings order by created_at limit 1;
  if not found then return jsonb_build_object('shop', null, 'products', '[]'::jsonb); end if;
  vf := s.visible_fields;
  select coalesce(jsonb_agg(t.item order by t.sold, t.created desc), '[]'::jsonb) into items from (
    select p.created_at as created, (p.status = 'sold') as sold,
      jsonb_strip_nulls(jsonb_build_object(
        'id', p.id, 'name', p.name, 'status', p.status,
        'in_stock', (p.status = 'available' and p.quantity > 0),
        'sale_price', case when coalesce((vf->>'sale_price')::boolean, false) then p.sale_price end,
        'category', case when coalesce((vf->>'category')::boolean, false) then p.category end,
        'material', case when coalesce((vf->>'material')::boolean, false) then p.material end,
        'color', case when coalesce((vf->>'color')::boolean, false) then p.color end,
        'size', case when coalesce((vf->>'size')::boolean, false) then p.size end,
        'quantity', case when coalesce((vf->>'quantity')::boolean, false) then p.quantity end,
        'note', case when coalesce((vf->>'note')::boolean, false) then p.note end,
        'styling_ideas', case when coalesce((vf->>'styling_ideas')::boolean, false) then p.styling_ideas end,
        'created_at', case when coalesce((vf->>'created_at')::boolean, false) then p.created_at end,
        'measurements', case when coalesce((vf->>'measurements')::boolean, false) and jsonb_array_length(p.measurements) > 0 then p.measurements end,
        'media', coalesce((select jsonb_agg(jsonb_build_object('url', m.url, 'type', m.media_type) order by m.position)
                           from product_media m where m.product_id = p.id), '[]'::jsonb)
      )) as item
    from products p where p.user_id = s.user_id and p.is_published
  ) t;
  return jsonb_build_object(
    'shop', jsonb_build_object('name', s.shop_name, 'intro', s.intro, 'phone', s.contact_phone,
                               'threads', s.contact_threads, 'instagram', s.contact_instagram, 'visible', vf),
    'products', items);
end $$;

create or replace function submit_inquiry(p_name text, p_type text, p_value text, p_note text, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from store_settings order by created_at limit 1;
  if owner is null then raise exception 'Cửa hàng chưa sẵn sàng'; end if;
  if length(trim(coalesce(p_name, ''))) = 0 or length(p_name) > 100 then raise exception 'Tên không hợp lệ'; end if;
  if p_type not in ('threads', 'instagram', 'phone') then raise exception 'Kênh liên hệ không hợp lệ'; end if;
  if length(trim(coalesce(p_value, ''))) = 0 or length(p_value) > 100 then raise exception 'Thông tin liên hệ không hợp lệ'; end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 50 then raise exception 'Danh sách sản phẩm không hợp lệ'; end if;
  insert into inquiries (user_id, customer_name, contact_type, contact_value, note, items)
  values (owner, trim(p_name), p_type, trim(p_value), left(p_note, 500), coalesce(p_items, '[]'::jsonb));
end $$;

revoke all on function public_storefront() from public;
revoke all on function submit_inquiry(text, text, text, text, jsonb) from public;
grant execute on function public_storefront() to anon, authenticated;
grant execute on function submit_inquiry(text, text, text, text, jsonb) to anon, authenticated;
