import { supabase, unwrap } from '../lib/supabase'
export const expenseRepository = {
  list: async () => unwrap(await supabase.from('expenses').select('*, expense_categories(name)').order('incurred_on', { ascending: false })),
  create: async (e) => unwrap(await supabase.from('expenses').insert(e)),
  update: async (id, e) => unwrap(await supabase.from('expenses').update(e).eq('id', id)),
  remove: async (id) => unwrap(await supabase.from('expenses').delete().eq('id', id)),
  listCategories: async () => unwrap(await supabase.from('expense_categories').select('*').order('name')),
  createCategories: async (names) => unwrap(await supabase.from('expense_categories').insert(names.map((name) => ({ name }))).select()),
}
