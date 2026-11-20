import { supabase, unwrap } from '../lib/supabase'
const uid = async () => (await supabase.auth.getSession()).data.session.user.id
export const settingsRepository = {
  get: async () => unwrap(await supabase.from('store_settings').select('*').maybeSingle()),
  create: async () => unwrap(await supabase.from('store_settings').insert({ shop_name: 'Cửa hàng' })),
  update: async (patch) => unwrap(await supabase.from('store_settings').update(patch).eq('user_id', await uid())),
}
