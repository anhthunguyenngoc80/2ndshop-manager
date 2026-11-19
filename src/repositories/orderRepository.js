import { supabase, unwrap } from '../lib/supabase'
export const orderRepository = {
  list: async () => unwrap(await supabase.from('orders').select('*, order_items(*, products(name))').order('created_at', { ascending: false })),
  create: async (o) => unwrap(await supabase.from('orders').insert(o).select().single()),
  update: async (id, patch) => unwrap(await supabase.from('orders').update(patch).eq('id', id).select().single()),
  remove: async (id) => unwrap(await supabase.from('orders').delete().eq('id', id)),
  insertItems: async (rows) => rows.length && unwrap(await supabase.from('order_items').insert(rows)),
  deleteItems: async (orderId) => unwrap(await supabase.from('order_items').delete().eq('order_id', orderId)),
  history: async (orderId) => unwrap(await supabase.from('order_status_history').select('*').eq('order_id', orderId).order('changed_at', { ascending: false })),
}
