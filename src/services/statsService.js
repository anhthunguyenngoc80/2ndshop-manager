import { sum } from '../utils/format'
import { inRange, bucketKey } from '../utils/dates'
import { ACTIVE_ORDER_STATUSES, PURCHASE_CATEGORY } from '../utils/constants'

const orderTotal = (o) => sum(o.order_items || [], (i) => i.quantity * i.unit_price)
const orderCogs = (o) => sum(o.order_items || [], (i) => i.quantity * (i.unit_cost || 0))
const catName = (e) => e.expense_categories?.name || 'Khác'
const isSellingCost = (e) => catName(e) !== PURCHASE_CATEGORY // "Giá nhập" đã nằm trong chi phí vốn nên không tính lại

/** Hàm thuần: nhận dữ liệu thô + khoảng ngày, trả về toàn bộ chỉ số & dữ liệu biểu đồ. */
export function computeStats({ products, orders, expenses, range }) {
  const available = products.filter((p) => p.status !== 'sold')
  const stockQty = sum(available, (p) => p.quantity)
  const expectedSales = sum(available, (p) => (p.sale_price || 0) * p.quantity)
  const stockCost = sum(available, (p) => (p.cost_price || 0) * p.quantity)
  const soldCount = products.filter((p) => p.status === 'sold').length

  const delivered = orders.filter((o) => o.status === 'delivered' && inRange(o.delivered_at || o.created_at, range))
  const revenue = sum(delivered, orderTotal)
  const capitalCost = sum(delivered, orderCogs) // chi phí vốn = giá vốn hàng đã bán
  const active = orders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status) && inRange(o.created_at, range))
  const collected = sum(active, (o) => o.amount_paid)
  const receivable = sum(active, (o) => Math.max(orderTotal(o) - o.amount_paid, 0))

  const inPeriod = expenses.filter((e) => inRange(e.incurred_on, range))
  const actualList = inPeriod.filter((e) => e.kind === 'incurred' && isSellingCost(e))
  const plannedList = inPeriod.filter((e) => e.kind === 'planned' && isSellingCost(e))
  const actualSelling = sum(actualList, (e) => e.amount)
  const plannedSelling = sum(plannedList, (e) => e.amount)

  const byDay = {}
  const add = (k, field, v) => { byDay[k] ||= { name: k, revenue: 0, profit: 0 }; byDay[k][field] += v }
  delivered.forEach((o) => { const k = bucketKey(o.delivered_at || o.created_at, 'day'); add(k, 'revenue', orderTotal(o)); add(k, 'profit', orderTotal(o) - orderCogs(o)) })
  actualList.forEach((e) => add(bucketKey(e.incurred_on, 'day'), 'profit', -e.amount))
  const costByCat = Object.entries(actualList.reduce((m, e) => ({ ...m, [catName(e)]: (m[catName(e)] || 0) + e.amount }), {})).map(([name, value]) => ({ name, value }))

  return {
    products: { total: products.length, sold: soldCount, unsold: available.length, stockQty, stockValue: stockCost },
    revenue: { expectedSales, actual: revenue, collected, receivable },
    cost: { capital: capitalCost, expectedSelling: plannedSelling, actualSelling },
    profit: {
      expected: expectedSales - stockCost - plannedSelling, // giá bán hàng chưa bán − giá vốn hàng chưa bán − chi phí dự kiến
      actual: revenue - capitalCost - actualSelling,         // doanh thu đã giao − chi phí vốn − chi phí bán ra thực tế
    },
    charts: { series: Object.values(byDay).sort((a, b) => a.name.localeCompare(b.name)), costByCat, stock: [{ name: 'Đã bán', value: soldCount }, { name: 'Tồn kho', value: stockQty }] },
    expensesInRange: [...inPeriod].sort((a, b) => b.incurred_on.localeCompare(a.incurred_on)),
  }
}
