import { supabase, unwrap } from '../lib/supabase'
export const scheduleRepository = {
  list: async () => unwrap(await supabase.from('schedules').select('*, products(id,name,product_media(url,position,media_type))').order('scheduled_date')),
  create: async (s) => unwrap(await supabase.from('schedules').insert(s)),
  update: async (id, s) => unwrap(await supabase.from('schedules').update(s).eq('id', id)),
  remove: async (id) => unwrap(await supabase.from('schedules').delete().eq('id', id)),
}
