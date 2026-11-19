import { scheduleRepository as repo } from '../repositories/scheduleRepository'
export const scheduleService = {
  list: () => repo.list(),
  save: (id, f) => {
    const body = { product_id: f.product_id, scheduled_date: f.scheduled_date, caption: f.caption || null, status: f.status }
    return id ? repo.update(id, body) : repo.create(body)
  },
  remove: (id) => repo.remove(id),
}
