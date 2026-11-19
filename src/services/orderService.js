import { orderRepository as repo } from '../repositories/orderRepository'
import { sum } from '../utils/format'

export const orderTotal = (items) => sum(items, (i) => i.quantity * i.unit_price)
export const paymentStatusOf = (total, paid) => (paid <= 0 ? 'unpaid' : paid >= total ? 'paid' : 'partial')
const genCode = () => 'DH' + Date.now().toString().slice(-7)
const toItemRows = (orderId, items) => items.map((i) => ({ order_id: orderId, product_id: i.product_id, quantity: Number(i.quantity), unit_price: Number(i.unit_price), unit_cost: i.unit_cost ?? null }))
const header = (f, total) => ({
  customer_name: f.customer_name, phone: f.phone || null, address: f.address || null, note: f.note || null,
  payment_method: f.payment_method, amount_paid: Number(f.amount_paid) || 0,
  payment_status: paymentStatusOf(total, Number(f.amount_paid) || 0),
})
export const orderService = {
  list: () => repo.list(),
  history: (id) => repo.history(id),
  async create(f) {
    if (!f.items.length) throw new Error('Đơn hàng cần ít nhất 1 sản phẩm')
    const order = await repo.create({ ...header(f, orderTotal(f.items)), code: genCode(), status: 'pending' }) // luôn tạo ở trạng thái chờ: không đụng tới trạng thái sản phẩm
    await repo.insertItems(toItemRows(order.id, f.items))
    return order
  },
  async update(order, f) {
    if (!f.items.length) throw new Error('Đơn hàng cần ít nhất 1 sản phẩm')
    await repo.update(order.id, header(f, orderTotal(f.items)))
    if (!order.inventory_applied) { await repo.deleteItems(order.id); await repo.insertItems(toItemRows(order.id, f.items)) }
  },
  async setStatus(order, status) {
    if (order.inventory_applied && !['delivered', 'returned'].includes(status)) throw new Error('Đơn đã giao chỉ có thể chuyển sang "Hoàn hàng"')
    await repo.update(order.id, { status })
  },
  async remove(order) {
    if (order.inventory_applied) throw new Error('Đơn đã giao: hãy chuyển sang "Hoàn hàng" trước khi xóa')
    await repo.remove(order.id)
  },
}
