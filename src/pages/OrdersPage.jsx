import { useState, useMemo } from 'react'
import { Plus, Search, History } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { orderService, orderTotal } from '../services/orderService'
import { productService } from '../services/productService'
import { run } from '../lib/errors'
import { Spinner, Empty, Badge, Modal, Select, PageHeader } from '../components/ui'
import OrderForm from '../features/orders/OrderForm'
import { money, dateVN, confirmDelete } from '../utils/format'
import { ORDER_STATUS, PAYMENT_STATUS } from '../utils/constants'

const tone = { pending: 'amber', confirmed: 'blue', shipping: 'blue', delivered: 'green', cancelled: 'red', returned: 'red' }
export default function OrdersPage() {
  const { data: orders, loading, reload } = useAsync(orderService.list)
  const { data: products } = useAsync(productService.list)
  const [search, setSearch] = useState(''), [status, setStatus] = useState('all')
  const [editing, setEditing] = useState(null) // null | 'new' | order
  const [hist, setHist] = useState(null), [saving, setSaving] = useState(false)
  const list = useMemo(() => (orders || []).filter((o) => (status === 'all' || o.status === status) && (!search || [o.customer_name, o.phone, o.code].some((x) => (x || '').toLowerCase().includes(search.toLowerCase())))), [orders, search, status])
  const selectable = (products || []).filter((p) => p.status !== 'sold' && p.quantity > 0)
  const act = async (fn, msg) => { if (await run(fn, msg)) reload() }
  const save = async (form) => {
    setSaving(true)
    const ok = await run(() => (editing === 'new' ? orderService.create(form) : orderService.update(editing, form)), 'Đã lưu đơn hàng')
    setSaving(false); if (ok) { setEditing(null); reload() }
  }
  const showHistory = async (o) => { try { setHist({ order: o, rows: await orderService.history(o.id) }) } catch (e) { run(() => { throw e }) } }
  return (
    <>
      <PageHeader title="Đơn hàng"><button className="btn-primary" onClick={() => setEditing('new')}><Plus size={16} />Tạo đơn</button></PageHeader>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input className="input pl-9" placeholder="Tên, SĐT, mã đơn…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select options={{ all: 'Tất cả trạng thái', ...ORDER_STATUS }} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>
      {loading ? <Spinner /> : !list.length ? <Empty text="Chưa có đơn hàng" /> : <div className="grid gap-3 md:grid-cols-2">{list.map((o) => {
        const total = orderTotal(o.order_items)
        return (
          <div key={o.id} className="card space-y-2 p-3">
            <div className="flex items-start justify-between"><div><div className="font-semibold">{o.customer_name}</div><div className="text-xs text-slate-500">{o.code} · {dateVN(o.created_at)} · {o.phone}</div></div><Badge tone={tone[o.status]}>{ORDER_STATUS[o.status]}</Badge></div>
            <div className="text-xs text-slate-500">{o.order_items.map((i) => `${i.products?.name || 'SP'} ×${i.quantity}`).join(', ')}</div>
            <div className="flex justify-between text-sm"><span>Tổng <b>{money(total)}</b></span><span>Còn thu <b>{money(Math.max(total - o.amount_paid, 0))}</b></span></div>
            <Badge tone={o.payment_status === 'paid' ? 'green' : 'amber'}>{PAYMENT_STATUS[o.payment_status]}</Badge>
            <div className="flex gap-2">
              <select className="input !py-1" value={o.status} onChange={(e) => act(() => orderService.setStatus(o, e.target.value), 'Đã cập nhật trạng thái')}>{Object.entries(ORDER_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <button className="btn-outline" onClick={() => showHistory(o)}><History size={14} /></button>
              <button className="btn-outline" onClick={() => setEditing(o)}>Sửa</button>
              <button className="btn-outline text-red-600" onClick={() => confirmDelete() && act(() => orderService.remove(o), 'Đã xóa đơn')}>Xóa</button>
            </div>
          </div>)
      })}</div>}
      {editing && <Modal title={editing === 'new' ? 'Tạo đơn hàng' : `Sửa ${editing.code}`} onClose={() => setEditing(null)}><OrderForm order={editing === 'new' ? null : editing} products={selectable} submitting={saving} onSubmit={save} /></Modal>}
      {hist && <Modal title={`Lịch sử ${hist.order.code}`} onClose={() => setHist(null)}>{hist.rows.map((r) => <div key={r.id} className="border-b py-2 text-sm">{new Date(r.changed_at).toLocaleString('vi-VN')}: {r.from_status ? `${ORDER_STATUS[r.from_status]} → ` : ''}<b>{ORDER_STATUS[r.to_status]}</b></div>)}</Modal>}
    </>
  )
}
