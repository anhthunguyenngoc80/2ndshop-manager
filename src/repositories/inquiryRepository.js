import { supabase, unwrap } from '../lib/supabase'
export const inquiryRepository = {
  list: async () => unwrap(await supabase.from('inquiries').select('*').order('created_at', { ascending: false })),
  setStatus: async (id, status) => unwrap(await supabase.from('inquiries').update({ status }).eq('id', id)),
  remove: async (id) => unwrap(await supabase.from('inquiries').delete().eq('id', id)),
}
