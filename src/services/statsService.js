import { sum } from '../utils/format'
import { inRange, bucketKey } from '../utils/dates'
import { ACTIVE_ORDER_STATUSES, PURCHASE_CATEGORY, MARKETING_CATEGORY } from '../utils/constants'

const orderTotal = (o) => sum(o.order_items || [], (i) => i.quantity * i.unit_price)
const orderCogs = (o) => sum(o.order_items || [], (i) => i.quantity * (i.unit_cost || 0))
const catName = (e) => e.expense_categories?.name || 'Khác'

/** Hàm thuần: nhận dữ liệu thô + khoảng thời gian, trả về toàn bộ chỉ số & dữ liệu biểu đồ. */
export function computeStats({ products, orders, expenses, range, group = 'day' }) {
  const available = products.filter((p) => p.status !== 'sold')
  const stockQty = sum(available, (p) => p.quantity)
  const expectedSales = sum(available, (p) => (p.sale_price || 0) * p.quantity)
  const expectedCost = sum(available, (p) => (p.cost_price || 0) * p.quantity)

  const delivered = orders.filter((o) => o.status === 'delivered' && inRange(o.delivered_at || o.created_at, range))
  const revenue = sum(delivered, orderTotal)
  const cogs = sum(delivered, orderCogs)
  const active = orders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status) && inRange(o.created_at, range))
  const collected = sum(active, (o) => o.amount_paid)
  const receivable = sum(active, (o) => Math.max(orderTotal(o) - o.amount_paid, 0))

  const incurred = expenses.filter((e) => e.kind === 'incurred' && inRange(e.incurred_on, range))
  const planned = expenses.filter((e) => e.kind === 'planned' && inRange(e.incurred_on, range))
  const purchase = sum(incurred.filter((e) => catName(e) === PURCHASE_CATEGORY), (e) => e.amount)
  const marketing = sum(incurred.filter((e) => catName(e) === MARKETING_CATEGORY), (e) => e.amount)
  const totalCost = sum(incurred, (e) => e.amount)
  const opex = totalCost - purchase // chi phí vận hành; giá vốn tính riêng qua unit_cost của hàng đã bán
  const plannedOpex = sum(planned.filter((e) => catName(e) !== PURCHASE_CATEGORY), (e) => e.amount)

  const byBucket = {}
  const add = (k, field, v) => { byBucket[k] ||= { name: k, revenue: 0, profit: 0 }; byBucket[k][field] += v }
  delivered.forEach((o) => { const k = bucketKey(o.delivered_at || o.created_at, group); add(k, 'revenue', orderTotal(o)); add(k, 'profit', orderTotal(o) - orderCogs(o)) })
  incurred.filter((e) => catName(e) !== PURCHASE_CATEGORY).forEach((e) => add(bucketKey(e.incurred_on, group), 'profit', -e.amount))
  const series = Object.values(byBucket).sort((a, b) => a.name.localeCompare(b.name))
  const costByCat = Object.entries(incurred.reduce((m, e) => ({ ...m, [catName(e)]: (m[catName(e)] || 0) + e.amount }), {})).map(([name, value]) => ({ name, value }))
  const soldCount = products.filter((p) => p.status === 'sold').length

  return {
    products: { total: products.length, sold: soldCount, unsold: available.length, stockQty, stockValue: sum(available, (p) => (p.cost_price || 0) * p.quantity) },
    revenue: { expectedSales, actual: revenue, collected, receivable },
    cost: { purchase, marketing, other: opex - marketing, total: totalCost, cogs },
    profit: { expected: expectedSales - expectedCost - plannedOpex, actual: revenue - cogs - opex },
    charts: { series, costByCat, stock: [{ name: 'Đã bán', value: soldCount }, { name: 'Tồn kho', value: stockQty }] },
    expensesInRange: [...incurred, ...planned].sort((a, b) => b.incurred_on.localeCompare(a.incurred_on)),
  }
}
