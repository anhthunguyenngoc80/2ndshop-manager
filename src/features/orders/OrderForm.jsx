import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Field, Select } from '../../components/ui'
import { PAYMENT_METHOD, PAYMENT_STATUS } from '../../utils/constants'
import { orderTotal, paymentStatusOf } from '../../services/orderService'
import { money } from '../../utils/format'

export default function OrderForm({ order, products, submitting, onSubmit }) {
  const locked = !!order?.inventory_applied
  const [f, setF] = useState({
    customer_name: order?.customer_name || '', phone: order?.phone || '', address: order?.address || '', note: order?.note || '',
    payment_method: order?.payment_method || 'cod', amount_paid: order?.amount_paid || 0,
    items: (order?.order_items || []).map((i) => ({ product_id: i.product_id, name: i.products?.name, quantity: i.quantity, unit_price: i.unit_price, unit_cost: i.unit_cost })),
  })
  const [pick, setPick] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const total = orderTotal(f.items), paid = Number(f.amount_paid) || 0
  const addItem = () => {
    const p = products.find((x) => x.id === pick); if (!p) return
    setF((s) => s.items.some((i) => i.product_id === p.id)
      ? { ...s, items: s.items.map((i) => (i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i)) }
      : { ...s, items: [...s.items, { product_id: p.id, name: p.name || 'Chưa đặt tên', quantity: 1, unit_price: p.sale_price || 0, unit_cost: p.cost_price }] })
    setPick('')
  }
  const setQty = (id, q) => setF((s) => ({ ...s, items: s.items.map((i) => (i.product_id === id ? { ...i, quantity: Math.max(1, Number(q) || 1) } : i)) }))
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(f) }}>
      <Field label="Tên người nhận"><input required className="input" value={f.customer_name} onChange={set('customer_name')} /></Field>
      <div className="grid grid-cols-2 gap-2"><Field label="Số điện thoại"><input className="input" type="tel" value={f.phone} onChange={set('phone')} /></Field><Field label="Thanh toán"><Select options={PAYMENT_METHOD} value={f.payment_method} onChange={set('payment_method')} /></Field></div>
      <Field label="Địa chỉ giao hàng"><input className="input" value={f.address} onChange={set('address')} /></Field>
      <div>
        <div className="mb-1 text-xs font-medium text-slate-500">Sản phẩm {locked && '(đã giao — không thể sửa)'}</div>
        {f.items.map((i) => (
          <div key={i.product_id} className="mb-1 flex items-center gap-2 text-sm">
            <span className="flex-1 truncate">{i.name}</span><span className="text-slate-500">{money(i.unit_price)}</span>
            <input disabled={locked} type="number" min="1" className="input !w-16" value={i.quantity} onChange={(e) => setQty(i.product_id, e.target.value)} />
            {!locked && <button type="button" onClick={() => setF((s) => ({ ...s, items: s.items.filter((x) => x.product_id !== i.product_id) }))}><Trash2 size={16} className="text-red-500" /></button>}
          </div>))}
        {!locked && <div className="mt-2 flex gap-2"><select className="input" value={pick} onChange={(e) => setPick(e.target.value)}><option value="">Chọn sản phẩm…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name || 'Chưa đặt tên'} — {money(p.sale_price)}</option>)}</select><button type="button" className="btn-outline" onClick={addItem}>Thêm</button></div>}
      </div>
      <Field label="Số tiền đã thanh toán (₫)"><input className="input" type="number" min="0" value={f.amount_paid} onChange={set('amount_paid')} /></Field>
      <div className="card space-y-1 bg-slate-50 p-3 text-sm">
        <div className="flex justify-between"><span>Tổng tiền</span><b>{money(total)}</b></div>
        <div className="flex justify-between"><span>Còn phải thu</span><b>{money(Math.max(total - paid, 0))}</b></div>
        <div className="flex justify-between"><span>Trạng thái thanh toán</span><span>{PAYMENT_STATUS[paymentStatusOf(total, paid)]}</span></div>
      </div>
      <Field label="Ghi chú"><textarea className="input" rows={2} value={f.note} onChange={set('note')} /></Field>
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Đang lưu…' : 'Lưu đơn hàng'}</button>
    </form>
  )
}
