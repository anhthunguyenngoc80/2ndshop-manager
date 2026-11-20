import { supabase, unwrap } from '../lib/supabase'
export const storefrontRepository = {
  get: async () => unwrap(await supabase.rpc('public_storefront')),
  submitInquiry: async (p) => unwrap(await supabase.rpc('submit_inquiry', { p_name: p.name, p_type: p.type, p_value: p.value, p_note: p.note || null, p_items: p.items })),
}
