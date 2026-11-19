import { supabase, unwrap, BUCKET } from '../lib/supabase'
const SELECT = '*, product_media(id,url,storage_path,media_type,position)'
export const productRepository = {
  list: async () => unwrap(await supabase.from('products').select(SELECT).order('created_at', { ascending: false })),
  get: async (id) => unwrap(await supabase.from('products').select(SELECT).eq('id', id).single()),
  create: async (p) => unwrap(await supabase.from('products').insert(p).select().single()),
  update: async (id, patch) => unwrap(await supabase.from('products').update(patch).eq('id', id).select().single()),
  remove: async (id) => unwrap(await supabase.from('products').delete().eq('id', id)),
  addMedia: async (rows) => unwrap(await supabase.from('product_media').insert(rows).select()),
  removeMedia: async (id) => unwrap(await supabase.from('product_media').delete().eq('id', id)),
  setMediaPosition: async (id, position) => unwrap(await supabase.from('product_media').update({ position }).eq('id', id)),
  async uploadFile(productId, file) {
    const { data } = await supabase.auth.getSession()
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${data.session.user.id}/${productId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
    if (error) throw error
    return { path, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
  },
  removeFiles: async (paths) => { if (paths.length) unwrap(await supabase.storage.from(BUCKET).remove(paths)) },
}
