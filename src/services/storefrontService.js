import { storefrontRepository as repo } from '../repositories/storefrontRepository'
import { money } from '../utils/format'

const handle = (v = '') => v.trim().replace(/^https?:\/\/(www\.)?(threads\.(net|com)|instagram\.com)\//i, '').replace(/^@/, '').split(/[/?]/)[0]
const tel = (v = '') => 'tel:' + v.replace(/[^\d+]/g, '')

/** Link nhắn tin tới cửa hàng theo cấu hình của admin. */
export const contactLinks = (shop) => ({
  threads: shop.threads ? `https://www.threads.net/@${handle(shop.threads)}` : null,
  instagram: shop.instagram ? `https://ig.me/m/${handle(shop.instagram)}` : null,
  phone: shop.phone ? tel(shop.phone) : null,
})
/** Link tới tài khoản/SĐT của khách (admin dùng để liên hệ lại). */
export const profileLink = (type, value) => (type === 'threads' ? `https://www.threads.net/@${handle(value)}` : type === 'instagram' ? `https://instagram.com/${handle(value)}` : tel(value))
export const orderMessage = (items) => 'Chào shop, mình muốn mua:\n' + items.map((i) => `- ${i.name} x${i.qty || 1}${i.price != null ? ` (${money(i.price)})` : ''}`).join('\n')

export const storefrontService = {
  get: () => repo.get(),
  submitInquiry: ({ items, ...f }) => repo.submitInquiry({ ...f, items: items.map((i) => ({ id: i.id, name: i.name, price: i.price ?? null, qty: i.qty || 1 })) }),
}
