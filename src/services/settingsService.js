import { settingsRepository as repo } from '../repositories/settingsRepository'
import { inquiryRepository as inquiries } from '../repositories/inquiryRepository'
export const settingsService = {
  async load() { let s = await repo.get(); if (!s) { await repo.create(); s = await repo.get() } return s },
  save: (f) => repo.update({ shop_name: f.shop_name.trim() || 'Cửa hàng', intro: f.intro || null, contact_phone: f.contact_phone || null, contact_threads: f.contact_threads || null, contact_instagram: f.contact_instagram || null, visible_fields: f.visible_fields }),
  inquiries: () => inquiries.list(),
  setInquiryStatus: inquiries.setStatus,
  removeInquiry: inquiries.remove,
}
