import { productRepository as repo } from '../repositories/productRepository'
import { emptyToNull, sortedMedia } from '../utils/format'

export function cleanProduct(form) {
  const o = emptyToNull(form)
  ;['cost_price', 'sale_price'].forEach((k) => { if (o[k] != null) o[k] = Number(o[k]) })
  if (o.quantity == null) delete o.quantity; else o.quantity = Number(o.quantity)
  return o
}
export function filterProducts(list, { search = '', status = 'all', sort = 'newest' }) {
  const q = search.trim().toLowerCase()
  const sorters = {
    newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    oldest: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    priceAsc: (a, b) => (a.sale_price || 0) - (b.sale_price || 0),
    priceDesc: (a, b) => (b.sale_price || 0) - (a.sale_price || 0),
    name: (a, b) => (a.name || '').localeCompare(b.name || '', 'vi'),
  }
  return list.filter((p) => (status === 'all' || p.status === status) && (!q || (p.name || '').toLowerCase().includes(q))).sort(sorters[sort])
}
async function uploadAll(productId, files, startPos) {
  const rows = []
  for (const [i, f] of files.entries()) {
    const { path, url } = await repo.uploadFile(productId, f)
    rows.push({ product_id: productId, url, storage_path: path, media_type: f.type.startsWith('video') ? 'video' : 'image', position: startPos + i })
  }
  if (rows.length) await repo.addMedia(rows)
}
export const productService = {
  list: () => repo.list(),
  get: (id) => repo.get(id),
  async create({ files = [], ...fields }) {
    const p = await repo.create(cleanProduct(fields))
    await uploadAll(p.id, files, 0)
    return p
  },
  update: (id, fields) => repo.update(id, cleanProduct(fields)),
  setSold: (id, sold) => repo.update(id, { status: sold ? 'sold' : 'available' }),
  async remove(product) {
    await repo.removeFiles(sortedMedia(product).map((m) => m.storage_path))
    await repo.remove(product.id)
  },
  addMedia: (product, files) => uploadAll(product.id, files, (product.product_media?.length || 0) + 1000),
  async removeMedia(m) { await repo.removeFiles([m.storage_path]); await repo.removeMedia(m.id) },
  async moveMedia(product, index, dir) {
    const list = sortedMedia(product), j = index + dir
    if (j < 0 || j >= list.length) return
    list.splice(j, 0, list.splice(index, 1)[0])
    await Promise.all(list.map((m, i) => repo.setMediaPosition(m.id, i)))
  },
}
