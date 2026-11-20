import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Trash2, Minus, Plus } from 'lucide-react'
import ContactModal from '../../features/shop/ContactModal'
import { useCart } from '../../hooks/useCart'
import { Empty } from '../../components/ui'
import { money } from '../../utils/format'

export default function CartPage() {
  const { shop, products } = useOutletContext()
  const cart = useCart()
  const [contact, setContact] = useState(false)
  const lines = cart.items.map((c) => ({ ...c, p: products.find((x) => x.id === c.id) }))
  const valid = lines.filter((l) => l.p?.in_stock).map((l) => ({ id: l.id, name: l.p.name || 'Sản phẩm', price: l.p.sale_price, qty: l.qty }))
  const priced = valid.length > 0 && valid.every((i) => i.price != null)
  const total = valid.reduce((s, i) => s + (i.price || 0) * i.qty, 0)
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Giỏ hàng</h1>
      {!lines.length ? <div><Empty text="Giỏ hàng trống" /><Link to="/shop" className="block text-center text-sm text-blue-600">Tiếp tục xem sản phẩm</Link></div> : <>
        <div className="card divide-y">{lines.map((l) => (
          <div key={l.id} className="flex items-center gap-3 p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">{l.p?.media?.find((m) => m.type === 'image') && <img src={l.p.media.find((m) => m.type === 'image').url} className="h-full w-full object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{l.p?.name || 'Sản phẩm'}</div>
              {l.p?.in_stock ? (l.p.sale_price != null && <div className="text-sm">{money(l.p.sale_price)}</div>) : <div className="text-xs text-red-600">Không còn bán — hãy xóa khỏi giỏ</div>}
              {l.p?.in_stock && <div className="mt-1 flex items-center gap-2"><button className="btn-outline !p-1" onClick={() => cart.setQty(l.id, l.qty - 1)}><Minus size={14} /></button><span className="w-6 text-center text-sm">{l.qty}</span><button className="btn-outline !p-1" onClick={() => cart.setQty(l.id, l.qty + 1)}><Plus size={14} /></button></div>}
            </div>
            <button onClick={() => cart.remove(l.id)} aria-label="Xóa"><Trash2 size={18} className="text-red-500" /></button>
          </div>))}</div>
        {priced && <div className="flex justify-between text-lg font-semibold"><span>Tạm tính</span><span>{money(total)}</span></div>}
        <div className="flex gap-2"><button className="btn-outline" onClick={() => cart.clear()}>Xóa giỏ</button><button className="btn-primary flex-1" disabled={!valid.length} onClick={() => setContact(true)}>Liên hệ để mua</button></div>
        <p className="text-xs text-slate-500">Shop chưa thanh toán online. Bấm "Liên hệ để mua" để nhắn hoặc để lại thông tin, cửa hàng sẽ xác nhận đơn với bạn.</p>
      </>}
      {contact && <ContactModal shop={shop} items={valid} onClose={() => setContact(false)} onSent={() => cart.clear()} />}
    </div>
  )
}
