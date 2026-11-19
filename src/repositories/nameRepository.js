import { supabase, unwrap } from '../lib/supabase'
export const nameRepository = {
  list: async () => unwrap(await supabase.from('saved_names').select('*').order('created_at', { ascending: false })),
  create: async (name) => unwrap(await supabase.from('saved_names').insert({ name })),
  remove: async (id) => unwrap(await supabase.from('saved_names').delete().eq('id', id)),
}
