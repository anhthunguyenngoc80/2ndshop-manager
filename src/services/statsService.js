import { sum } from '../utils/format'
import { inRange, bucketKey } from '../utils/dates'
import { ACTIVE_ORDER_STATUSES, PURCHASE_CATEGORY } from '../utils/constants'

const orderTotal = (o) => sum(o.order_items || [], (i) => i.quantity * i.unit_price)
const catName = (e) => e.expense_categories?.name || 'Khác'

/**
 * Hàm thuần: nhận dữ liệu thô + khoảng ngày, trả về chỉ số & dữ liệu biểu đồ.
 * Giá vốn (chi phí vốn) = giá nhập của sản phẩm + mọi khoản chi phí đã phát sinh (marketing, vận chuyển, đóng gói…).
 * Lợi nhuận = giá bán ra − giá vốn (không tách hàng đã bán / chưa bán).
 */
export function computeStats({ products, orders, expenses, range }) {
  // Số lượng ban đầu của sản phẩm = còn lại + đã giao (kho bị trừ khi giao)
  const soldQty = {}
  orders.filter((o) => o.status === 'delivered').forEach((o) => (o.order_items || []).forEach((i) => { soldQty[i.product_id] = (soldQty[i.product_id] || 0) + i.quantity }))
  const origQty = (p) => p.quantity + (soldQty[p.id] || 0)

  const batch = products.filter((p) => inRange(p.created_at, range)) // hàng nhập trong khoảng ngày
  const productCost = sum(batch, (p) => (p.cost_price || 0) * origQty(p))
  const expectedSales = sum(batch, (p) => (p.sale_price || 0) * origQty(p))

  const otherCosts = expenses.filter((e) => inRange(e.incurred_on, range)) // mọi khoản chi phí, tag nào cũng là chi phí vốn
  const capital = productCost + sum(otherCosts, (e) => e.amount)

  const delivered = orders.filter((o) => o.status === 'delivered' && inRange(o.delivered_at || o.created_at, range))
  const revenue = sum(delivered, orderTotal)
  const active = orders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status) && inRange(o.created_at, range))

  const byDay = {}
  delivered.forEach((o) => { const k = bucketKey(o.delivered_at || o.created_at, 'day'); byDay[k] ||= { name: k, revenue: 0, profit: 0 }; byDay[k].revenue += orderTotal(o); byDay[k].profit += orderTotal(o) })
  otherCosts.forEach((e) => { const k = bucketKey(e.incurred_on, 'day'); byDay[k] ||= { name: k, revenue: 0, profit: 0 }; byDay[k].profit -= e.amount })
  const costByCat = Object.entries(otherCosts.reduce((m, e) => ({ ...m, [catName(e)]: (m[catName(e)] || 0) + e.amount }), productCost ? { [PURCHASE_CATEGORY]: productCost } : {})).map(([name, value]) => ({ name, value }))

  const available = products.filter((p) => p.status !== 'sold')
  const soldCount = products.filter((p) => p.status === 'sold').length
  const stockQty = sum(available, (p) => p.quantity)
  return {
    products: { total: products.length, sold: soldCount, unsold: available.length, stockQty },
    collection: { collected: sum(active, (o) => o.amount_paid), receivable: sum(active, (o) => Math.max(orderTotal(o) - o.amount_paid, 0)) },
    summary: { capital, expectedSales, actualSales: revenue, expectedProfit: expectedSales - capital, actualProfit: revenue - capital },
    charts: { series: Object.values(byDay).sort((a, b) => a.name.localeCompare(b.name)), costByCat, stock: [{ name: 'Đã bán', value: soldCount }, { name: 'Tồn kho', value: stockQty }] },
    expensesInRange: expenses.filter((e) => inRange(e.incurred_on, range)).sort((a, b) => b.incurred_on.localeCompare(a.incurred_on)),
  }
}
