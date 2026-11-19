export const money = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n || 0)
export const dateVN = (d) => (d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('vi-VN') : '')
export const sum = (arr, fn) => arr.reduce((s, x) => s + (Number(fn(x)) || 0), 0)
export const emptyToNull = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === '' ? null : v]))
export const confirmDelete = (msg = 'Bạn chắc chắn muốn xóa? Hành động này không thể hoàn tác.') => window.confirm(msg)
export const sortedMedia = (p) => [...(p?.product_media || [])].sort((a, b) => a.position - b.position)
export const coverOf = (p) => sortedMedia(p).find((m) => m.media_type === 'image')?.url
