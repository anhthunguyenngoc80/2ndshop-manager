import { expenseRepository as repo } from '../repositories/expenseRepository'
import { DEFAULT_EXPENSE_CATEGORIES } from '../utils/constants'
export const expenseService = {
  list: () => repo.list(),
  async categories() {
    let cats = await repo.listCategories()
    if (!cats.length) cats = await repo.createCategories(DEFAULT_EXPENSE_CATEGORIES)
    return cats
  },
  addCategory: (name) => repo.createCategories([name]),
  save: (id, f) => {
    const body = { name: f.name, amount: Number(f.amount), category_id: f.category_id || null, kind: f.kind, incurred_on: f.incurred_on, note: f.note || null }
    return id ? repo.update(id, body) : repo.create(body)
  },
  remove: (id) => repo.remove(id),
}
