import { useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ArrowLeft, ZoomIn } from 'lucide-react'
import { toast } from 'sonner'
import ContactModal from '../../features/shop/ContactModal'
import ImageViewer from '../../components/ImageViewer'
import { useCart } from '../../hooks/useCart'
import { Badge, Empty } from '../../components/ui'
import { money, dateVN } from '../../utils/format'
import { VISIBLE_FIELD_LABELS } from '../../utils/constants'

export default function ShopProductPage() {
  const { id } = useParams(), nav = useNavigate()
  const { shop, products } = useOutletContext()
  const cart = useCart()
  const [idx, setIdx] = useState(0), [contact, setContact] = useState(false), [viewer, setViewer] = useState(false)
  const p = products.find((x) => x.id === id)
  if (!p) return <Empty text="Sản phẩm không tồn tại hoặc đã ngừng đăng bán" />
  const media = p.media || []
  const m = media[idx]
  const rows = Object.entries(VISIBLE_FIELD_LABELS).filter(([k]) => !['sale_price', 'measurements'].includes(k) && p[k] != null && p[k] !== '').map(([k, l]) => [l, k === 'created_at' ? dateVN(p[k]) : p[k]])
  const measurements = (p.measurements || []).filter((x) => x.label)
  const Row = ({ k, v }) => <div className="flex justify-between gap-4 p-3 text-sm"><span className="text-slate-500">{k}</span><span className="text-right">{v}</span></div>
  const item = { id: p.id, name: p.name || 'Sản phẩm', price: p.sale_price, qty: 1 }
  return (
    <div className="space-y-4">
      <button className="flex items-center gap-1 text-sm text-slate-500" onClick={() => nav(-1)}><ArrowLeft size={16} />Quay lại</button>
      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <div className="space-y-2 md:sticky md:top-16">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
            {m && (m.type === 'video' ? <video src={m.url} controls className="h-full w-full object-contain" />
              : <button className="h-full w-full cursor-zoom-in" onClick={() => setViewer(true)}><img src={m.url} alt={p.name} className="h-full w-full object-cover" /><span className="absolute bottom-2 right-2 rounded-full bg-black/60 p-1.5 text-white"><ZoomIn size={16} /></span></button>)}
          </div>
          {media.length > 1 && <div className="flex gap-2 overflow-x-auto">{media.map((x, k) => <button key={k} onClick={() => setIdx(k)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${k === idx ? 'border-slate-900' : 'border-transparent'}`}>{x.type === 'video' ? <video src={x.url} className="h-full w-full object-cover" /> : <img src={x.url} className="h-full w-full object-cover" />}</button>)}</div>}
        </div>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2"><h1 className="text-xl font-bold">{p.name || 'Sản phẩm'}</h1>{!p.in_stock && <Badge tone="red">{p.status === 'sold' ? 'Đã bán' : 'Hết hàng'}</Badge>}</div>
          {p.sale_price != null && <div className="text-2xl font-bold">{money(p.sale_price)}</div>}
          {!!rows.length && <div className="card divide-y">{rows.map(([k, v]) => <Row key={k} k={k} v={v} />)}</div>}
          {!!measurements.length && <div><div className="mb-1 text-sm font-semibold">Số đo</div><div className="card divide-y">{measurements.map((x, i) => <Row key={i} k={x.label} v={x.value} />)}</div></div>}
          {p.in_stock ? (
            <div className="flex gap-2">
              <button className="btn-outline flex-1" onClick={() => { cart.add(p.id); toast.success('Đã thêm vào giỏ hàng') }}>Thêm vào giỏ</button>
              <button className="btn-primary flex-1" onClick={() => setContact(true)}>Liên hệ để mua</button>
            </div>) : <p className="text-sm text-slate-500">Sản phẩm này hiện không còn để bán. <Link to="/shop" className="text-blue-600">Xem sản phẩm khác</Link></p>}
          {cart.has(p.id) && <Link to="/shop/cart" className="block text-sm text-blue-600">Sản phẩm đã có trong giỏ hàng → Xem giỏ hàng</Link>}
        </div>
      </div>
      {contact && <ContactModal shop={shop} items={[item]} onClose={() => setContact(false)} />}
      {viewer && <ImageViewer items={media} index={idx} onChange={setIdx} onClose={() => setViewer(false)} />}
    </div>
  )
}
