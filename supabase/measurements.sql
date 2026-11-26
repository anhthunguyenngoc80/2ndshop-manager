-- Thêm số đo (dài, rộng, V1…) cho sản phẩm. Chạy 1 lần trong SQL Editor.
alter table products add column if not exists measurements jsonb not null default '[]';

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

grant execute on function public_storefront() to anon, authenticated;

-- Bật hiển thị số đo cho khách ở cửa hàng hiện có (admin có thể tắt trong Cài đặt)
update store_settings set visible_fields = visible_fields || '{"measurements":true}' where not (visible_fields ? 'measurements');
